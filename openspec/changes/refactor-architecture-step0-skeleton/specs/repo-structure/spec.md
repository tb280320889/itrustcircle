# Specification: Repository Structure and Architectural Rules

> 除另有说明外，所有路径均相对于 `apps/mobile/src/`。

## ADDED Requirements

### Requirement: Module-First Directory Structure
代码库 MUST 按 `modules/` 下的业务能力组织模块，每个模块包含四层：`domain/`、`application/`、`infrastructure/` 和 `ui/`。此外，`shared/`、`platform/` 和 `aspects/` 目录 MUST 存在于同一层级用于横切关注点。

#### Scenario: Sentinel 模块结构
- **GIVEN** 代码库使用 module-first 架构组织
- **WHEN** 开发者创建新的 sentinel 特定功能
- **THEN** 代码 MUST 放置在 `modules/sentinel/` 下
- **AND** 该功能 MUST 遵守层边界（domain/application/infrastructure/ui）

#### Scenario: Platform 隔离
- **GIVEN** 开发者需要添加 Capacitor 桥接
- **WHEN** 桥接代码编写完成
- **THEN** 它 MUST 放置在 `platform/` 下
- **AND** 它 MUST 不包含业务逻辑

#### Scenario: 横切关注点隔离
- **GIVEN** 需要日志功能
- **WHEN** 日志代码实现完成
- **THEN** 它 MUST 放置在 `aspects/` 下
- **AND** 业务代码 MUST 从 aspects 导入而非内联实现日志

### Requirement: Layer Responsibilities
每一层 MUST 有不重叠的明确职责。Domain 层 MUST 包含纯业务规则、实体、值对象和不变量。Application 层 MUST 包含用例、流程、事务边界和编排。Infrastructure 层 MUST 包含外部依赖的实现（SQLite、HTTP、Capacitor/BLE、SMTP）。UI 层 MUST 包含 SvelteKit routes、组件和用户交互。

#### Scenario: Domain 层纯度
- **GIVEN** 需要 AlertEvent 的 domain 实体
- **WHEN** 实体定义完成
- **THEN** 它 MUST 在 `modules/{module}/domain/` 中
- **AND** 它 MUST 不从 infrastructure、ui 或 platform 层导入
- **AND** 它 MUST 不依赖框架（Svelte、Capacitor 等）

#### Scenario: Application 编排
- **GIVEN** 用例需要 BLE 断联检测 → 倒计时 → 事件生成 → 上传
- **WHEN** 工作流实现完成
- **THEN** 编排代码 MUST 在 `modules/sentinel/application/` 中
- **AND** 它 MAY 导入 domain 实体
- **AND** 它 MUST 不直接访问 SQLite、HTTP 或 native bridges（委托给 infrastructure）

#### Scenario: Infrastructure 实现
- **GIVEN** Tower 需要 SQLite 存储
- **WHEN** repository 实现完成
- **THEN** 它 MUST 在 `modules/tower/infrastructure/` 中
- **AND** 它 MAY 导入 domain 实体和接口
- **AND** 它 MUST 包含 SQLite 特定逻辑

#### Scenario: UI thin-shell routing
- **GIVEN** SvelteKit route 处理状态页面渲染
- **WHEN** route 实现完成
- **THEN** route 文件 MUST 在 `apps/mobile/src/routes/**`；业务 UI 组件/stores/controller MUST 在 `modules/tower/ui/`
- **AND** route 文件 MUST 只做薄壳装配并调用 application
- **AND** route 文件 MUST 不包含业务规则评估或工作流逻辑

### Requirement: Code-Level Import Rules
依赖关系 MUST 使用代码级 import 规则定义，每层有明确的允许和禁止导入列表。

#### Scenario: Domain 层导入规则
- **GIVEN** domain 代码正在测试
- **WHEN** 测试运行
- **THEN** domain 层 MUST 对 infrastructure、ui 或 platform 无依赖
- **AND** 测试 MUST 无需 mock 外部系统即可通过
- **AND** domain MAY 导入本模块 `domain/` + `modules/shared/`（仅纯类型/工具）
- **AND** domain MUST 禁止导入 `platform/`、`infrastructure/`、`ui/`、`aspects/`

