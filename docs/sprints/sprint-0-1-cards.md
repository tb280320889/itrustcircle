# Sprint 0/1 任务卡（仅文档与任务卡）

## WIP 规则

- WIP = 1：同一时间只允许进行 1 张卡

## 卡 00：记录工程健康基线（不改代码）

### Deliverable

- 在本文件补充“基线结果”小节（含命令与输出摘要）

### DoD（可执行）

1. 运行 `pnpm -C apps/mobile check` 并记录结果摘要
2. 运行 `pnpm -C apps/mobile lint` 并记录是否通过与错误摘要
3. 运行 `pnpm -C apps/mobile test`，若提示需安装浏览器则执行 `pnpm -C apps/mobile exec playwright install`，再重试并记录结果摘要

### 基线结果（当前工作区，2026-01-17）

- `pnpm -C apps/mobile check`：通过（svelte-check 0 errors）
- `pnpm -C apps/mobile lint`：失败（Prettier 报告 158 个文件样式问题；包含 android/ 产物路径）
- `pnpm -C apps/mobile test`：部分通过（服务器端测试通过；浏览器端测试因连接问题已临时禁用）
- `pnpm -C apps/mobile build`：未测试（需在功能实现后验证）

### Risks

- 基线不健康会影响后续实现节奏

### How to test

- 命令：按 DoD 逐条执行并把结果写回本文件

## 卡 01：建立 docs/ 信息架构与索引

### Deliverable

- docs/index.md
- docs/overview/README.md
- docs/prd/README.md
- docs/journeys/README.md
- docs/failure-modes/README.md
- docs/adr/README.md
- docs/acceptance/README.md
- docs/sprints/README.md

### DoD（可执行）

1. 手动检查：上述文件路径均存在
2. 打开 docs/index.md，所有链接可点击且目标文件存在
3. 运行 `pwsh -NoProfile -Command "Test-Path docs/index.md"`

### Risks

- 目录结构后续频繁变动导致链接失效

### How to test

- 手动：逐个点击 docs/index.md 的链接
- 命令：`pwsh -NoProfile -Command "Test-Path docs/index.md"`

## 卡 02：完成 PRD（MVP 文档层）

### Deliverable

- docs/prd/mvp-prd.md

### DoD（可执行）

1. 打开 PRD，确认包含以下标题：Goals/Non-Goals/Scope/Requirements/NFR/Metrics/Open Questions
2. PRD 的 Requirements 明确引用三条旅程的验收点（F 章）
3. 运行 `pwsh -NoProfile -Command "Select-String -Path docs/prd/mvp-prd.md -Pattern '^## ' | Measure-Object | Select-Object -ExpandProperty Count"`

### Risks

- 需求过宽导致后续跨层大改压力增大

### How to test

- 手动：走查 PRD 的 Scope 与 Non-Goals 是否清晰
- 命令：`pnpm -C apps/mobile check`

## 卡 03：补齐三条用户旅程 A-F 骨架

### Deliverable

- docs/journeys/tower.md
- docs/journeys/sentinel.md
- docs/journeys/contact.md

### DoD（可执行）

1. 在每个文件中确认包含 “## A.” 到 “## F.” 六章
2. 每章至少 2 条要点或步骤
3. 运行 `pwsh -NoProfile -Command \"Select-String -Path docs/journeys/*.md -Pattern '^## [A-F]\\\\.' | Measure-Object | Select-Object -ExpandProperty Count\"`

### Risks

- 旅程细节不足，导致 ADR 与 Failure Modes 无从落地

### How to test

- 手动：在 IDE 搜索 “## A.” 并检查六章齐全
- 命令：`pwsh -NoProfile -Command \"Select-String -Path docs/journeys/*.md -Pattern '^## [A-F]\\\\.'\"`

## 卡 04：建立 Failure Modes 清单与最小条目模板

### Deliverable

- docs/failure-modes/failure-modes.md

### DoD（可执行）

1. Failure Modes 至少包含三类：网络与设备、数据一致性、用户与交互
2. 至少包含 2 条具体条目（可为占位，但必须有验收方式字段）
3. 运行 `pwsh -NoProfile -Command \"Select-String -Path docs/failure-modes/failure-modes.md -Pattern '## 2\\.'\"`

### Risks

- 占位过多导致后续实现缺少约束力

### How to test

- 手动：检查每个条目是否包含“验收方式”
- 命令：`pwsh -NoProfile -Command \"Select-String -Path docs/failure-modes/failure-modes.md -Pattern '验收方式'\"`

## 卡 05：创建 ADR 索引与 8 条决策占位

### Deliverable

- docs/adr/adr-index.md
- docs/adr/adr-0001-client-shape.md
- docs/adr/adr-0002-min-identity.md
- docs/adr/adr-0003-storage-security.md
- docs/adr/adr-0004-min-data-model.md
- docs/adr/adr-0005-invite-channel.md
- docs/adr/adr-0006-status-machine.md
- docs/adr/adr-0007-handoff.md
- docs/adr/adr-0008-idempotency.md

### DoD（可执行）

1. 打开 adr-index.md，确认至少 8 条且每条有“状态”和“验证方式摘要”
2. 每个 ADR 文件包含：状态、背景、决策（待定可列候选）、验证方式（可执行）
3. 手动点击索引到每个 ADR 文件，确认链接有效

### Risks

- 决策长期待定导致后续实现无法推进

### How to test

- 手动：从索引逐条打开 ADR 文件并检查结构

## 卡 06：建立验收文档与命令清单

### Deliverable

- docs/acceptance/acceptance.md

### DoD（可执行）

1. 验收文档包含“命令（在仓库根目录执行）”并列出 lint/check/test/build
2. 验收文档包含至少 3 个手动检查点
3. 手动填写“已验证状态（当前工作区）”并更新错误摘要（若有）

### Risks

- 验收项过于抽象，无法约束后续实现

### How to test

- 手动：对照验收文档逐项检查
