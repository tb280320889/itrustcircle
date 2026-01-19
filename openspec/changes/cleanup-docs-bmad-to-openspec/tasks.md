## 1. Implementation

- [x] 1.0 （可选）创建追溯 tag：`git tag docs-bmad-archive`（删除 `docs/sprints/**` 前）

- [x] 1.0.1 全仓库扫描，确认当前引用点：
  - `rg -n "docs/sprints|sprints/" -S .`
  - `rg -n "sprint|progress|ETA|DoD|role" docs/ README.md AGENTS.md openspec/ -S`

- [x] 1.1 创建 OpenSpec spec delta: specs/docs-positioning/spec.md（文档定位规范）
- [x] 1.2 重写 docs/index.md 为极简入口
- [x] 1.3 更新 README.md：明确 docs vs openspec 边界，强化 Guardian Core 不变量
- [x] 1.4 更新根 AGENTS.md：删除 .rules 引用，调整权威入口顺序

- [x] 1.5 删除 docs/sprints/ 整个目录

- [x] 1.5.1 删除后复扫引用，确保无断链：
  - `rg -n "docs/sprints|sprints/" -S .`

- [x] 1.6 （推荐）加入回归守护：在 CI 或 pre-commit 中加入检查（最小化也可以是脚本）
  - fail if `docs/sprints/` exists
  - fail if `docs/index.md` contains: status/progress/ETA/DoD/sprint
  - fail if root `AGENTS.md` references `.rules` as authoritative

- [x] 1.7 运行 openspec validate cleanup-docs-bmad-to-openspec --strict --no-interactive
- [x] 1.8 运行 git status + git diff --stat 确认变更范围