#### Scenario: Application 层导入规则
- **GIVEN** application 层需要存储事件
- **WHEN** 用例实现完成
- **THEN** application 层 MUST 依赖接口（在 domain 中定义）
- **AND** infrastructure MUST 提供实现
- **AND** application MUST 不直接导入 infrastructure 具体类型
- **AND** application MAY 导入 `domain/` + `aspects/`
- **AND** application MUST 禁止导入 `infrastructure/`、`ui/`、`platform/`

#### Scenario: Infrastructure 层导入规则
- **GIVEN** infrastructure 实现需要调用 platform bridge
- **WHEN** 代码实现完成
- **THEN** infrastructure MAY 导入 `domain/` + `application/` + `platform/` + `aspects/`
- **AND** infrastructure MUST 禁止导入 `ui/`

#### Scenario: UI 层导入规则
- **GIVEN** SvelteKit route 需要调用 use case
- **WHEN** 代码实现完成
- **THEN** ui MAY 导入 `application/` + `aspects/`
- **AND** ui MUST 禁止直接导入 `infrastructure/`、`platform/`、`domain/`

**VIOLATION HANDLING：**
- 如果 domain 层导入 infrastructure/ui/platform：这是 CRITICAL 违规。代码 MUST 重构以移除依赖。使用依赖倒置（在 domain 中定义接口）或将依赖移动到 infrastructure。
- 如果 application 层导入 infrastructure 具体类型：使用依赖注入或移动到 infrastructure。在 domain 或 application 层定义接口。

### Requirement: Platform/Aspects Visibility Rules
Platform 和 Aspects 目录 MUST 遵循明确的可见性规则，防止 domain 层被横切关注点或 native 桥接"污染"。

#### Scenario: Platform 可见性
- **GIVEN** infrastructure 代码需要访问 native bridge
- **WHEN** 代码实现完成
- **THEN** infrastructure MAY 导入 `platform/`
- **AND** domain/application/ui 层 MUST 禁止导入 `platform/`

#### Scenario: Aspects 可见性（允许导入）
- **GIVEN** application 代码需要记录日志
- **WHEN** 代码实现完成
- **THEN** application MAY 导入 `aspects/logger`

#### Scenario: Aspects 可见性（禁止 domain 导入）
- **GIVEN** domain 代码需要验证业务规则
- **WHEN** 开发者考虑使用 `aspects/validator`
- **THEN** 这是 VIOLATION
- **AND** 验证逻辑 MUST 在 domain 中作为纯函数实现
- **OR** 在 domain 中定义服务接口，implementation 在 infrastructure 中

**VIOLATION HANDLING：**
- 如果 domain 层导入 platform/aspects：立即重构。移除导入，将逻辑内化到 domain 或通过接口抽象。
- 如果 ui/application 层直接导入 platform：移除导入，通过 infrastructure 层间接访问。

### Requirement: SvelteKit Routes Physical Location
SvelteKit 文件路由 MUST 保持在 `apps/mobile/src/routes/**` 目录（框架约束）。`modules/*/ui/` 目录 MUST 用于存放 route handler 的 controller/adapter、Svelte stores、组件、页面装配逻辑。

#### Scenario: Route 文件物理位置
- **GIVEN** 开发者创建新的 status page route
- **WHEN** route 文件创建完成
- **THEN** route 文件 MUST 在 `apps/mobile/src/routes/status/+page.svelte`
- **AND** 该 route 的业务逻辑（如 stores、状态管理）MUST 在 `modules/tower/ui/` 中

#### Scenario: UI 层职责划分
- **GIVEN** developer 需要创建状态页面组件
- **WHEN** 代码实现完成
- **THEN** Svelte 组件 MUST 在 `modules/tower/ui/` 中
- **AND** Route 文件 MUST 导入组件并渲染
- **AND** Route 文件 MUST 保持薄壳（解析参数/调用 application/渲染响应）

**VIOLATION HANDLING：**
- 如果 route 文件包含业务编排：提取到 application layer use case。
- 如果 route 文件直接调用 infrastructure：将 infrastructure 调用移动到 application layer 或创建 infrastructure service。

