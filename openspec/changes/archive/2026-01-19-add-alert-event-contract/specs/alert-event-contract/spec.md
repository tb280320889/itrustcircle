## MODIFIED Requirements

### Requirement: AlertEvent 数据模型

AlertEvent MUST 包含最小字段集合，支持 Sentinel → Tower 的报警事件上报。

#### Scenario: 必需字段完整上报
- **GIVEN** Sentinel 检测到 BLE 断联且倒计时结束未取消
- **WHEN** 生成 AlertEvent 并发送到 Tower
- **THEN** AlertEvent MUST 包含以下字段：
  - `api_version`: 字符串，格式为 `major.minor`（如 `"1.0"`）
  - `event_id`: UUID v4 字符串（RFC 4122）
  - `sentinel_id`: 字符串，标识 Sentinel 设备
  - `tower_id`: 字符串，标识目标 Tower 设备
  - `profile_id`: 字符串，用户配置的 Profile 类型
  - `timestamp`: 整数，Unix 时间戳（毫秒）
  - `trigger_reason`: 字符串，触发原因
  - `device_meta`: JSON 对象，包含 BLE 设备元信息
  - `cancelled_count`: 整数，本次守护期间的误报取消次数

#### Scenario: 可选字段按需上报
- **GIVEN** Sentinel 已获取位置权限且有可用位置数据
- **WHEN** 生成 AlertEvent 并发送到 Tower
- **THEN** AlertEvent MAY 包含可选字段：
  - `location`: JSON 对象，包含位置信息（`latitude`、`longitude`、`accuracy`、`timestamp`）
- **AND** 若位置权限不足或位置不可用，该字段可以缺失

#### Scenario: 设备元信息包含关键信息
- **WHEN** `device_meta` 字段存在
- **THEN** 该字段 MUST 包含：
  - `device_name`: 字符串，BLE 设备名称
  - `last_seen`: 整数，最后连接时间戳（毫秒）
- **AND** MAY 包含：
  - `rssi_last`: 整数，最后信号强度（dBm）

#### Scenario: 触发原因枚举
- **GIVEN** `api_version` 为 `"1.0"`
- **WHEN** `trigger_reason` 不等于 `"ble_disconnect"`
- **THEN** Tower MUST 返回 `400 Bad Request`
- **AND** 业务错误码为 `INVALID_PAYLOAD`

#### Scenario: 触发原因扩展策略
- **GIVEN** 未来需要新增 `trigger_reason`
- **WHEN** 新增触发原因进入 `1.x` 系列
- **THEN** MUST 通过 minor 版本扩展并更新允许值列表
- **AND** 不得在同一 major 下引入破坏兼容的语义变化

#### Scenario: 标识字段约束
- **WHEN** 提供 `sentinel_id`、`tower_id`、`profile_id`
- **THEN** 这些字段 MUST 为非空字符串
- **AND** 这些字段 SHOULD 仅包含 ASCII 字母、数字、`-`、`_`
- **AND** 这些字段 SHOULD 长度不超过 64 个字符

### Requirement: HTTP 协议规范

Sentinel MUST 使用标准 HTTP 协议向 Tower 发送 AlertEvent，Tower MUST 提供符合规范的端点。

#### Scenario: 请求端点与方法
- **GIVEN** Tower 运行在 `https://tower.example.com`
- **WHEN** Sentinel 发送 AlertEvent
- **THEN** 端点为 `POST /api/alerts`
- **AND** 请求头 MUST 包含：
  - `Content-Type: application/json`
  - `Authorization: Bearer <auth_token>`

#### Scenario: 请求体格式
- **GIVEN** AlertEvent 包含所有必需字段
- **WHEN** 构造 HTTP 请求体
- **THEN** 请求体为 JSON 格式，示例：
```json
{
  "api_version": "1.0",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "sentinel_id": "sentinel-001",
  "tower_id": "tower-001",
  "profile_id": "child",
  "timestamp": 1704067200000,
  "trigger_reason": "ble_disconnect",
  "device_meta": {
    "device_name": "Smart Watch",
    "last_seen": 1704067195000,
    "rssi_last": -65
  },
  "location": {
    "latitude": 31.2304,
    "longitude": 121.4737,
    "accuracy": 10.5,
    "timestamp": 1704067200000
  },
  "cancelled_count": 0
}
```

