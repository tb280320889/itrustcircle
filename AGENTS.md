<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# iTrustCircle - Agent Guidance

## Read this first (authoritative references)

1. `README.md` - repo overview and how to run
2. `openspec/project.md` - project rules, workflow, architecture constraints
3. `openspec/AGENTS.md` - AI conventions for OpenSpec-driven development
4. `openspec/specs/**` - current truth for engineering behavior
5. `docs/**` - product context and understanding aids

## Non-negotiables
- Guardian Core reliability > UI. UI may crash; Guardian Core must keep running.
- Capacitor workflow is mandatory: `web build -> cap sync -> run/open`.
- Never hand-edit generated/copied web assets under `apps/mobile/android/` or `apps/mobile/ios/`
  (e.g. `apps/mobile/android/app/src/main/assets/public`). Always rebuild web then sync.

- WIP=1: Only work on ONE task card at a time. Do not start a second task until the current one is accepted.
- No cross-layer refactors in one change. If changes touch more than one layer (UI(Web), Plugin(Bridge), Native(Android)),
  split into multiple task cards and separate commits/PRs.
- 默认禁止 worktree；只有在确实需要同时维护长期 hotfix + 主线变更、或需要保留 main 只读对照工作区时，才临时启用。

## Git 环境检查（每次任务开始必须执行）
- `git status`：确认工作区是否干净、是否有未提交内容
- `git branch -vv`：确认当前分支与远端追踪关系
- `git log -5 --oneline`：确认最近提交上下文
- `git diff` / `git diff --stat`：确认变更范围可解释
- 禁止在 `main/master` 上直接提交；必须在 change 分支上推进

## Directory boundaries
- Web UI: `apps/mobile/src/` (SvelteKit)
- Capacitor config + web output: `apps/mobile/capacitor.config.*`, `apps/mobile/build/`
- Android native: `apps/mobile/android/`
- (Future) iOS: `apps/mobile/ios/`
- Specs & decisions: `openspec/` (must be updated when behavior/requirements change)

## Commands (prefer running from repo root)
- Install: `pnpm -C apps/mobile install`
- Web dev: `pnpm -C apps/mobile dev`
- Web build: `pnpm -C apps/mobile build`
- Sync native: `pnpm -C apps/mobile exec cap sync`
- Android run (CLI): `pnpm -C apps/mobile exec cap run android`
- Android open (Studio): `pnpm -C apps/mobile exec cap open android`

## Output expectations (every change request)
Always include:
1) Files to change (paths)
2) What changes (bullets)
3) Risks (bullets)
4) How to test (commands + manual steps)
5) Rollback (how to revert)

## Acceptance (MVP)
- BLE disconnect triggers countdown; if not cancelled -> AlertEvent queued and sent to Tower.
- Weak/No network: queue persists and flushes on recovery.
- Tower stores to SQLite and sends Email successfully.
- Diagnostics exports recent logs + config summary.