### Requirement: Thin-Shell Routing Principles
SvelteKit routes SHALL 作为处理 HTTP 关注点的薄壳。Routes MAY 解析参数、校验输入格式、调用 application layer use cases、渲染响应。Routes MUST 不包含业务编排逻辑、直接 infrastructure 调用（SQLite、HTTP、SMTP）或复杂状态管理。

#### Scenario: Route 作为薄壳
- **GIVEN** GET route 显示 Tower 状态
- **WHEN** route 被访问
- **THEN** route MUST 调用 `application.getStatus()`
- **AND** route MUST 渲染返回的数据
- **AND** route MUST 不包含业务规则评估

#### Scenario: Route 处理表单提交
- **GIVEN** POST route 处理 Sentinel 的 alert event 上传
- **WHEN** 请求到达
- **THEN** route MUST 解析请求体
- **AND** route MUST 校验输入格式（JSON 结构）
- **AND** route MUST 调用 `application.handleAlertEvent(event)`
- **AND** route MUST 返回适当的 HTTP 响应
- **AND** route MUST 不直接保存到 SQLite 或发送邮件

#### Scenario: 简单只读视图例外
- **GIVEN** 只读状态页面显示诊断日志
- **WHEN** 页面被访问
- **THEN** route MAY 直接查询 application layer 获取数据
- **AND** route MUST 不执行写入或状态更改
- **AND** 这是简单视图的 EXCEPTION

**VIOLATION HANDLING：**
- 如果 route 包含业务编排：提取到 application layer use case。
- 如果 route 直接调用 infrastructure：将 infrastructure 调用移动到 application layer 或创建 infrastructure service。
- 如果 route 有复杂状态管理：移动到 application layer 或 Svelte stores（在 ui 层）。

### Requirement: Cross-Cutting Concerns Integration
横切关注点（日志、错误处理、遥测、诊断）MUST 通过 `aspects/` 目录集成。业务代码 MUST 不散落日志、错误处理或遥测逻辑内联。Aspects MUST 提供清晰的集成 API，使用模块导入风格（例如 `import { logger } from 'aspects/logger'`）。

#### Scenario: 通过 aspects 记录日志
- **GIVEN** 用例需要记录事件
- **WHEN** 日志添加完成
- **THEN** 代码 MUST 使用 `import { logger } from 'aspects/logger'; logger.info(message, context)`
- **AND** 代码 MUST 不直接使用 `console.log` 或第三方日志器
- **AND** 日志配置 MUST 在 aspects 中集中

#### Scenario: 通过 aspects 处理错误
- **GIVEN** infrastructure 层发生错误
- **WHEN** 错误被捕获
- **THEN** 代码 MUST 使用 `import { handleError } from 'aspects/errors'; handleError(error, context)`
- **AND** 代码 MUST 不静默吞咽错误或实现自定义错误处理器
- **AND** aspects layer MUST 处理日志、遥测和用户通知

#### Scenario: 诊断导出
- **GIVEN** 需要诊断导出功能
- **WHEN** 导出实现完成
- **THEN** 导出逻辑 MUST 在 `aspects/diagnostics.*` 中（文件或目录均可）
- **AND** 导出 MUST 聚合模块的日志、配置和状态
- **AND** 模块 MUST 不实现自己的导出逻辑

**VIOLATION HANDLING：**
- 如果业务代码有内联日志：替换为 `import { logger } from 'aspects/logger'` 调用。
- 如果业务代码有自定义错误处理：替换为 `import { handleError } from 'aspects/errors'` 调用。
- 如果诊断逻辑分散：整合到 `aspects/diagnostics.*`。

### Requirement: Empty Directory Tracking
所有空目录 MUST 使用 `.gitkeep` 文件在 Git 中追踪。每个模块根目录、platform 和 aspects 目录 MUST 包含 `README.md` 文件，解释目录目的、允许内容和禁止模式。

#### Scenario: Git 追踪空目录
- **GIVEN** 新模块创建并带有空子目录
- **WHEN** 目录提交完成
- **THEN** 每个空目录 MUST 包含 `.gitkeep` 文件
- **AND** `.gitkeep` 文件 MUST 提交到 Git

