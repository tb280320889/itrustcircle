# Tower 用户旅程（MVP）

## A. 目标与范围

### A1. 用户目标
- 把一台家里设备变成“塔台”：能接收报警事件、存档、并通知紧急联系人（MVP：Email）。

### A2. 成功定义
- 收到来自 Sentinel 的 AlertEvent 后：SQLite 落库成功，并至少 1 个通知渠道投递成功。

## B. 参与者与前置条件

### B1. 参与者
- Tower（主）、Sentinel（配对）、Contact（接收通知）

### B2. 前置条件
- 塔台设备联网（至少能发 Email）。
- 塔台已配置通知渠道（建议允许未配置也能配对，但必须强提示“不会通知联系人”）。

## C. 主流程（Happy Path）

### C1. 首次启动与配置
1. 打开 App → 选择「Tower 模式」
2. 进入「塔台控制台」→ 配置通知（Email/SMTP）→ 发送测试邮件成功
3. 点击「生成配对二维码」→ 展示：tower_id、endpoint、token/密钥摘要、有效期提示

### C2. 接收报警与通知
1. Sentinel 上报 `POST /api/alerts`
2. Tower 校验/去重 → SQLite 存档（alert_events、delivery_records）
3. 触发通知策略（Email）→ Contact 收到强提醒
4. Tower 状态页显示：最近事件、投递结果（成功/失败/重试中）

## D. 备选/分支流程

### D1. 未配置通知也允许配对
- 允许生成二维码，但在二维码页与状态页醒目提示：未配置通知，报警将无法送达联系人。

### D2. 多个 Sentinel 配对
- Tower 维护已配对列表；事件列表按 profile/sentinel 维度可区分。

## E. 失败模式与恢复

### E1. Tower 离线/断网
- 仍可本地查看历史；新事件无法接收。
- 恢复网络后：通知失败记录可重试（由策略决定）。

### E2. 通知投递失败（SMTP 配置错误/被拦截）
- 状态页必须可见失败原因类别；提供“重试/重新配置/发送测试”的入口。

## F. 验收与测试点

### F1. 验收点（实现驱动）
- F1.1：收到 AlertEvent 必须落库（SQLite 可查到 event_id）。
- F1.2：落库后必须触发 EmailProvider，投递记录可追踪（成功/失败）。
- F1.3：状态页可看到最近 N 条事件 + 最近投递结果。

### F2. 手动检查步骤（后续 acceptance 可引用）
1. 启动 Tower → 配置 SMTP → 发送测试邮件成功
2. 用 Sentinel 触发一次报警 → Tower 事件列表出现该 event_id
3. 检查邮箱收到邮件；Tower 投递记录标记成功
