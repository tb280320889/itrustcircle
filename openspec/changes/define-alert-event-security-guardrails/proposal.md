# Change: AlertEvent 安全与传输护栏规范

## Why
当前契约只描述了认证与传输安全要求，但缺少明确的安全存储与 HTTP 例外提示规范，存在落地偏差风险。

## What Changes
- 新增“alert-event-security”能力，规范 auth_token 的安全存储要求
- 明确 HTTP 传输例外的启用条件与 UI 风险提示规范
- 建立与 alert-event-contract 的关联，作为后续原生实现的依据

## Impact
- Affected specs: alert-event-security, alert-event-contract
- Affected code: apps/mobile/src (后续 apply 阶段)
