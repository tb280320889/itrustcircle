# Project Context

## Purpose
iTrustCircle 是一个以“被动触发”为核心的个人安全/家庭守护 MVP：

当 Sentinel（随身端）检测到绑定的 BLE 设备断联后进入倒计时；若无人取消则生成 AlertEvent 并可靠上报给 Tower（家中旧手机/平板）；Tower 落库并通过至少一个强可达通道（MVP：Email/SMTP）通知 Contact（紧急联系人，无需安装 App）。

MVP 聚焦：稳定、低心智、低功耗地跑通“断联 → 倒计时 → 上报 → 通知信任人”的闭环，并具备可观测与诊断导出能力。

---

## Tech Stack
- Monorepo：`apps/mobile` 为主工程（移动端单应用覆盖 MVP）
- Frontend/App：SvelteKit + Capacitor v7（Android 优先）
- Minimum Android：API 23+
- Storage：SQLite（Tower 端事件与投递记录存档）
- Testing：Vitest（单元/集成为主）；E2E 可用 Playwright（按需启用）

---

## Project Conventions

### Code Style
- 语言/工具链：TypeScript 优先；保持类型清晰、避免 `any` 扩散。
- 命名：
  - 模块/能力：kebab-case（例如 `tower-notify`）
  - TS 标识符：camelCase / PascalCase
  - 常量：SCREAMING_SNAKE_CASE
- 变更风格：小步提交、一次只做一件事；避免“顺手重构”跨层扩散（跨层必须单独开 change）。

### Architecture Patterns

#### 模块主轴：按业务角色划分限界上下文
- 以三角色模型组织主要能力：`sentinel/`、`tower/`、`contact/`。
- 目标：从最小 SvelteKit app 演进到 module-first 结构（sentinel/tower/contact）。
- 约定：演进先做“目录骨架/规则”，再做代码搬迁与功能落地（避免一边搬一边改导致漂移）。

#### 分层：domain / application / infrastructure / ui（Clean Architecture / DDD 友好）
- Domain：纯业务规则/模型/不变量；不依赖框架与外部系统。
- Application：用例编排、流程/事务边界、跨聚合协调。
- Infrastructure：外部依赖实现（SQLite、HTTP、Capacitor/BLE 桥接、SMTP 等）。
- UI：页面装配与交互；SvelteKit routes 作为“薄壳”，避免承载业务逻辑。

#### 事件/链路视角（可靠性优先）
- 核心链路：BLE 断联 → 倒计时可取消 → 未取消生成 AlertEvent → 上报 Tower → Tower 去重/落库 → 触发通知。
- 可靠性原则：Guardian Core > UI（UI 崩溃不应影响核心链路继续运行）。
- 弱网/断网：Sentinel 需要离线队列与退避重试，网络恢复后自动补发。

#### 横切关注点
- 日志/错误/安全/遥测/诊断导出属于横切能力，集中管理，避免散落在业务代码中。
- 横切规则与落位（建议）：优先集中在 `aspects/`；平台/设备桥接集中在 `platform/`；Domain 不直接依赖上述层。

---

## Testing Strategy
- 目标：用“验收点”驱动测试（以关键闭环 Journeys 的验收条目为入口）。
- 分层建议：
  - Domain：纯单元测试（快速、确定性）
  - Application/Infrastructure：集成测试（含离线队列、重试、去重、落库）
  - E2E：按关键闭环（断联→倒计时→上报→通知）做最少用例（可后置）
- 避免不稳定的“浏览器/网络依赖”测试作为默认必跑（除非已经稳定配置好）。

---
## OpenSpec Usage Policy (Project Default)

默认规则：除“豁免项”外，本仓库变更都通过 OpenSpec change 驱动（proposal/tasks/spec → validate → apply → archive）。

### MUST use OpenSpec change when
- 新功能/新增能力（用户可感知）
- 行为语义变化（边界条件、错误处理、重试/幂等等）
- 架构/目录/分层/依赖边界变化
- 数据结构/存储/迁移相关（SQLite schema、记录结构）
- 安全/隐私/权限相关
- 跨模块/跨层改动（domain/app/infra/ui 互相牵连）

