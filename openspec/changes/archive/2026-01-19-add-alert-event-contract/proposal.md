# Change: 定义 AlertEvent 上报契约（Sentinel → Tower）

## Why

当前 AlertEvent 的数据契约分散在 ADR-0004（最小数据模型）和 ADR-0008（幂等去重策略）中，作为"待定"状态存在。这些文档提供了设计思路，但未形成可执行的工程规范。后续实现（离线队列、去重、SQLite 存储、SMTP 通知、诊断导出）都需要依赖明确的字段定义、错误码、重试语义和版本化策略。

本变更将把 AlertEvent 上报契约从"设计讨论"提升为"current truth"，为所有后续实现提供可靠的工程依据。

## What Changes

- **新增** `specs/alert-event-contract/spec.md` 规范，定义 Sentinel → Tower 上报契约的完整工程要求：
  - AlertEvent 数据模型（字段、类型、约束、可选性）
  - HTTP 协议规范（端点、方法、请求/响应格式）
  - 幂等语义（event_id 作为幂等键，重复请求无副作用）
  - 重试语义（可重试错误、退避原则、不可重试条件）
  - 错误模型与错误码（HTTP 状态码 + 业务错误码）
  - 版本化策略（版本标识、兼容性规则、前向兼容）
  - 安全与认证（Token 认证、权限校验、传输要求）

- **限定范围**：本变更仅定义上报契约与互操作语义，不包含观测/导出/保留/防抖/配置等实现策略（这些拆分为后续 change）

- **更新** ADR-0004 和 ADR-0008 的状态从"待定"改为"已定"，引用新的 spec 作为实现依据

- **标记** `breaks-compatibility`：若存在任何已跑通的临时上报协议/字段，本契约将作为唯一基线并要求迁移

## Impact

### 受影响的规范
- **新增**: `specs/alert-event-contract/spec.md` - 新能力规范
- **更新**: `docs/adr/adr-0004-min-data-model.md` - 状态从"待定"改为"已定"
- **更新**: `docs/adr/adr-0008-idempotency.md` - 状态从"待定"改为"已定"

### 受影响的代码/系统
- **逻辑模块**（以 `repo-structure` 规范为准；本 change 不引入目录变更）：
  - Sentinel：AlertEvent 生成与上报用例
  - Tower：事件接收、幂等处理与存储
  - Shared：AlertEvent 类型与错误码

- **后续依赖的实现**:
  - 离线队列持久化（Sentinel 端）
  - Tower 事件存储与去重
  - SMTP 通知触发（Tower 端）
  - 诊断导出（聚合 AlertEvent 数据）
