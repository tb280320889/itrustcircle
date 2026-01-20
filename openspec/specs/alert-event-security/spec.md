# alert-event-security Specification

## Purpose

定义 AlertEvent 认证信息安全存储、HTTP 例外传输与日志脱敏要求，确保 Sentinel 与 Tower 在安全边界内运行。

## Requirements
### Requirement: 安全存储接口边界

Sentinel 与 Tower MUST 通过统一接口访问安全存储，禁止绕过安全存储边界。

#### Scenario: 统一接口访问
- **GIVEN** 系统需要读写 auth_token
- **WHEN** 调用安全存储能力
- **THEN** MUST 通过 `SecureTokenStore` 接口完成
- **AND** `SecureTokenStore` MUST 定义在 `apps/mobile/src/modules/shared/security/secure-token-store.ts`
- **AND** Sentinel 实现 MUST 位于 `apps/mobile/src/modules/sentinel/infrastructure/secure-token-store.ts`
- **AND** Tower 实现 MUST 位于 `apps/mobile/src/modules/tower/infrastructure/secure-token-store.ts`
- **AND** MUST 通过 `SecureStorageBridge` 访问 Android Keystore/iOS Keychain

### Requirement: auth_token 安全存储

Sentinel 与 Tower MUST 使用平台安全存储 API 持久化 auth_token，禁止明文存储或日志输出。

#### Scenario: 安全存储强制
- **GIVEN** 系统需要保存 auth_token
- **WHEN** Sentinel 或 Tower 写入持久化存储
- **THEN** MUST 使用平台提供的安全存储能力（例如 Android Keystore 或等价实现）
- **AND** MUST 禁止明文落盘

#### Scenario: 安全存储不可用
- **GIVEN** 平台安全存储 API 不可用或返回错误
- **WHEN** 系统尝试保存 auth_token
- **THEN** MUST 阻断进入“已配对/可发送”状态
- **AND** MUST 显示可操作的修复提示
- **AND** MUST NOT 写入任何非安全持久化介质

### Requirement: auth_token 生命周期与失败策略

auth_token MUST 遵循明确的生命周期并在失败时阻断发送。

#### Scenario: 配对创建
- **GIVEN** Sentinel 与 Tower 完成首次配对
- **WHEN** 生成新的 auth_token
- **THEN** MUST 立即写入安全存储

#### Scenario: 重配覆盖
- **GIVEN** Sentinel 与 Tower 重新配对
- **WHEN** 生成新的 auth_token
- **THEN** MUST 覆盖旧 token 并删除旧值

#### Scenario: 解绑删除
- **GIVEN** 用户解绑或重置配对
- **WHEN** 系统清理配对信息
- **THEN** MUST 删除安全存储中的 auth_token

#### Scenario: 清缓存必清理
- **GIVEN** 用户执行清缓存或重置应用数据
- **WHEN** 系统清理本地存储
- **THEN** MUST 同步删除 auth_token

#### Scenario: 存储失败阻断
- **GIVEN** auth_token 写入或读取失败
- **WHEN** Sentinel 尝试进入“可发送”状态
- **THEN** MUST 阻断发送并提示用户修复安全存储

### Requirement: HTTP 例外启用与风险提示

在可信局域网内允许 HTTP 传输时，系统 MUST 强制显示风险提示并要求用户显式启用。

#### Scenario: 显式启用 HTTP 例外
- **GIVEN** Tower 仅在可信局域网内可达
- **WHEN** 用户尝试启用 HTTP 传输
- **THEN** MUST 要求用户显式确认

#### Scenario: UI 风险提示
- **GIVEN** HTTP 传输被启用
- **WHEN** 用户查看连接配置或连接状态
- **THEN** UI MUST 显示“HTTP 传输存在被窃听风险，仅建议在可信局域网短时开启”的提示

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

### Requirement: HTTP 例外开关持久化

HTTP 例外开关 MUST 具备明确的持久化策略。

#### Scenario: 持久化字段
- **GIVEN** 用户确认启用 HTTP 例外
- **WHEN** 系统保存配置
- **THEN** MUST 持久化 `http_exception_enabled`
- **AND** MUST 记录确认时间 `http_exception_confirmed_at`
- **AND** MUST 使用本地配置存储（例如 Preferences）保存该状态

#### Scenario: 重启恢复策略
- **GIVEN** 应用重启且 `http_exception_enabled` 为 true
- **WHEN** 重新评估可信局域网
- **THEN** 若判定成立且确认时间未过期，MAY 恢复启用
- **AND** 若判定不成立或确认过期，MUST 自动禁用并提示原因

### Requirement: 日志与诊断脱敏

日志与诊断导出 MUST 遵循 auth_token 脱敏规范。

#### Scenario: 日志脱敏
- **GIVEN** 系统记录认证、配对或传输相关日志
- **WHEN** 输出包含 auth_token 的数据
- **THEN** MUST NOT 输出 auth_token 明文
- **AND** 若需要排查关联，MUST 输出 `token_fingerprint`（取 `SHA-256(auth_token)` 的前 8 个十六进制字符）
- **AND** MUST NOT 使用可逆编码或截取明文片段

#### Scenario: 诊断导出与错误上报
- **GIVEN** 生成诊断导出或错误上报
- **WHEN** 包含认证上下文字段
- **THEN** MUST 移除 auth_token 字段
- **AND** 若需要关联，MUST 使用 `token_fingerprint`