### MAY skip OpenSpec for
- 纯拼写/排版/注释/文档小修（不影响行为）
- 非破坏性配置调整（且不影响运行时行为）
- 只补测试以覆盖“已存在的既定行为”
- 小型修复且能明确归类为“恢复既定行为”（真正的 bugfix）


## Git Workflow

### Base Branch
- 主分支：`main`（若仓库实际使用 `master`，以实际为准，并确保文档与实际一致）

### Branch / PR Mapping
- 每个 OpenSpec change 对应一个分支/PR：
  - `feature/<change-id>`（用户可见功能/链路）
  - `chore/<change-id>`（结构/工具/文档/重构类）

### WIP Policy（轻量但可控）
- 默认建议：**Apply WIP = 1**
  - 同一时间只实现一个 change（会改 apps/ 源码/目录/构建）且未合并。
- 允许并行：**Planning WIP ≤ 3**
  - 允许同时起草多个 change（仅改 `openspec/changes/**`），不改业务代码。
- 例外：当两个 change 修改路径几乎不重叠且可独立验证时，可临时放宽 Apply WIP（由当前负责人自行承担整合成本）。

### Checkpoints（推荐，但不过度强制）
- 至少保留 2 个 checkpoint commit：
  1) spec checkpoint：proposal/tasks/spec 定稿 + `openspec validate <id> --strict --no-interactive` 通过
  2) final checkpoint：实现完成 + validate/tests 通过
- 中间是否增加 checkpoint：由风险触发
  - diff 变大
  - 即将做重构/迁移/高不确定操作
  - 任务主题切换（结构 → 文档 → 规范 → 代码）
  - 需要明确回滚点

### Optional: git worktree（默认禁止）
- 默认禁止 worktree；只有在确实需要同时维护长期 hotfix + 主线变更、或需要保留 main 只读对照工作区时，才临时启用。
- 启用时必须明确目的、时限与清理计划；完成后应及时删除 worktree。
- 不得将 worktree 作为日常开发的默认方式。

### Git Operating Procedure (for AI assistants)

**Rule 0: Git 环境检查（每次任务开始必须执行）**
- `git status`（确认工作区是否干净）
- `git branch -vv`（确认当前分支与远端追踪关系）
- `git log -5 --oneline`（确认最近提交上下文）
- `git diff --stat`（确认当前变更范围）

**Rule 1: Never commit on base branch**
- 不要在 `main/master` 上直接 commit。每个 OpenSpec change 必须在 `feature/<change-id>` 或 `chore/<change-id>` 分支上推进。

**Rule 2: Use path allow-list staging**
- Planning 阶段只允许 stage `openspec/**`。
- 禁止默认 `git add -A`；优先白名单 add：
  - `git add openspec/AGENTS.md openspec/project.md openspec/changes/<change-id>`

**Rule 3: Check before commit (MUST)**
每次 commit 前必须确认：
- `git status`（没有意外文件）
- `git diff --stat`（变更范围符合当前阶段）
- 若存在 change-id：`openspec validate <change-id> --strict --no-interactive` 通过

**Rule 3: Checkpoints (risk control, not over-fragmentation)**
- 每个 change 最少两个 checkpoint：
  1) spec checkpoint：proposal/tasks/spec 定稿 + validate 通过
  2) final checkpoint：实现完成 + validate/tests 通过
- 仅在风险触发时增加 checkpoint（diff 变大、即将重构/迁移、主题切换、需要回滚点）。

**Rule 4: Commit type conventions**
- `chore(openspec): ...`：workflow/spec/proposal/tooling-only
- `docs: ...`：纯文档
- `feat: ...`：实现用户可见行为/功能
- `fix: ...`：修复 bug（恢复既定行为）

### Rebase & Merge Permissions (Default: Rebase)

**Default sync strategy**
- 在准备 push/PR 前同步 base 分支：
  - `git fetch --all --prune`
  - `git rebase origin/main`（若 base 实际为 master，则改为 origin/master）

**Permissions**
- AI MAY 执行：`status/diff/log/fetch`，创建分支、常规提交；无冲突情况下执行 rebase。
- AI MAY resolve conflicts only for `openspec/**` 文档冲突，并必须给出变更摘要（diff --stat）。
- AI MUST NOT 执行（除非用户明确指令）：
  - 合并到 `main/master`
  - `push --force` / `push --force-with-lease`
  - 自动解决 `apps/**` 的复杂冲突