#### Scenario: 成功响应
- **GIVEN** Tower 成功处理 AlertEvent（首次或重复）
- **WHEN** Sentinel 收到 HTTP 响应
- **THEN** 状态码为 `200 OK`
- **AND** 响应体 MUST 为 JSON 格式：
```json
{
  "result": "created",
  "request_id": "req-uuid"
}
```
- **AND** `result` MUST 为 `created` 或 `duplicate`
- **AND** Tower MUST 生成唯一的 `request_id` 并返回，用于请求追踪

#### Scenario: 错误响应格式
- **GIVEN** Tower 检测到请求错误
- **WHEN** 返回错误响应
- **THEN** 响应体 MUST 包含以下结构：
```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Missing required field: event_id",
    "request_id": "req-uuid"
  }
}
```
- **AND** `request_id` MUST 存在，用于追踪请求

### Requirement: 幂等语义

Tower MUST 基于 `event_id` 实现幂等语义，确保重复请求不产生额外副作用。

#### Scenario: 首次事件处理
- **GIVEN** Tower 收到新的 `event_id`
- **WHEN** 处理请求
- **THEN** Tower MUST 记录该事件以支持后续幂等判定（实现可为持久化或等价机制）
- **AND** 响应体 `result` 为 `created`

#### Scenario: 重复事件幂等处理
- **GIVEN** Tower 已处理相同 `event_id`
- **WHEN** 再次收到相同 `event_id` 的请求
- **THEN** MUST 不产生额外副作用（包括但不限于重复通知、重复记录）
- **AND** 响应体 `result` 为 `duplicate`

#### Scenario: 幂等键唯一性
- **WHEN** Tower 处理 AlertEvent
- **THEN** `event_id` MUST 作为幂等键
- **AND** 同一 `event_id` 的请求 MUST 共享同一处理结果

### Requirement: 错误模型与错误码

Tower MUST 使用分层错误码体系（HTTP 状态码 + 业务错误码）表达不同的错误类型。

#### Scenario: HTTP 状态码映射
- **WHEN** Tower 返回响应
- **THEN** HTTP 状态码 MUST 符合以下映射：
  - `200 OK`：事件已处理（首次或重复）
  - `400 Bad Request`：请求格式错误、字段缺失、类型错误、版本不支持
  - `401 Unauthorized`：认证失败（缺少或无效的 `Authorization` Header）
  - `403 Forbidden`：认证成功但权限不足（如 `sentinel_id` 不匹配）
  - `500 Internal Server Error`：服务器内部错误（可重试）
  - `503 Service Unavailable`：服务暂时不可用（可重试）

#### Scenario: 业务错误码定义
- **WHEN** 返回错误响应
- **THEN** 业务错误码 `error.code` MUST 为以下之一：
  - `INVALID_AUTH`：认证信息无效
  - `FORBIDDEN`：权限不足（如 `sentinel_id` 不匹配）
  - `INVALID_PAYLOAD`：请求体格式错误
  - `MISSING_REQUIRED_FIELD`：缺少必需字段
  - `INVALID_FIELD_TYPE`：字段类型错误
  - `UNSUPPORTED_VERSION`：版本不支持
  - `INTERNAL_ERROR`：内部错误（可重试）
  - `SERVICE_UNAVAILABLE`：服务暂时不可用（可重试）

#### Scenario: 业务错误码选择规则
- **GIVEN** Tower 识别到请求错误
- **WHEN** 错误类型为字段缺失
- **THEN** MUST 返回 `MISSING_REQUIRED_FIELD`
- **AND** 不得改用 `INVALID_PAYLOAD`
- **WHEN** 错误类型为字段类型不匹配
- **THEN** MUST 返回 `INVALID_FIELD_TYPE`
- **WHEN** 错误类型为 JSON 解析失败、枚举值不合法或其他格式错误
- **THEN** MUST 返回 `INVALID_PAYLOAD`

#### Scenario: 错误消息稳定性
- **WHEN** 返回错误响应
- **THEN** `error.message` SHOULD 为调试用途
- **AND** 客户端 MUST NOT 依赖其内容进行业务判断
- **AND** 语言实现可自定

### Requirement: 重试语义

Sentinel MUST 基于错误码决定是否重试，并使用指数退避策略。

#### Scenario: 可重试错误触发重试
- **GIVEN** Sentinel 发送 AlertEvent 失败
- **WHEN** HTTP 状态码为 `500` 或 `503`
- **OR** 业务错误码为 `INTERNAL_ERROR` 或 `SERVICE_UNAVAILABLE`
- **THEN** Sentinel MUST 将事件放入重试队列
- **AND** MUST 使用指数退避策略并设置上限
- **AND** 重试次数 MUST 有最大限制
- **AND** 实现 MAY 提供配置；若提供配置，建议支持 `baseDelay`、`backoffFactor`、`maxDelay`、`maxRetries`

