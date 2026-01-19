# Change: AlertEvent 契约实现落地

## Why
当前已有 AlertEvent 契约规范，但缺少对 Sentinel/Tower 具体落地实现的工程要求，导致实现范围与验收边界不清晰。

## What Changes
- 新增“alert-event-implementation”能力，明确 Sentinel 与 Tower 的最小实现责任与交互边界
- 将实现要求与 `specs/alert-event-contract/spec.md` 建立引用关系，保证字段/协议/错误码一致
- 规划实现验收基于契约的成功与失败场景

## Impact
- Affected specs: alert-event-implementation, alert-event-contract
- Affected code: apps/mobile/src, apps/mobile/android (后续 apply 阶段)
