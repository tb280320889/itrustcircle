## 1. Implementation

### 1.1 Directory Skeleton Creation
- [ ] 1.1.1 创建 `apps/mobile/src/modules/sentinel/` 及子目录：`domain/`, `application/`, `infrastructure/`, `ui/`
- [ ] 1.1.2 创建 `apps/mobile/src/modules/tower/` 及子目录：`domain/`, `application/`, `infrastructure/`, `ui/`
- [ ] 1.1.3 创建 `apps/mobile/src/modules/contact/` 及子目录：`domain/`, `application/`, `infrastructure/`, `ui/`
- [ ] 1.1.4 创建 `apps/mobile/src/modules/shared/`（扁平，无子目录）
- [ ] 1.1.5 创建 `apps/mobile/src/platform/`（扁平，无子目录）
- [ ] 1.1.6 创建 `apps/mobile/src/aspects/`（扁平，无子目录）

### 1.2 Empty Directory Tracking
- [ ] 1.2.1 为所有空目录添加 `.gitkeep`：
  - `modules/sentinel/{domain,application,infrastructure,ui}/.gitkeep`
  - `modules/tower/{domain,application,infrastructure,ui}/.gitkeep`
  - `modules/contact/{domain,application,infrastructure,ui}/.gitkeep`
  - `modules/shared/.gitkeep`
  - `platform/.gitkeep`
  - `aspects/.gitkeep`
- [ ] 1.2.2 为每个模块根目录添加 `README.md`，说明目的和边界：
  - `modules/sentinel/README.md`
  - `modules/tower/README.md`
  - `modules/contact/README.md`
  - `modules/shared/README.md`
  - `platform/README.md`
  - `aspects/README.md`
- [ ] 1.2.3 每个 README.md 必须包含最小模板：
  - **Purpose（目的）**：该目录存在的理由
  - **Allowed（允许内容）**：可以放置什么代码
  - **Forbidden（禁止内容）**：不允许放置什么代码
  - **Examples（示例）**：正确使用示例

### 1.3 Spec Documentation
- [ ] 1.3.1 编写 `specs/repo-structure/spec.md`，在顶部声明：**"除另有说明外，所有路径均相对于 `apps/mobile/src/`。"**
- [ ] 1.3.2 重写依赖规则为「代码级 import 规则」，明确每层允许 import 谁、禁止 import 谁
- [ ] 1.3.3 明确 Platform/Aspects 可见性：domain 禁止 import platform/aspects；platform 仅 infrastructure 可 import；aspects 允许 application/infrastructure/ui import
- [ ] 1.3.4 明确 SvelteKit routes 物理位置：文件仍在 `apps/mobile/src/routes/**`，`modules/*/ui/` 用于存放 controller/adapter/stores/组件/页面装配逻辑
- [ ] 1.3.5 明确 Aspects 子目录规则：diagnostic export 可在 `aspects/diagnostics.*`（文件或目录均可），暂不强制创建子目录
- [ ] 1.3.6 添加违反处理规则（针对每条 MUST）
- [ ] 1.3.7 消除矛盾检查：验证 import 规则、Platform/Aspects 可见性、routes 物理位置、路径统一口径均一致

### 1.4 Validation
- [ ] 1.4.1 运行 `openspec validate refactor-architecture-step0-skeleton --strict --no-interactive`
- [ ] 1.4.2 验收：给定一个新功能点，能在规范中明确指出应该落在哪个 module/哪一层
- [ ] 1.4.3 验收：domain 层不得依赖 infrastructure/ui/platform（写成 MUST）
- [ ] 1.4.4 验收：routes 不允许出现业务编排逻辑（写成 MUST）
- [ ] 1.4.5 验收：横切能力必须通过 aspects 接入（写成 MUST）
- [ ] 1.4.6 验收：所有 `.gitkeep` 文件存在
- [ ] 1.4.7 验收：所有 README.md 文件存在且包含必要章节（Purpose/Allowed/Forbidden/Examples）

## Notes

- 实施顺序很重要：目录骨架优先，然后是追踪文件，然后是规范，最后是验证
- 本次变更不迁移现有代码
- lint/CI enforcement 明确排除在本次范围之外，将在后续变更中实现
