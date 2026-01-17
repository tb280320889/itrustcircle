# 验收用例与检查清单（MVP 文档层）

## 1. 验收范围

- 本轮仅验收 docs/ 产物的一致性与可执行性（不验收功能实现）
- 所有验收点必须能在 Sprint 0/1 完成前通过文档走查验证

## 2. 文档完整性（Doc DoD）

- D-01：docs/index.md 存在且链接可导航
- D-02：PRD 存在且包含 Goals/Non-Goals/Scope/Requirements/NFR/Metrics
- D-03：三条旅程（Tower/Sentinel/Contact）均包含 A-F 六章
- D-04：Failure Modes 至少包含网络、数据一致性、交互三类
- D-05：ADR 至少 8 条且索引包含状态与验证摘要

## 3. 可执行检查步骤（命令与手动）

### 3.1 文档检查命令（在仓库根目录执行）

- `pwsh -NoProfile -Command "Test-Path docs/index.md"`
- `pwsh -NoProfile -Command "Test-Path docs/prd/mvp-prd.md"`
- `pwsh -NoProfile -Command "Test-Path docs/adr/adr-index.md"`
- `pwsh -NoProfile -Command "Select-String -Path docs/journeys/*.md -Pattern '^## [A-F]\\.' | Measure-Object | Select-Object -ExpandProperty Count"`

### 3.2 应用健康检查命令（可选）

- `pnpm -C apps/mobile check`
- `pnpm -C apps/mobile lint`
- `pnpm -C apps/mobile test`
- `pnpm -C apps/mobile build`

### 3.3 已知前置条件（仅当需要跑 test）

- `pnpm -C apps/mobile exec playwright install`

### 3.4 手动检查点

1. 打开 docs/index.md，逐个点击链接，确认目标文件存在
2. 在每个旅程文件中搜索 "## A." … "## F."，确认六章齐全
3. 打开 docs/adr/adr-index.md，确认至少 8 条且标明"待定/已定"

### 3.5 已验证状态（当前工作区）

- `pnpm -C apps/mobile check`：已通过（svelte-check 0 errors）
- `pnpm -C apps/mobile lint`：未通过（Prettier 报告 158 个文件样式问题；包含 android/ 产物路径）
- `pnpm -C apps/mobile test`：部分通过（服务器端测试通过；浏览器端测试因连接问题已临时禁用）
- `pnpm -C apps/mobile build`：未测试（需在功能实现后验证）

## 4. 功能验收用例（基于旅程 F 章）

### 4.1 Tower 验收用例

#### AC-TO-001：Tower 接收与存档 AlertEvent
- **关联旅程**：Tower Journey F1.1, F1.2
- **验收步骤**：
  1. Tower 启动并配置 SMTP
  2. Sentinel 触发 BLE 断联倒计时且未取消
  3. Tower 接收到 `POST /api/alerts` 请求
  4. 验证 SQLite alert_events 表包含对应的 event_id 记录
- **通过标准**：AlertEvent 落库成功，event_id 唯一

#### AC-TO-002：Tower 通知投递与追踪
- **关联旅程**：Tower Journey F1.2, F1.3
- **验收步骤**：
  1. Tower 接收 AlertEvent 并落库
  2. EmailProvider 触发 SMTP 发送
  3. 验证 delivery_records 表包含投递记录
  4. 状态页显示最近事件和投递结果
- **通过标准**：邮件发送成功，投递记录可追踪

### 4.2 Sentinel 验收用例

#### AC-SE-001：BLE 断联触发倒计时
- **关联旅程**：Sentinel Journey F1.1
- **验收步骤**：
  1. Sentinel 绑定 Tower 并选择 BLE 设备
  2. 开始守护状态
  3. 手动断开 BLE 设备或拉远至断联
  4. 验证倒计时 UI 出现且开始计时
- **通过标准**：断联必进倒计时，倒计时可取消

#### AC-SE-002：AlertEvent 生成与上报
- **关联旅程**：Sentinel Journey F1.2
- **验收步骤**：
  1. BLE 断联触发倒计时
  2. 倒计时结束未取消
  3. 验证生成包含 event_id, timestamp, trigger_reason 的 AlertEvent
  4. 验证尝试发送到 Tower
- **通过标准**：AlertEvent 包含最小必需字段

#### AC-SE-003：离线队列与网络恢复补发
- **关联旅程**：Sentinel Journey F1.3
- **验收步骤**：
  1. Sentinel 断网状态下触发 AlertEvent
  2. 验证事件进入本地队列（SQLite 可查）
  3. 恢复网络连接
  4. 验证事件自动补发到 Tower
- **通过标准**：离线队列可恢复，网络恢复后补发成功

### 4.3 Contact 验收用例

#### AC-CO-001：邮件通知内容完整性
- **关联旅程**：Contact Journey F1.1
- **验收步骤**：
  1. Tower 接收 AlertEvent 并触发邮件通知
  2. Contact 收到邮件
  3. 验证邮件包含：事件时间、触发原因、对象标识、位置链接、建议动作
  4. 点击地图链接验证可打开
- **通过标准**：邮件包含所有必需字段，链接可用

#### AC-CO-002：缺失信息的降级处理
- **关联旅程**：Contact Journey F1.3
- **验收步骤**：
  1. Sentinel 在无定位权限下触发事件
  2. Tower 发送邮件通知
  3. 验证邮件明确提示"定位不可用"
  4. 验证其他关键信息（时间、对象、原因）仍完整
- **通过标准**：缺失信息有明确降级提示，不出现空白

## 5. 故障模式验收用例

### 5.1 网络故障场景

#### AC-FM-N1：Sentinel 无网离线队列
- **关联 Failure Mode**：FM-N1 场景 A
- **验收步骤**：
  1. Sentinel 开启守护
  2. 启用飞行模式断网
  3. 触发 BLE 断联倒计时
  4. 验证界面显示"离线队列 N 条待发送"
  5. 恢复网络，验证自动补发
- **通过标准**：离线队列状态可见，网络恢复后补发成功

#### AC-FM-N3：系统杀死应用恢复
- **关联 Failure Mode**：FM-N3
- **验收步骤**：
  1. Sentinel 开始守护
  2. 手动清理后台应用
  3. 重新打开应用
  4. 验证显示"守护已中断"提示
  5. 按指引修复后能重新开始守护
- **通过标准**：应用杀死后状态可恢复，提供修复指引

### 5.2 权限故障场景

#### AC-FM-U1：权限不足阻断守护
- **关联 Failure Mode**：FM-U1
- **验收步骤**：
  1. 新安装应用，拒绝关键权限
  2. 尝试开始守护
  3. 验证权限自检页面显示缺失权限
  4. 点击修复跳转系统设置
  5. 授权后能正常开始守护
- **通过标准**：权限自检完整，缺项明确提示

## 6. 验收通过标准

### 6.1 文档层验收（Sprint 0/1）
- 所有文档 DoD 检查通过
- 旅程 F 章验收点与 ADR/Failure Modes 引用闭环
- 工程健康基线已知并记录

### 6.2 功能层验收（后续 Sprint）
- 所有 AC 用例可端到端执行
- 每个用例都有明确的验证步骤和通过标准
- 所有 Failure Mode 都有对应的恢复策略验证
