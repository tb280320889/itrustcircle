## MODIFIED Requirements
### Requirement: 安全与认证

Sentinel MUST 使用 Bearer Token 认证，Tower MUST 验证 Token 有效性并检查权限。

#### Scenario: Bearer Token 认证
- **GIVEN** Sentinel 已与 Tower 配对并获得 `auth_token`
- **WHEN** Sentinel 发送 AlertEvent
- **THEN** 请求头 MUST 包含 `Authorization: Bearer <auth_token>`
- **AND** `auth_token` 为强随机生成的字符串（至少 256 bits）
- **AND** `auth_token` MUST 使用 base64url(32 bytes) 编码（长度约 43 字符，不含 padding）

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
- **AND** 可信局域网判定 MUST 与 alert-event-security 的定义保持一致

#### Scenario: Token 安全存储
- **WHEN** Sentinel 和 Tower 存储 `auth_token`
- **THEN** MUST 加密存储（使用平台提供的安全存储 API）
- **AND** 禁止明文存储或日志中输出
