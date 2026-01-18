# Design: Module-First Architecture Skeleton

## Context

iTrustCircle 项目采用 Clean Architecture / DDD 启发式方法，核心是三个模块（sentinel、tower、contact）。目前代码库是最小 SvelteKit 设置，缺少清晰的模块边界。随着功能增量添加，需要确保稳定归位并避免跨层污染。

**约束条件：**
- MVP 重点：可靠性优先于优雅
- Guardian Core 必须持续运行，即使 UI 崩溃
- WIP=1：同一时间仅允许一个活动变更
- 单个变更中不做跨层重构

**利益相关者：**
- 未来开发团队（sentinel/tower/contact 功能添加）
- 维护团队（可靠性和诊断）
- Contact（紧急通知，无需安装 App）

## Goals / Non-Goals

**Goals：**
- 建立 module-first 目录结构，未来无需重组
- 定义清晰的层职责和依赖方向
- 支持可预测的功能归位（给定功能，spec 必须能识别 module/layer）
- 防止跨层污染（通过明确规则）
- 为未来 lint/CI enforcement 建立框架

**Non-Goals：**
- 迁移现有代码（将在单独变更中进行）
- 实现 lint/CI enforcement（未来变更）
- 添加新业务功能
- 优化性能或构建流程
- 添加测试基础设施

## Decisions

### Decision 1: Module-First Structure

**What：** 创建 `modules/{sentinel,tower,contact}/{domain,application,infrastructure,ui}` 层次结构

**Why：**
- 与 project.md 的三角色模型对齐（sentinel/tower/contact 作为限界上下文）
- 按业务角色而非技术层分离关注点
- 支持按模块独立开发和测试
- 遵循 DDD 的限界上下文原则

**Alternatives Considered：**
- Layer-first (`domain/{sentinel,tower,contact}/`)：拒绝，因为功能跨越多层，使功能一致性更难处理
- Monolithic flat structure：拒绝，由于缺乏边界

### Decision 2: Code-Level Import Rules（而非箭头图）

**What：** 使用明确的代码级 import 规则代替依赖箭头图

**Why：**
- 箭头图（UI → Infrastructure → Application → Domain）易被误读为"UI 可以直接 import Infrastructure"
- 代码级规则精确描述每层允许 import 谁和禁止 import 谁
- 避免"逻辑等价但误导"的风险

**Import Rules（代码级）：**

- **`domain/` 层：**
  - 允许：本模块 `domain/` + `modules/shared/`（仅纯类型/工具）
  - 禁止：`platform/`、任何框架/外部依赖、`infrastructure/`、`ui/`、`aspects/`

- **`application/` 层：**
  - 允许：`domain/` + `aspects/`
  - 禁止：`infrastructure/`、`ui/`、`platform/`

- **`infrastructure/` 层：**
  - 允许：`domain/` + `application/` + `platform/` + `aspects/`
  - 禁止：`ui/`

- **`ui/` 层：**
  - 允许：`application/` + `aspects/`
  - 禁止：`infrastructure/`、`platform/`、`domain/`（直接 import）

**Alternatives Considered：**
- 箭头图（UI → Infrastructure → Application → Domain）：拒绝，易被误读
- 三层（domain/app/ui，infrastructure 在 app 中）：拒绝，技术关注点泄漏到应用层

### Decision 3: Platform/Aspects Visibility Rules

**What：** 明确 Platform 和 Aspects 的可见性边界

**Why：**
- Domain 纯度要求：domain 不得被日志/错误处理等横切关注点"拖下水"
- Platform bridge isolation：platform 仅 infrastructure 可访问，避免业务代码直接调用 native

**Visibility Rules：**

- **`platform/`：**
  - 允许被：`infrastructure/` 层 import
  - 禁止被：`domain/`、`application/`、`ui/` 层 import

- **`aspects/`：**
  - 允许被：`application/`、`infrastructure/`、`ui/` 层 import
  - 禁止被：`domain/` 层 import

**Rationale：**
- Domain 必须保持纯净，不依赖任何横切关注点或平台桥接
- Platform 是 native 桥接，仅 infrastructure 需要直接访问
- Aspects 是横切能力（日志/错误/遥测），非 domain 关注点

**Alternatives Considered：**
- Platform/aspects "MAY be imported by any layer"：拒绝，与 domain 纯度规则冲突

### Decision 4: SvelteKit Routes Physical Location

**What：** SvelteKit 文件路由仍放在 `apps/mobile/src/routes/**`，`modules/*/ui/` 用于存放 controller/adapter/stores/组件

**Why：**
- SvelteKit 框架约束：file-based routing 要求路由文件在 `routes/` 目录
- 保持框架约定，避免与 SvelteKit 打架
- `modules/*/ui/` 存放业务逻辑（controller、stores、组件、页面装配）

**Directory Split：**

