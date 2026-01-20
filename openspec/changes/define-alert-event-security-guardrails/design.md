## Context
当前 AlertEvent 契约已定义“Token 安全存储”与“HTTP 例外提示”的要求，但缺少可落地的技术决策与边界定义，导致实现分歧风险较高。

## Goals / Non-Goals
- Goals: 明确安全存储实现选择、Token 生命周期、HTTP 例外判定与 UI 风险提示规则。
- Non-Goals: 本次不落地具体代码实现，仅形成可执行的规范与决策依据。

## Decisions
- Decision: 安全存储方案优先采用原生安全存储（Android Keystore / iOS Keychain），若使用插件必须明确桥接范围与回退策略。
- Decision: Token 生命周期定义为“配对创建、解绑删除、重配覆盖、清缓存必清理”，禁止明文输出到日志与诊断导出。
- Decision: 安全存储不可用时采取“阻断发送 + 提示用户修复”，不允许降级为明文持久化。
- Decision: 可信局域网判定为“设备处于 Wi-Fi（非蜂窝）且 Tower 可达地址为 RFC1918 私网段，并在同一网段内可直连”。
- Decision: HTTP 例外仅在可信局域网条件满足且用户显式确认后启用，默认禁用。
- Decision: HTTP 例外开关与风险提示必须出现在连接配置页，并在首次启用时弹窗二次确认。
- Decision: HTTP 传输仍需携带 Authorization 头，但必须提示风险，禁止在无提示情况下启用。

## Risks / Trade-offs
- 风险: 原生安全存储实现复杂度高 → 通过明确接口边界与后续实现 change 控制复杂度。
- 风险: 可信局域网判定误判 → 通过显式用户确认与默认禁用降低误用风险。

## Migration Plan
- 先输出规范与设计决策，作为后续原生实现 change 的唯一依据。
- 后续实现 change 需按本设计决策更新相关 UI、桥接层与存储实现。

## Open Questions
- 是否需要支持“临时内存态 token”（仅在当前会话内）作为故障排查模式？
- 是否需要在诊断导出中记录“HTTP 例外启用状态”以便审计？