#### Scenario: 不可重试错误立即失败
- **GIVEN** Sentinel 发送 AlertEvent 失败
- **WHEN** HTTP 状态码为 `400`、`401`、`403`
- **OR** 业务错误码为 `INVALID_AUTH`、`FORBIDDEN`、`INVALID_PAYLOAD`、`MISSING_REQUIRED_FIELD`、`INVALID_FIELD_TYPE`、`UNSUPPORTED_VERSION`
- **THEN** Sentinel MUST 停止重试
- **AND** 标记事件为"发送失败"

#### Scenario: 重复事件不重试
- **GIVEN** Sentinel 收到 `200 OK` 响应
- **WHEN** `result` 为 `duplicate`
- **THEN** 标记事件为"已发送成功"
- **AND** 不触发重试

### Requirement: 版本化策略

AlertEvent 契约 MUST 支持版本化，确保 API 演进时的兼容性。

#### Scenario: 客户端声明版本
- **WHEN** Sentinel 发送 AlertEvent
- **THEN** 请求体 MUST 包含 `api_version` 字段
- **AND** 版本格式为语义化版本（`major.minor`），如 `"1.0"`

#### Scenario: 服务端向下兼容
- **GIVEN** 服务端支持 `1.x` 版本系列
- **WHEN** 收到 `api_version` 为 `"1.0"`、`"1.1"` 等请求
- **THEN** 服务端 MUST 正确处理请求
- **AND** 不因 minor 版本差异而拒绝请求

#### Scenario: 不支持的版本拒绝
- **GIVEN** 服务端仅支持 `1.x` 版本
- **WHEN** 收到 `api_version` 为 `"2.0"` 或未知版本
- **THEN** 服务端 MUST 返回 `400 Bad Request`
- **AND** 业务错误码为 `UNSUPPORTED_VERSION`
- **AND** 错误消息说明支持的版本范围（如 `"1.x"`）

#### Scenario: Minor 版本前向兼容
- **GIVEN** API 从 `1.0` 升级到 `1.1`
- **WHEN** 客户端发送 `api_version: "1.0"` 的请求
- **THEN** 服务端 MUST 正确处理请求
- **AND** 服务端 MUST 忽略未知 JSON 字段
- **AND** 新增字段 MUST 为可选

### Requirement: 安全与认证

Sentinel MUST 使用 Bearer Token 认证，Tower MUST 验证 Token 有效性并检查权限。

#### Scenario: Bearer Token 认证
- **GIVEN** Sentinel 已与 Tower 配对并获得 `auth_token`
- **WHEN** Sentinel 发送 AlertEvent
- **THEN** 请求头 MUST 包含 `Authorization: Bearer <auth_token>`
- **AND** `auth_token` 为强随机生成的字符串（至少 256 bits）

#### Scenario: Token 验证
- **WHEN** Tower 收到 AlertEvent
- **THEN** Tower MUST 验证 `Authorization` Header 中的 Token 有效性
- **AND** 若 Token 无效或缺失，返回 `401 Unauthorized`
- **AND** 业务错误码为 `INVALID_AUTH`

#### Scenario: 双向验证
- **GIVEN** Token 验证成功
- **WHEN** Tower 处理 AlertEvent
- **THEN** Tower MUST 检查 Token 关联的 `sentinel_id` 与请求体中的 `sentinel_id` 是否匹配
- **AND** MUST 检查 Token 关联的 `tower_id` 与请求体中的 `tower_id` 是否匹配
- **AND** 若任一不匹配，返回 `403 Forbidden`
- **AND** 业务错误码为 `FORBIDDEN`

#### Scenario: 传输加密要求
- **GIVEN** Tower 对外暴露在不可信网络或公网
- **WHEN** Sentinel 向 Tower 发送 AlertEvent
- **THEN** MUST 使用 HTTPS（TLS 1.2+）
- **AND** 禁止明文 HTTP

#### Scenario: 可信局域网例外
- **GIVEN** Tower 仅在可信局域网内可达
- **WHEN** Sentinel 向 Tower 发送 AlertEvent
- **THEN** MAY 使用 HTTP
- **AND** 必须由用户显式启用并在 UI 中显示风险警告

#### Scenario: Token 安全存储
- **WHEN** Sentinel 和 Tower 存储 `auth_token`
- **THEN** MUST 加密存储（使用平台提供的安全存储 API）
- **AND** 禁止明文存储或日志中输出
