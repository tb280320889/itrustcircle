# spec.md — 逐段修改建议（给 opencode 执行）

目标：
- 解决当前 spec 的“范围不一致”问题：一处约束 docs 全局，一处只约束 docs/index。
- 明确允许/禁止的“时间线/里程碑”口径（避免 PRD 时间线绑定工程）。
- 增加「冲突解决（authority precedence）」与「守护性检查（guardrails）」要求。

---

## A. 建议的手术式编辑（按段落定位）

### Edit A1 — 收敛并明确 `docs/` 全局禁止项 + PRD 里程碑例外规则
**Locate（在 `### Requirement: Docs Repository Structure` 下的 `Scenario: Sprints Directory Removed`）**

当前段落：
```md
#### Scenario: Sprints Directory Removed
- **WHEN** examining the repository structure
- **THEN** the directory `docs/sprints/` SHALL NOT exist
- **AND** no sprint planning, iteration status, or progress percentage content SHALL be present in docs/
```

**Replace with（替换为）**：
```md
#### Scenario: Sprints Directory Removed
- **WHEN** examining the repository structure
- **THEN** the directory `docs/sprints/` SHALL NOT exist

#### Scenario: No Enterprise Workflow Content in docs/
- **WHEN** reviewing any content under `docs/**`
- **THEN** `docs/**` SHALL NOT contain enterprise workflow artifacts such as:
  - Sprint planning / sprint numbers / iteration status
  - Progress percentages / status dashboards
  - Role-based navigation sections (developer, PM, tester, ops)
  - Engineering DoD (Definition of Done) checklists
  - Engineering ETA / delivery timeframes as commitments

#### Scenario: Product Milestones Allowed but Non-binding
- **WHEN** `docs/prd/**` or other product-context docs mention milestones, target dates, or roadmap items
- **THEN** they MAY exist as product intent
- **AND** they MUST NOT be treated as engineering commitments
- **AND** in case of conflict, `openspec/specs/**` SHALL take precedence for engineering truth
```

> 这样把“禁止项”统一扩展到 docs/**，同时给 PRD 一个“可存在但不绑定工程”的例外规则。

---

### Edit A2 — 新增 `Requirement: Conflict Resolution (Authority Precedence)`（把 precedence 写成可测试要求）
**Locate（建议插入位置：在 `### Requirement: README Engineering Truth` 之前）**

**Insert（新增一个 requirement）**：
```md
### Requirement: Conflict Resolution (Authority Precedence)

When statements conflict, the repository MUST have a single engineering source of truth.

#### Scenario: Precedence Rule
- **WHEN** a statement in `docs/**` conflicts with a statement in `openspec/specs/**`
- **THEN** `openspec/specs/**` SHALL be treated as the authoritative engineering truth
- **AND** `docs/**` SHALL be treated as non-authoritative product context

#### Scenario: Rule Must Be Stated in Entry Points
- **WHEN** reading `README.md` and root `AGENTS.md`
- **THEN** they SHALL explicitly state the precedence rule above
```

---

### Edit A3 — 将 `Docs Index Entry Point` 的禁止项改为“仅适用于 index”（避免与全局规则重复）
你已经在 Edit A1 中定义了 docs/** 的全局禁止项。
因此 `docs/index.md` 的禁止项可以保留，但建议加一句“这些要求聚焦 index 的极简入口属性”。

**Locate（在 `### Requirement: Docs Index Entry Point` 的描述句）**

当前：
```md
The `docs/index.md` file SHALL serve as a minimal entry point without enterprise workflow content.
```

**Replace with**：
```md
The `docs/index.md` file SHALL serve as a minimal entry point. It MUST remain free of expirable or workflow-oriented content.
```

---

### Edit A4 — 新增 `Requirement: Guardrails (Recommended)`（可选，但强烈建议）
**Locate（建议插入位置：文件末尾，`Root AGENTS.md Cleanup` 之后）**

**Insert**：
```md
### Requirement: Guardrails (Recommended)

The repository SHOULD prevent regressions where expirable workflow content re-enters docs.

#### Scenario: Automated Checks
- **WHEN** running CI or a pre-commit check
- **THEN** it SHOULD fail if:
  - `docs/sprints/` exists
  - `docs/index.md` contains prohibited workflow keywords (status/progress/ETA/DoD/sprint)
  - the root `AGENTS.md` references `.rules` as authoritative
```

---

## B. 建议的“最终成稿”（可直接覆盖 spec.md）

> opencode 可直接用下文替换 spec.md 全文件内容。

```md
## ADDED Requirements

### Requirement: Docs Repository Structure

The repository SHALL maintain a clear separation between product documentation and engineering specifications.

#### Scenario: Docs Directory Contents
- **WHEN** examining the `docs/` directory
- **THEN** the following subdirectories MAY exist:
  - `docs/prd/` - Product Requirements Documents
  - `docs/journeys/` - User journey definitions
  - `docs/failure-modes/` - Failure mode documentation
  - `docs/acceptance/` - Acceptance criteria
  - `docs/adr/` - Architecture Decision Records

#### Scenario: Sprints Directory Removed
- **WHEN** examining the repository structure
- **THEN** the directory `docs/sprints/` SHALL NOT exist

#### Scenario: No Enterprise Workflow Content in docs/
- **WHEN** reviewing any content under `docs/**`
- **THEN** `docs/**` SHALL NOT contain enterprise workflow artifacts such as:
  - Sprint planning / sprint numbers / iteration status
  - Progress percentages / status dashboards
  - Role-based navigation sections (developer, PM, tester, ops)
  - Engineering DoD (Definition of Done) checklists
  - Engineering ETA / delivery timeframes as commitments

#### Scenario: Product Milestones Allowed but Non-binding
- **WHEN** `docs/prd/**` or other product-context docs mention milestones, target dates, or roadmap items
- **THEN** they MAY exist as product intent
- **AND** they MUST NOT be treated as engineering commitments
- **AND** in case of conflict, `openspec/specs/**` SHALL take precedence for engineering truth

### Requirement: Conflict Resolution (Authority Precedence)

When statements conflict, the repository MUST have a single engineering source of truth.

#### Scenario: Precedence Rule
- **WHEN** a statement in `docs/**` conflicts with a statement in `openspec/specs/**`
- **THEN** `openspec/specs/**` SHALL be treated as the authoritative engineering truth
- **AND** `docs/**` SHALL be treated as non-authoritative product context

#### Scenario: Rule Must Be Stated in Entry Points
- **WHEN** reading `README.md` and root `AGENTS.md`
- **THEN** they SHALL explicitly state the precedence rule above

### Requirement: Docs Index Entry Point

The `docs/index.md` file SHALL serve as a minimal entry point. It MUST remain free of expirable or workflow-oriented content.

#### Scenario: Minimal Index Content
- **WHEN** opening `docs/index.md`
- **THEN** the file SHALL contain:
  - A clear statement that `docs/` provides product context and understanding aids
  - A reference to `openspec/` as the source of truth for engineering specifications
  - Links to the five preserved documentation directories (prd, journeys, failure-modes, acceptance, adr)

#### Scenario: No Expirable Content
- **WHEN** reviewing `docs/index.md`
- **THEN** the file SHALL NOT contain:
  - Current status percentages or progress metrics
  - Sprint numbers or iteration timelines
  - Role-based navigation sections (developer, PM, tester, ops)
  - Estimated completion dates or timeframes
  - DoD (Definition of Done) checklists

### Requirement: README Engineering Truth

The root `README.md` SHALL establish clear authority boundaries between docs and openspec.

#### Scenario: Authority Boundary Statement
- **WHEN** reading the root README.md
- **THEN** it SHALL explicitly state:
  - Product documentation lives in `docs/` (why / what - understanding context)
  - Engineering specifications live in `openspec/` (how / behavior - current truth)

#### Scenario: Guardian Core Invariant
- **WHEN** reading the root README.md
- **THEN** it SHALL include the Guardian Core invariant:
  - Guardian Core MUST NOT depend on WebView/UI or JS timers to stay alive
  - SvelteKit/Capacitor is the control plane (setup, status, diagnostics)
  - Safety-critical chain MUST be runnable in native core with thin bridge to TS UI

### Requirement: Root AGENTS.md Cleanup

The root `AGENTS.md` SHALL reference OpenSpec as the authoritative source for AI assistants.

#### Scenario: Removed .rules Reference
- **WHEN** reading the root `AGENTS.md`
- **THEN** it SHALL NOT reference `.rules` as an authoritative constraint file

#### Scenario: Authority Entry Order
- **WHEN** reading the root `AGENTS.md`
- **THEN** the authoritative entry order SHALL be:
  1. `README.md` - repo overview and how to run
  2. `openspec/project.md` - project rules and workflow
  3. `openspec/AGENTS.md` - AI conventions for OpenSpec-driven development
  4. `openspec/specs/**` - current truth for engineering behavior
  5. `docs/**` - product context and understanding aids

### Requirement: Guardrails (Recommended)

The repository SHOULD prevent regressions where expirable workflow content re-enters docs.

#### Scenario: Automated Checks
- **WHEN** running CI or a pre-commit check
- **THEN** it SHOULD fail if:
  - `docs/sprints/` exists
  - `docs/index.md` contains prohibited workflow keywords (status/progress/ETA/DoD/sprint)
  - the root `AGENTS.md` references `.rules` as authoritative
```