**If rebase requires force push**
- 需要用户明确指令后才允许使用：`git push --force-with-lease`


---

## OpenSpec Working Agreement (AI 协作契约)

### Proposal 阶段（Stage 1）
- 只允许写入 `openspec/changes/<id>/`（proposal/tasks/design + delta specs）。
- 禁止改业务代码（例如 `apps/**`），禁止顺手重构。
- 需要通过：`openspec validate <id> --strict --no-interactive`（至少在对外 review 前）。

### Apply 阶段（Stage 2）
- 按 `tasks.md` 顺序推进（可连续完成多条 task，但不要跳步、不要跨 scope “顺手重构”）。
- 每完成一条 task 立即勾选 `- [x]`（保持进度真实，不要最后一次性全勾）。
- Git 使用：
  - 推荐在 checkpoint 时提交（不要求 “1 task = 1 commit”）
  - push/PR 前确保工作区可解释、变更可 review

### 验证规则
- 在每个 checkpoint（或准备 push/PR 前）必须通过：
  - `openspec validate <id> --strict --no-interactive`（或全量 validate）
- 若引入代码变更，同时确保关键测试/构建通过（按具体 change 的 tasks 定义）。

### Archive 阶段（Stage 3）
- 合并并验证通过后，再归档 change（需要独立 PR 时按项目习惯执行）。
- 归档后应能通过：`openspec validate --strict --no-interactive`。

## Archive Policy (Stage 3)

Archive 的含义：
- `openspec/changes/<change-id>/` 是“进行中提案”
- 归档后移动到 `openspec/changes/archive/YYYY-MM-DD-<change-id>/`，作为不可变更的历史记录
- 若该 change 改变能力真相，则需同步更新 `openspec/specs/**` 作为 current truth

归档触发点（推荐）：
- apply 完成且 validate/tests/build 通过
- 已合并到 base 分支（或你明确认为已进入 current truth）

归档动作（必须）：
- Archive 必须使用 openspec archive <change-id> --yes，禁止手动 mv。归档后必须跑 openspec validate --all。
- 运行：`openspec validate --strict --no-interactive` 确认全库一致


---

## Domain Context

### 角色与职责
- Tower：家中设备作为控制台，接收 AlertEvent、SQLite 存档，并发送通知（MVP：Email/SMTP）。
- Sentinel：随身端，绑定 Tower 与 BLE 设备；断联触发倒计时；无人取消则上报（可离线补发）。
- Contact：紧急联系人，无需 App；通过邮件获取关键信息并行动（时间/原因/对象标识/建议动作；定位缺失需降级提示）。

### 关键数据/术语
- AlertEvent：最小报警事件（包含 event_id、timestamp、trigger_reason、device_meta 等）；Tower 负责幂等/去重与持久化。
- DeliveryRecord：通知投递记录（成功/失败/重试中），用于状态页与诊断。

---

## Important Constraints
- MVP 不引入复杂权限体系或多端同步体系（除非 ADR 明确要求）。
- 不做跨层大改；跨层必须拆卡/拆成单独 change。
- In-scope（MVP）：
  - 离线队列 + 退避重试
  - Tower 存档与投递记录
  - 状态页与诊断导出
  - Email/SMTP 通知
- Out-of-scope（MVP）：
  - 实时音视频/取证固化
  - 联邦中继/公共转发
  - 复杂多端同步
  - 付费短信/电话等
- Android 后台可靠性强依赖权限与省电策略；Sentinel 开始守护前必须做权限自检与引导。

---

## External Dependencies
- BLE 设备：被监测连接状态；断联触发链路。
- 网络可达性：
  - Sentinel → Tower 上报
  - Tower → SMTP 发信
  - Tower 可达方式（局域网/穿透/公网）由 ADR 决策。
- SMTP 邮件服务：MVP 强可达通道；需支持测试邮件、失败可见、可重试/重配入口。
- SQLite：Tower 本地存储 alert_events、delivery_records 等。

---
