# tasks.md — 逐段修改建议（给 opencode 执行）

目标：
- 调整执行顺序：先“扫引用/防断链”，再删除目录。
- 加入可追溯性（tag 可选）、全仓库 grep、以及“回归守护”步骤。
- 让 tasks 本身更适合 opencode 的一步步执行（每步都有可验证输出）。

---

## A. 建议的手术式编辑（按段落定位）

### Edit A1 — 在 Implementation 最前面加入“安全 tag（可选）+ 全局扫描”
**Locate（在 `## 1. Implementation` 下，当前第一条 1.1 之前）**

**Insert**：
```md
- [ ] 1.0 （可选）创建追溯 tag：`git tag docs-bmad-archive`（删除 `docs/sprints/**` 前）
- [ ] 1.0.1 全仓库扫描，确认当前引用点：
  - `rg -n "docs/sprints|sprints/" -S .`
  - `rg -n "sprint|progress|ETA|DoD|role" docs/ README.md AGENTS.md openspec/ -S`
```

---

### Edit A2 — 将删除 `docs/sprints/` 推迟到“修复入口文件”之后
**Locate（当前 1.5 删除 docs/sprints）**

**Action**：把“删除 docs/sprints”移动到完成 docs/index / README / AGENTS 更新之后，并在删除后再次扫描引用。

---

### Edit A3 — 增加“回归守护”任务（CI 或 pre-commit，哪怕是脚本也行）
**Locate（在 openspec validate 之前插入）**

**Insert**：
```md
- [ ] 1.6 （推荐）加入回归守护：在 CI 或 pre-commit 中加入检查（最小化也可以是脚本）
  - fail if `docs/sprints/` exists
  - fail if `docs/index.md` contains: status/progress/ETA/DoD/sprint
  - fail if root `AGENTS.md` references `.rules` as authoritative
```

---

## B. 建议的“最终成稿”（可直接覆盖 tasks.md）

```md
## 1. Implementation

- [ ] 1.0 （可选）创建追溯 tag：`git tag docs-bmad-archive`（删除 `docs/sprints/**` 前）

- [ ] 1.0.1 全仓库扫描，确认当前引用点：
  - `rg -n "docs/sprints|sprints/" -S .`
  - `rg -n "sprint|progress|ETA|DoD|role" docs/ README.md AGENTS.md openspec/ -S`

- [ ] 1.1 创建 OpenSpec spec delta: specs/docs-positioning/spec.md（文档定位规范）
- [ ] 1.2 重写 docs/index.md 为极简入口
- [ ] 1.3 更新 README.md：明确 docs vs openspec 边界，强化 Guardian Core 不变量
- [ ] 1.4 更新根 AGENTS.md：删除 .rules 引用，调整权威入口顺序

- [ ] 1.5 删除 docs/sprints/ 整个目录

- [ ] 1.5.1 删除后复扫引用，确保无断链：
  - `rg -n "docs/sprints|sprints/" -S .`

- [ ] 1.6 （推荐）加入回归守护：在 CI 或 pre-commit 中加入检查（最小化也可以是脚本）
  - fail if `docs/sprints/` exists
  - fail if `docs/index.md` contains: status/progress/ETA/DoD/sprint
  - fail if root `AGENTS.md` references `.rules` as authoritative

- [ ] 1.7 运行 openspec validate cleanup-docs-bmad-to-openspec --strict --no-interactive
- [ ] 1.8 运行 git status + git diff --stat 确认变更范围
```
