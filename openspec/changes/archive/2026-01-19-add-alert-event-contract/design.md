## Context

当前 AlertEvent 契约信息分散在 ADR-0004（数据模型）和 ADR-0008（幂等去重）中，状态为"待定"。这些文档提供了设计思路和代码示例，但尚未形成可执行的工程规范。

### 现有问题

1. **缺乏统一的错误码体系**：ADR 文档未定义清晰的错误码映射，不同实现可能返回不一致的错误信息
2. **版本化策略不明确**：未定义如何管理 API 版本演进，未来修改可能破坏兼容性
3. **重试语义边界模糊**：哪些错误是可重试的？最大重试次数？退避策略细节？
4. **安全与认证缺失**：Tower 如何验证 Sentinel 的身份？如何防止伪造事件？
5. **与实现脱节**：ADR 中的示例代码可能不反映最佳实践，且缺少可验证的验收条件

### 利益相关者

- **Sentinel 模块**：需要生成符合契约的 AlertEvent，实现重试逻辑
- **Tower 模块**：需要验证、去重、存储事件，触发通知
- **后续实现**：离线队列、诊断导出、状态页都依赖明确的契约
- **运维与支持**：需要清晰的错误码和日志来排查问题

## Goals / Non-Goals

### Goals

- 定义明确、可执行的 AlertEvent 上报契约（字段、约束、可选性）
- 建立清晰的 HTTP 协议规范（端点、方法、格式）
- 规范幂等性机制（event_id 生成、重复处理）
- 定义重试语义（可重试错误码、退避策略、最大次数）
- 建立统一的错误码体系（HTTP 状态码、业务错误码、消息格式）
- 设计版本化策略（版本标识、兼容性规则、弃用流程）
- 明确安全要求（认证机制、传输加密、完整性校验）

### Non-Goals

- 本变更不实现具体的 HTTP 客户端/服务端代码（仅定义契约）
- 不定义 UI 交互逻辑（如错误提示文案）
- 不设计更复杂的通知渠道扩展
- 不定义观测、导出、保留、速率限制、防抖、配置等实现策略（拆分到后续 change）

## Decisions

### D1: 数据模型基于 ADR-0004，但添加版本字段

**决策**：AlertEvent 包含 ADR-0004 定义的的核心字段，并新增 `api_version` 字段。

**理由**：
- ADR-0004 已经验证了最小字段集的合理性
- 添加版本字段支持未来演进，避免破坏兼容性
- 版本格式采用语义化版本（`major.minor`），如 `1.0`

**数据结构**：
```json
{
  "api_version": "1.0",
  "event_id": "uuid-v4",
  "sentinel_id": "string",
  "tower_id": "string",
  "profile_id": "string",
  "timestamp": 1704067200000,
  "trigger_reason": "ble_disconnect",
  "device_meta": { ... },
  "location": { ... },  // 可选
  "cancelled_count": 0
}
```

**替代方案考虑**：
- **方案 A**：使用 HTTP Header 传递版本（`X-API-Version: 1.0`）
  - 优点：JSON body 保持简洁
  - 缺点：增加端点复杂度，离线队列需要额外存储 header
  - **结论**：不采用，优先简化实现

### D2: event_id 使用 UUID v4 而非哈希

**决策**：`event_id` 使用标准 UUID v4，而非 ADR-0008 中建议的哈希算法。

**理由**：
- UUID v4 生成简单，无依赖（`crypto.randomUUID()`）
- 天然全局唯一，无需担心哈希冲突
- 可读性更好，便于日志追踪和调试
- 避免哈希算法带来的性能开销和复杂性

**替代方案考虑**：
- **方案 B**：使用 ADR-0008 的 SHA256 哈希（基于业务上下文）
  - 优点：相同上下文生成相同 ID，天然去重
  - 缺点：需要管理业务上下文窗口，增加复杂性
  - **结论**：不采用，优先简化实现，去重在 Tower 端完成

### D3: HTTP 错误码分层：HTTP 状态码 + 业务错误码

**决策**：错误响应同时包含 HTTP 状态码和业务错误码。

