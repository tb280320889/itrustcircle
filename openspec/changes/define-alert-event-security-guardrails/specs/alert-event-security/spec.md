## ADDED Requirements
### Requirement: auth_token 安全存储

Sentinel 与 Tower MUST 使用平台安全存储 API 持久化 auth_token，禁止明文存储或日志输出。

#### Scenario: 安全存储强制
- **GIVEN** 系统需要保存 auth_token
- **WHEN** Sentinel 或 Tower 写入持久化存储
- **THEN** MUST 使用平台提供的安全存储能力（例如 Android Keystore 或等价实现）
- **AND** MUST 禁止明文落盘

#### Scenario: 日志脱敏
- **GIVEN** 系统记录认证或配对相关日志
- **WHEN** 输出包含 auth_token 的数据
- **THEN** MUST NOT 输出 auth_token 明文
- **AND** 若需要排查关联，MUST 输出 `token_fingerprint`（取 `SHA-256(auth_token)` 的前 8 个十六进制字符）
- **AND** MUST NOT 使用可逆编码或截取明文片段

#### Scenario: 安全存储不可用
- **GIVEN** 平台安全存储 API 不可用或返回错误
- **WHEN** 系统尝试保存 auth_token
- **THEN** MUST 阻断进入“已配对/可发送”状态
- **AND** MUST 显示可操作的修复提示
- **AND** MUST NOT 写入任何非安全持久化介质

### Requirement: HTTP 例外启用与风险提示

在可信局域网内允许 HTTP 传输时，系统 MUST 强制显示风险提示并要求用户显式启用。

#### Scenario: 显式启用 HTTP 例外
- **GIVEN** Tower 仅在可信局域网内可达
- **WHEN** 用户尝试启用 HTTP 传输
- **THEN** MUST 要求用户显式确认

#### Scenario: UI 风险提示
- **GIVEN** HTTP 传输被启用
- **WHEN** 用户查看连接配置
- **THEN** UI MUST 显示明确信息提示该配置存在安全风险

#### Scenario: 默认禁用
- **GIVEN** 未进行任何设置
- **WHEN** 系统初始化
- **THEN** HTTP 例外 MUST 默认禁用

#### Scenario: 可信局域网判定成立
- **GIVEN** 设备处于 Wi-Fi 网络且 Tower 地址为 RFC1918 私网 IP
- **WHEN** 进行可信局域网判定
- **THEN** 判定 MUST 为成立

#### Scenario: 可信局域网判定不成立
- **GIVEN** 设备处于蜂窝网络或 Tower 地址为公网域名
- **WHEN** 进行可信局域网判定
- **THEN** 判定 MUST 为不成立

#### Scenario: 条件不满足时自动禁用
- **GIVEN** HTTP 例外已启用
- **WHEN** 可信局域网判定不成立
- **THEN** MUST 自动禁用 HTTP 例外或阻断发送
- **AND** MUST 提示用户 HTTP 已被禁用或阻断

#### Scenario: 持续风险提示
- **GIVEN** HTTP 例外处于启用状态
- **WHEN** 用户查看连接配置或状态页面
- **THEN** UI MUST 持续显示“HTTP 例外已启用”的风险提示

#### Scenario: 应用重启后的恢复
- **GIVEN** HTTP 例外曾被启用且已确认
- **WHEN** 应用重启
- **THEN** 若可信局域网判定成立，HTTP 例外 MAY 恢复为启用状态
- **AND** 若可信局域网判定不成立，MUST 自动禁用并提示原因

#### Scenario: 例外状态再确认
- **GIVEN** HTTP 例外启用超过 24 小时
- **WHEN** 继续尝试在 HTTP 下发送
- **THEN** MUST 要求用户重新确认或自动禁用

#### Scenario: 网络边界变化触发重评估
- **GIVEN** HTTP 例外启用或可用
- **WHEN** 发生网络边界变化（传输类型变化或本机 IP 变化）
- **THEN** MUST 重新评估可信局域网判定
- **AND** 若判定不成立，按“自动禁用”场景执行