#### Scenario: 模块文档
- **GIVEN** 开发者创建 sentinel 模块
- **WHEN** 模块初始化完成
- **THEN** `modules/sentinel/README.md` MUST 存在
- **AND** README MUST 解释：模块目的、层、这里放什么、禁止什么
- **AND** README MUST 提供正确使用示例

#### Scenario: Platform 文档
- **GIVEN** 开发者创建 platform 目录
- **WHEN** 目录初始化完成
- **THEN** `platform/README.md` MUST 存在
- **AND** README MUST 解释：什么构成 platform bridge、如何添加新 bridge、与业务代码的边界
- **AND** README MUST 包含最小模板：Purpose（目的）、Allowed（允许内容）、Forbidden（禁止内容）、Examples（示例）

**VIOLATION HANDLING：**
- 如果空目录缺少 `.gitkeep`：添加 `.gitkeep` 并提交。
- 如果模块缺少 `README.md`：创建包含必需章节的 README。
- 如果 README 不清楚或缺少示例：更新 README 以提供清晰指导。

### Requirement: Feature Placement Guidance
对于任何新功能，规范 MUST 提供明确指导，说明该功能属于哪个模块和层。规范 SHALL 包含决策树或规则，回答：哪个模块？哪层？允许哪些依赖？

#### Feature Placement Decision Tree
对于新功能，使用以下决策树确定归位：

```
1. 选 Module（谁拥有该职责？）
   - sentinel：监测/触发（BLE 断联检测、倒计时、事件生成、上传）
   - tower：存储/分发/状态（SQLite 存档、邮件通知、状态页面）
   - contact：被通知方适配/接收（无 App，仅邮件接收方配置）
   - shared：跨模块共享（纯类型/工具函数）

2. 选 Layer（功能类型是什么？）
   - 纯业务规则/实体/值对象/不变量 → domain/
   - 用例编排/流程/事务边界 → application/
   - 外部系统/IO（SQLite/HTTP/BLE/SMTP）→ infrastructure/
   - 交互与路由装配（SvelteKit routes/组件）→ ui/

3. 依赖限制（按 Import Rules 兜底）
   - domain/：禁止导入 infrastructure/ui/platform/aspects
   - application/：禁止导入 infrastructure/ui/platform
   - infrastructure/：禁止导入 ui；platform 仅可被 infrastructure 导入
   - ui/：禁止直接导入 infrastructure/platform/domain
```

#### Scenario: 放置 BLE 断联检测
- **GIVEN** 正在实现 BLE 断联检测
- **WHEN** 确定放置位置
- **THEN** 规范 MUST 指导：Module = sentinel（Sentinel 的职责是检测断联）
- **AND** Layer = infrastructure（BLE 是外部依赖）
- **AND** Domain 层定义"断联事件"实体
- **AND** Application 层编排倒计时和事件生成

#### Scenario: 放置邮件通知
- **GIVEN** 正在实现邮件通知
- **WHEN** 确定放置位置
- **THEN** 规范 MUST 指导：Module = tower（Tower 的职责是通知 contacts）
- **AND** Layer = infrastructure（SMTP 是外部依赖）
- **AND** Application 层定义"发送通知"用例
- **AND** Domain 层定义"通知"实体

#### Scenario: 放置状态页面
- **GIVEN** 正在实现状态页面
- **WHEN** 确定放置位置
- **THEN** 规范 MUST 指导：Module = tower（Tower 的状态）
- **AND** Layer = ui（SvelteKit route）
- **AND** Application 层提供数据获取用例
- **AND** Route 调用 application layer 并渲染

**VIOLATION HANDLING：**
- 如果功能放置模糊：更新规范以通过示例和决策树澄清。
- 如果存在多种解释：在实现前请求澄清。
- 如果规范缺少某功能类型的指导：更新规范并添加新规则（单独的变更提案）。

## References

- Related to: `project.md`（Module-first 架构模式、层定义）
- Related to: `modules/sentinel/`、`modules/tower/`、`modules/contact/`（业务能力）
- Related to: `platform/`（Capacitor/Android/iOS bridges）
- Related to: `aspects/`（横切关注点）