**理由**：
- HTTP 状态码表达传输层语义（4xx/5xx）
- 业务错误码表达应用层语义（认证失败）
- 双层结构支持不同客户端处理逻辑
- 符合 REST 最佳实践

**成功响应格式**：
```json
{
  "result": "created",
  "request_id": "req-uuid"
}
```

**错误响应格式**：
```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Missing required field: event_id",
    "request_id": "req-uuid"
  }
}
```

**HTTP 状态码映射**：
- `200 OK`：事件已处理（首次或重复，幂等成功）
- `400 Bad Request`：请求格式错误、字段缺失、类型错误、版本不支持
- `401 Unauthorized`：认证失败（缺少认证信息）
- `403 Forbidden`：认证成功但权限不足（如 sentinel_id 不匹配）
- `500 Internal Server Error`：服务器内部错误
- `503 Service Unavailable`：服务暂时不可用（可重试）

**业务错误码列表**：
- `INVALID_AUTH`：认证信息无效
- `FORBIDDEN`：权限不足（如 sentinel_id 不匹配）
- `INVALID_PAYLOAD`：请求体格式错误
- `MISSING_REQUIRED_FIELD`：缺少必需字段
- `INVALID_FIELD_TYPE`：字段类型错误
- `UNSUPPORTED_VERSION`：版本不支持
- `INTERNAL_ERROR`：内部错误
- `SERVICE_UNAVAILABLE`：服务暂时不可用

**替代方案考虑**：
- **方案 C**：仅使用 HTTP 状态码，不定义业务错误码
  - 优点：简单
  - 缺点：无法区分 4xx 内部不同错误，客户端难以精细处理
  - **结论**：不采用，双层结构更好

### D4: 重试语义基于错误码分类

**决策**：定义可重试错误码列表，明确哪些错误应触发重试。

**理由**：
- 避免盲目重试所有错误（如认证失败应立即失败）
- 给出明确的客户端行为指引
- 与离线队列实现解耦（队列只依赖错误码判断）

**可重试错误码**：
- HTTP 状态码：`500 Internal Server Error`、`503 Service Unavailable`
- 业务错误码：`INTERNAL_ERROR`、`SERVICE_UNAVAILABLE`

**不可重试错误码**：
- HTTP 状态码：`400 Bad Request`、`401 Unauthorized`、`403 Forbidden`
- 业务错误码：`INVALID_AUTH`、`FORBIDDEN`、`INVALID_PAYLOAD`、`MISSING_REQUIRED_FIELD`、`INVALID_FIELD_TYPE`、`UNSUPPORTED_VERSION`

**重复事件特殊处理**：
- 返回 `200 OK` 且 `result = "duplicate"`
- 客户端可标记该事件为"已发送成功"，停止重试

### D5: 幂等性通过持久化唯一约束实现

**决策**：Tower 端通过持久化唯一约束实现幂等，重复请求返回 200 OK。

**理由**：
- 持久化唯一约束是可靠的去重机制
- 幂等性是接口语义，而非错误（不应返回 409）
- 简化客户端逻辑（重复请求无需特殊处理）

**幂等语义**：
- `event_id` 作为幂等键
- 重复请求不得产生额外副作用
- 返回 200 且 `result = "duplicate"`

**实现说明**：
- 具体存储实现（SQLite 或其他）在后续 Tower 存储类 change 中定义

### D6: 版本化策略：客户端声明版本，服务端向下兼容

**决策**：客户端通过 `api_version` 字段声明版本，服务端向下兼容 minor 版本。

**理由**：
- 显式版本声明避免隐式依赖
- 向下兼容保证客户端升级不影响现有功能
- Major 版本变更需要显式通知

**版本规则**：
- **Major 版本**：版本号第一段数字变化即为不兼容变更（例如从 1.0 → 2.0 或 2.1）
  - 新增必需字段
  - 删除字段
  - 修改字段语义
- **Minor 版本（X.Y）**：保持 major 不变，第二段数字变化（例如 1.0 → 1.1）
  - 新增可选字段
  - 字段类型放宽（如 string → string | null）
- 本契约仅使用 `major.minor` 两段，不定义 patch 段