- `apps/mobile/src/routes/**`：SvelteKit 路由文件（框架约束）
- `modules/*/ui/`：route handler 的 controller/adapter、Svelte stores、组件、页面装配逻辑

**Route File Responsibilities：**
- 允许：HTTP 匹配、参数解析、输入格式校验、调用 application layer、渲染响应
- 禁止：业务编排、直接调用 infrastructure（SQLite/HTTP/SMTP）、复杂状态管理

**Alternatives Considered：**
- 将 routes 移到 `modules/*/ui/routes/`：拒绝，违反 SvelteKit 框架约定

### Decision 5: Cross-Cutting Concerns Integration

**What：** 创建 `aspects/` 用于日志、错误处理、遥测、诊断

**Why：**
- 防止日志/错误处理散落在业务代码中
- 支持一致的可观测性和诊断（MVP 要求）
- 支持未来集中配置和规则

**Aspects Directory Structure：**
- 扁平结构（flat），暂不强求子目录
- 诊断 export 可在 `aspects/diagnostics.*`（文件或目录均可）
- 未来复杂度增长时可拆分子目录

**Alternatives Considered：**
- 各模块分散日志：拒绝，不一致且难以诊断
- Decorator pattern：拒绝，对 SvelteKit/TypeScript 过于复杂

### Decision 6: Empty Directory Tracking

**What：** 使用 `.gitkeep` + README.md 追踪所有空目录

**Why：**
- Git 默认不追踪空目录
- README.md 提供开发者即时指导（这里放什么、禁止什么）
- 作为目录级别的架构规则文档

**Alternatives Considered：**
- `.gitignore` trick：拒绝，非标准且令人困惑
- 不追踪（让需要时再创建）：拒绝，结构作为契约

### Decision 7: Layer Responsibilities

**What：** 每层有明确职责，不得重叠

**Layer Responsibilities：**

- **Domain：** 纯业务规则、实体、值对象、不变量。不依赖框架和外部系统。
- **Application：** 用例、流程、事务边界、编排。可 import domain，但不 import infrastructure/ui/platform。
- **Infrastructure：** 外部依赖实现（SQLite、HTTP、Capacitor/BLE、SMTP）。可 import domain、application、platform、aspects。
- **UI：** SvelteKit routes、组件、用户交互。可 import application、aspects。

**Alternatives Considered：**
- 三层（domain/app/ui，infrastructure 在 app 中）：拒绝，技术关注点泄漏到应用层
- Onion/Hexagonal with ports/adapters：拒绝，MVP 过度工程化，目录级别难以强制

## Risks / Trade-offs

**Risk：在实际问题出现前过度工程化**
- **Mitigation**：保持最小实现（仅目录，无代码）
- **Trade-off**：现在接受稍多结构 vs. 后期重构

**Risk：团队在没有 enforcement 的情况下忽略规则**
- **Mitigation**：spec 中提供明确违反处理规则；规划 lint/CI enforcement
- **Trade-off**：现在手动 enforcement vs. 后期自动化 enforcement

**Risk：模块边界可能不适合未来功能**
- **Mitigation**：shared 模块用于跨模块代码；spec 提供模糊案例指导
- **Trade-off**：现在严格边界 vs. 后期灵活性

**Risk：目录深度影响可读性**
- **Mitigation**：保持模块特定代码浅层；shared/platform/aspects 在顶层
- **Trade-off**：明确结构 vs. 浅层嵌套

## Migration Plan

**Steps：**
1. 创建目录骨架（tasks 1.1.1 - 1.1.6）
2. 添加空目录追踪（tasks 1.2.1 - 1.2.3）
3. 编写规范文档（tasks 1.3.1 - 1.3.7）
4. 验收验证（tasks 1.4.1 - 1.4.7）

**Rollback：**
- 删除 `apps/mobile/src/modules/` 目录
- 删除 `apps/mobile/src/platform/` 目录
- 删除 `apps/mobile/src/aspects/` 目录
- 删除规范 delta 文件（archive 时清理）

**不修改现有代码**，因此 rollback 安全完整。

## Open Questions

1. `shared/` 模块是否需要子目录（domain/infrastructure/ui）？
   - **Decision**：否，保持扁平。共享代码通常是工具或类型，不适合清晰分层。

2. 如何处理属于多个模块的代码？
   - **Decision**：放在 `shared/` 中，并记录哪些模块依赖它。如果重要，考虑提取为独立模块。

3. `aspects/` 是否需要子目录（logging/, errors/ 等）？
   - **Decision**：暂不需要。MVP 保持扁平。未来复杂度增长时拆分。

4. 现有代码在 `apps/mobile/src/lib/` 和 `apps/mobile/src/routes/` 如何处理？
   - **Decision**：本次不变。迁移将按 WIP=1 规则在单独变更中处理。
