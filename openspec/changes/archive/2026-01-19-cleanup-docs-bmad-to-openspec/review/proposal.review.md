# proposal.md — 逐段修改建议（给 opencode 执行）

目标：
- 把「docs 是产品语境 / openspec 是工程真相」说得更硬（含冲突解决规则）。
- 处理“删除 sprints 目录但保留可追溯性”的治理细节。
- 增加可验证的 Validation / Done 条款，方便独立开发 + AI 自动检查。

---

## A. 建议的手术式编辑（按段落定位）

### Edit A1 — 在 `## Why` 末尾补充“冲突解决规则”（避免 PRD 时间线反向约束工程）
**Locate（在 proposal.md 的 `## Why` 段落末尾，紧接 `口径统一，AI/新人不会困惑` 之后）**

**Insert（新增一段）**：
```md
> 规则（冲突解决）：若 `docs/**` 的描述与 `openspec/specs/**` 冲突，以 `openspec/specs/**` 为准；`docs/**` 只提供产品语境与理解辅助，不作为工程约束。
```

---

### Edit A2 — 新增 `## Non-goals`（范围收敛，减少 AI/新成员误解）
**Locate（在 `## Why` 之后，`## What Changes` 之前）**

**Insert（新增一个 section）**：
```md
## Non-goals

- 不重写/不整理 `docs/prd/**`、`docs/journeys/**` 等内容的内部结构，仅做入口与定位。
- 不在 `docs/**` 维护任何工程进度、百分比、ETA/预计完成日期、Definition of Done、角色导航等“会过期的工程流程信息”。
- 不影响 `apps/**`、`android/**`、`ios/**` 等业务代码与运行逻辑。
```

---

### Edit A3 — 在 `### 2. 保留 docs...` 段落补充“允许但不绑定”的时间线说明
**Locate（在 proposal.md 的 `### 2. 保留 docs 辅助记录系统（不做深度重写）` 段落末尾）**

**Insert（新增两行说明）**：
```md
> 允许：PRD/用户旅程里可以出现产品侧目标日期/里程碑，但必须被视为「产品意图」而非工程承诺；工程交付的 DoD 与行为以 `openspec/specs/**` 为准。
```

---

### Edit A4 — 新增 `### 4. 可追溯性（Traceability）`（删除 sprints 前打 tag 或给出追溯指引）
**Locate（在 `### 3. 口径统一` 之后，`### 4. docs/index.md 极简入口` 之前）**

**Insert（新增一个小节）**：
```md
### 4. 可追溯性（Traceability）

- 删除 `docs/sprints/**` 前可选打一个轻量 tag（例如 `docs-bmad-archive`），便于将来审计“当时为什么这么做”。
- 不在工作树保留 sprint 文档，但仍可通过 git history/tag 找回历史内容。
```

> 注意：如果你不想引入 tag，可以只保留第二条。

---

### Edit A5 — 新增 `## Validation` 与 `## Done`（给 AI 可执行的验收口径）
**Locate（在 `## Impact` 之前插入两个 section）**

**Insert（新增）**：
```md
## Validation

- 全仓库无 `docs/sprints/` 目录，且无对该路径的引用。
- `docs/index.md` 不包含 status/进度/百分比/ETA/角色导航/DoD 等内容。
- 运行：`openspec validate cleanup-docs-bmad-to-openspec --strict --no-interactive` 通过。
- 运行：`rg -n "docs/sprints|sprints/" -S .` 无结果（或仅剩 git 历史/说明文本）。

## Done (Acceptance)

- ✅ `docs/index.md` 仅包含：定位说明 + openspec 指针 + 5 类目录链接。
- ✅ `README.md` 明确 authority boundary（docs vs openspec）并包含 Guardian Core 不变量。
- ✅ 根 `AGENTS.md` 不再引用 `.rules`，并按权威顺序指向 openspec。
- ✅ 删除 `docs/sprints/**` 后仍保留可追溯性说明（git history/tag）。
```

---

## B. 建议的“最终成稿”（可直接覆盖 proposal.md）

> opencode 可直接用下文替换 proposal.md 全文件内容（更少歧义）。

```md
# Change: 清理 BMAD 文档体系，对齐 OpenSpec 工程规范

## Why

当前仓库存在两套文档体系并行：
1. **BMAD 风格的企业级 docs/**：包含 Sprint 规划、角色导航、进度追踪、DoD 等会过期的内容
2. **OpenSpec 规范**：openspec/specs/** 作为 engineering current truth

这两套体系在「独立开发者 + AI + OpenSpec workflow」模式下产生冲突：
- 新 AI/新开发者会被 docs/index.md 中的「当前状态/百分比/预计时间」误导
- docs/sprints/** 中的企业迭代流程与 OpenSpec change-driven 模式重复
- 根 AGENTS.md 引用已不存在的 .rules，指向 docs/ 作为 source of truth

清理后确保：
- 不会有「2026-01-17 进度 100%」这类过期信息误导后续协作
- 明确区分 docs（产品理解辅助资料）vs openspec（工程真相）
- 口径统一，AI/新人不会困惑

> 规则（冲突解决）：若 `docs/**` 的描述与 `openspec/specs/**` 冲突，以 `openspec/specs/**` 为准；`docs/**` 只提供产品语境与理解辅助，不作为工程约束。

## Non-goals

- 不重写/不整理 `docs/prd/**`、`docs/journeys/**` 等内容的内部结构，仅做入口与定位。
- 不在 `docs/**` 维护任何工程进度、百分比、ETA/预计完成日期、Definition of Done、角色导航等“会过期的工程流程信息”。
- 不影响 `apps/**`、`android/**`、`ios/**` 等业务代码与运行逻辑。

## What Changes

### 1. 删除 BMAD 企业级工作流残留
- 删除 `docs/sprints/` 整个目录（含 README.md、sprint-0-1-cards.md）
- 重写 `docs/index.md`：移除所有「当前状态/百分比/预计时间/角色导航/企业流程」段落

### 2. 保留 docs 辅助记录系统（不做深度重写）
- `docs/prd/` - PRD 产品需求
- `docs/journeys/` - 用户旅程
- `docs/failure-modes/` - 故障模式
- `docs/acceptance/` - 验收标准
- `docs/adr/` - 架构决策

> 允许：PRD/用户旅程里可以出现产品侧目标日期/里程碑，但必须被视为「产品意图」而非工程承诺；工程交付的 DoD 与行为以 `openspec/specs/**` 为准。

### 3. 口径统一
- `README.md`：明确 docs vs openspec 边界，强化 Guardian Core 不变量
- 根 `AGENTS.md`：
  - 删除 `.rules` 引用（文件已存在但不再作为权威）
  - 权威入口顺序：README → openspec/project.md → openspec/AGENTS.md → openspec/specs/** → docs/**

### 4. 可追溯性（Traceability）
- 删除 `docs/sprints/**` 前可选打一个轻量 tag（例如 `docs-bmad-archive`），便于将来审计“当时为什么这么做”。
- 不在工作树保留 sprint 文档，但仍可通过 git history/tag 找回历史内容。

### 5. docs/index.md 极简入口
包含：
1. docs 定位说明（辅助资料）
2. openspec 是工程真相（指向 openspec/project.md 与 openspec/specs/**）
3. 只列出保留的 5 类目录链接（prd/journeys/failure-modes/acceptance/adr）

## Validation

- 全仓库无 `docs/sprints/` 目录，且无对该路径的引用。
- `docs/index.md` 不包含 status/进度/百分比/ETA/角色导航/DoD 等内容。
- 运行：`openspec validate cleanup-docs-bmad-to-openspec --strict --no-interactive` 通过。
- 运行：`rg -n "docs/sprints|sprints/" -S .` 无结果（或仅剩 git 历史/说明文本）。

## Done (Acceptance)

- ✅ `docs/index.md` 仅包含：定位说明 + openspec 指针 + 5 类目录链接。
- ✅ `README.md` 明确 authority boundary（docs vs openspec）并包含 Guardian Core 不变量。
- ✅ 根 `AGENTS.md` 不再引用 `.rules`，并按权威顺序指向 openspec。
- ✅ 删除 `docs/sprints/**` 后仍保留可追溯性说明（git history/tag）。

## Impact

- Affected docs: docs/index.md, docs/sprints/**, README.md, AGENTS.md
- Affected OpenSpec: 新增 specs/docs-positioning/spec.md（工程规范类 delta）
- 不影响 apps/**、android/**、ios/** 业务代码
- 开发效率提升：新 AI/开发者不会被过期文档误导
- 一致性提升：docs vs openspec 边界清晰，无重复信息
```