**MVP 版本**：
- 初始版本：`1.0`
- 兼容性：服务端支持 `1.x` 系列

**弃用流程**：
1. 新版本发布后，旧版本标记为 `deprecated`（文档说明）
2. 给予至少一个大版本周期的过渡期
3. 服务端可拒绝过旧的 `api_version`（返回 400 Bad Request）

### D7: 安全与认证：Bearer Token 方式

**决策**：使用 Bearer Token 方式认证，Token 在配对时生成并存储。

**理由**：
- HTTP Bearer Token 是标准认证方式，实现简单
- 避免在请求体中暴露认证信息（污染业务数据）
- Token 与 sentinel_id/tower_id 绑定，实现双向验证

**认证流程**：
1. 配对时生成唯一 `auth_token`，存储在双方
2. Sentinel 发送事件时在 HTTP Header 中携带：`Authorization: Bearer <token>`
3. Tower 验证 token 有效性，并检查 token 对应的 sentinel_id/tower_id 是否匹配

**安全要求**：
- Token 使用强随机生成器生成（至少 256 bits）
- 传输层使用 HTTPS（生产环境强制）
- Token 不在日志中明文输出（脱敏处理）

**替代方案考虑**：
- **方案 D**：在请求体中添加 `auth_token` 字段
  - 优点：无需处理 HTTP Header
  - 缺点：污染业务数据结构，不符合 HTTP 最佳实践
  - **结论**：不采用，优先符合标准

## Risks / Trade-offs

### Risk 1: API 版本演进可能破坏兼容性

**风险**：Major 版本变更需要客户端升级，可能导致短期内不可用。

**缓解措施**：
- MVP 阶段仅有一个版本（`1.0`），暂不处理多版本共存
- 文档明确版本化规则和弃用流程
- 优先通过 Minor 版本扩展功能，避免 Major 变更

### Risk 2: 错误码粒度过细导致客户端复杂

**风险**：业务错误码分类过细，客户端需要处理大量错误情况。

**缓解措施**：
- MVP 阶段保持最小错误码集（8 个）
- 文档明确每个错误码的含义和处理建议
- 优先使用 HTTP 状态码粗粒度分类

### Trade-off 1: UUID v4 vs 哈希

**权衡**：UUID v4 简单但可读性略差；哈希可读性好但复杂度高。

**决策**：优先简化，选择 UUID v4，日志中可添加上下文提升可读性。

### Trade-off 2: 重复事件返回 200 vs 409

**权衡**：返回 200 表示幂等成功；返回 409 表示资源冲突。

**决策**：选择 200，幂等性是接口语义而非错误。

## Migration Plan

### 迁移步骤

1. **创建规范**（本变更）：定义 AlertEvent 契约
2. **更新 ADR**：标记 ADR-0004 和 ADR-0008 为"已定"，引用新规范
3. **实现验证**（后续变更）：基于规范实现 Sentinel 和 Tower 端
4. **集成测试**：验证端到端流程（断联 → 上报 → 存储 → 通知）

### 回滚方案

若规范设计有误：
1. 修改 `specs/alert-event-contract/spec.md` 中的定义
2. 更新 ADR 中的引用
3. 重新验证（`openspec validate --strict --no-interactive`）

### 依赖关系

- 本变更依赖：无（独立于现有实现）
- 后续变更依赖：所有涉及 AlertEvent 的实现（离线队列、去重、SQLite、SMTP 通知、诊断导出）

## Open Questions

1. **配对流程的认证细节**：
   - Token 何时生成？（配对时 vs 首次连接时）
   - Token 如何轮换？（过期时间、刷新机制）

2. **设备元信息字段细化**：
   - `device_meta.rssi_last` 是否必需？
   - 是否需要更多字段（如设备厂商、型号）

3. **触发原因扩展策略**：
   - 除 `ble_disconnect` 外的其他触发原因是否需要在 1.x 中扩展？
   - 未来新增触发原因的兼容策略是否需要更精细的区分？

**建议**：这些问题可在后续实现时通过增量变更解决，当前不阻塞规范定义。
