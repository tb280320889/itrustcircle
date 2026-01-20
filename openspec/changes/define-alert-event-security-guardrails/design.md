## Context
当前 AlertEvent 契约已定义“Token 安全存储”与“HTTP 例外提示”的要求，但缺少可落地的技术决策与边界定义，导致实现分歧风险较高。

## Current State Scan
- Sentinel 发送链路：`apps/mobile/src/modules/sentinel/infrastructure/alert-event-client.ts` 通过依赖注入的 `authToken` 拼接 `Authorization: Bearer <token>`。
- Tower 接收链路：`apps/mobile/src/routes/api/alerts/+server.ts` → `apps/mobile/src/modules/tower/application/alert-event-service.ts` 解析 `authorization` header 并调用 `AuthVerifier.verify(token)`。
- 认证相关测试：`apps/mobile/src/modules/sentinel/infrastructure/alert-event-client.spec.ts`、`apps/mobile/src/modules/tower/application/alert-event-service.spec.ts`、`apps/mobile/src/routes/api/alerts/+server.spec.ts`。
- 未发现 auth_token 安全存储、HTTP 例外开关、诊断导出与日志脱敏实现（代码搜索未命中 `auth_token` 文本）。

## Goals / Non-Goals
- Goals: 明确安全存储实现选择、Token 生命周期、HTTP 例外判定与 UI 风险提示规则。
- Non-Goals: 不做与本 change 无关的顺手重构；不改变既有业务语义（除非 spec 明确要求）。

## Decisions
- Decision: 安全存储方案优先采用原生安全存储（Android Keystore / iOS Keychain），若使用插件必须明确桥接范围与回退策略。
- Decision: 安全存储接口统一为 `SecureTokenStore`，定义在 `apps/mobile/src/modules/shared/security/secure-token-store.ts`，包含 `isAvailable`、`getToken`、`setToken`、`deleteToken`。
- Decision: Sentinel 实现位于 `apps/mobile/src/modules/sentinel/infrastructure/secure-token-store.ts`，Tower 实现位于 `apps/mobile/src/modules/tower/infrastructure/secure-token-store.ts`，通过 Capacitor 插件 `SecureStorageBridge` 访问 Android Keystore/iOS Keychain。
- Decision: Token 生命周期定义为“配对创建、解绑删除、重配覆盖、清缓存必清理”，禁止明文输出到日志与诊断导出。
- Decision: 安全存储不可用时采取“阻断发送 + 提示用户修复”，不允许降级为明文持久化。
- Decision: 可信局域网判定为“设备处于 Wi-Fi（非蜂窝）且 Tower 可达地址为 RFC1918 私网段，并在同一网段内可直连”。
- Decision: HTTP 例外仅在可信局域网条件满足且用户显式确认后启用，默认禁用。
- Decision: HTTP 例外开关与风险提示必须出现在连接配置页，并在首次启用时弹窗二次确认。
- Decision: HTTP 例外开关持久化键为 `http_exception_enabled` 与 `http_exception_confirmed_at`，默认值为 `false`，应用重启后仅在可信局域网成立时恢复启用。
- Decision: HTTP 传输仍需携带 Authorization 头，但必须提示风险，禁止在无提示情况下启用。
- Decision: 连接配置页与连接状态页需常驻风险提示，文案包含“HTTP 传输存在被窃听风险，仅建议在可信局域网短时开启”。
- Decision: 日志、诊断导出与错误上报仅允许输出 `token_fingerprint`，禁止记录 `auth_token` 明文或可逆替代物。

## Risks / Trade-offs
- 风险: 原生安全存储实现复杂度高 → 通过明确接口边界与后续实现 change 控制复杂度。
- 风险: 可信局域网判定误判 → 通过显式用户确认与默认禁用降低误用风险。

## Migration Plan
- 先输出规范与设计决策，作为后续原生实现 change 的唯一依据。
- 后续实现 change 需按本设计决策更新相关 UI、桥接层与存储实现。

## Verification
- 脚本: `rg -n "auth_token" apps/mobile/src apps/mobile/android apps/mobile/ios`，确保无明文日志输出。
- 手工: 在可信局域网 Wi-Fi 下启用 HTTP 例外，切换到蜂窝网络或更换 IP 后确认自动禁用并提示风险。
- 手工: 启用 HTTP 例外超过 24 小时后尝试发送，确认重新弹窗确认或自动禁用。

## Open Questions
- 是否需要支持“临时内存态 token”（仅在当前会话内）作为故障排查模式？
- 是否需要在诊断导出中记录“HTTP 例外启用状态”以便审计？
