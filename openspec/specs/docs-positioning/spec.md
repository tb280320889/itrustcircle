# docs-positioning Specification

## Purpose
TBD - created by archiving change cleanup-docs-bmad-to-openspec. Update Purpose after archive.
## Requirements
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

The repository SHALL prevent regressions where expirable workflow content re-enters docs.

#### Scenario: Automated Checks
- **WHEN** running CI or a pre-commit check
- **THEN** it SHALL fail if:
  - `docs/sprints/` exists
  - `docs/index.md` contains prohibited workflow keywords (status/progress/ETA/DoD/sprint)
  - the root `AGENTS.md` references `.rules` as authoritative

