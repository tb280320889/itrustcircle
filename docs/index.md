# iTrustCircle 文档索引

> iTrustCircle：被动触发的紧急预警系统 - BLE断联+倒计时无人取消的智能守护

## 📚 文档体系概览

```
01 概览 → 02 PRD → 03 旅程 → 04 故障 → 05 ADR → 06 验收 → 07 迭代
   ↓        ↓       ↓       ↓       ↓       ↓        ↓
 项目定位   产品需求   用户流程   异常处理   技术决策   质量标准   开发节奏
```

## 📖 目录导航

### [01 概览](./overview/README.md)
- 🎯 **项目定位**：被动触发紧急预警系统
- 👥 **三角色模型**：Tower（塔台）+ Sentinel（哨兵）+ Contact（联系人）
- 🏗️ **技术栈**：SvelteKit + Capacitor v7（Android）
- 📋 **使用指南**：文档架构和阅读顺序

### [02 PRD](./prd/README.md)
- 📋 **[MVP PRD](./prd/mvp-prd.md)**：产品需求文档完整版
- 🎯 **核心创新**：BLE断联+倒计时无人取消
- 📊 **成功度量**：M1-M5 可量化指标
- 🔒 **约束条件**：WIP=1、Capacitor工作流

### [03 用户旅程](./journeys/README.md)
- 🏠 **[Tower 旅程](./journeys/tower.md)**：塔台控制台完整流程
- 📱 **[Sentinel 旅程](./journeys/sentinel.md)**：哨兵守护详细步骤
- 👤 **[Contact 旅程](./journeys/contact.md)**：联系人响应机制
- 🔄 **A-F 结构**：目标→条件→主流程→分支→故障→验收

### [04 Failure Modes](./failure-modes/README.md)
- 🚨 **[Failure Modes 清单](./failure-modes/failure-modes.md)**：详细故障处理策略
- 📡 **网络故障**：FM-N1 到 FM-N4（无网/弱网/杀死/BLE不稳定）
- 🔄 **数据故障**：FM-D1 到 FM-D3（状态不一致/重复发送/去重失败）
- 👆 **交互故障**：FM-U1 到 FM-U3（权限不足/误报/配置不完整）

### [05 ADR](./adr/README.md)
- 📋 **[ADR 索引](./adr/adr-index.md)**：8个关键架构决策状态
- 🏗️ **Tier 1 决策**：基础架构（已定1个，待定3个）
- ⚙️ **Tier 2 决策**：核心功能（4个待定）
- 🔗 **依赖关系**：清晰的决策依赖图和优先级

### [06 验收](./acceptance/README.md)
- ✅ **[验收用例](./acceptance/acceptance.md)**：完整验收标准
- 📊 **三层验收**：文档层→功能层→集成层
- 🧪 **验收用例**：AC-TO/SE/CO/FM 系列
- 📈 **质量指标**：完整性、一致性、可执行性度量

### [07 迭代](./sprints/README.md)
- 📋 **[Sprint 0/1 任务卡](./sprints/sprint-0-1-cards.md)**：当前迭代任务
- 🎯 **WIP=1 原则**：专注单任务，确保质量
- 📅 **迭代规划**：Sprint 0/1 → Sprint 1 → Sprint 2
- 🚧 **开发约束**：无跨层重构，Capacitor工作流，文档驱动

## 🎯 当前状态（2026-01-17）

### 📊 整体进度
- **文档完整性**：✅ 100%（所有文档已完成）
- **文档一致性**：✅ 100%（文档间完全对齐）
- **ADR 决策**：🔄 12.5%（1/8 已定，7/8 待定）
- **工程健康**：⚠️ 基本达标（check✅, lint❌, test⚠️）

### 🎯 Sprint 0/1 状态
- **任务卡**：✅ 7/7 完成（卡 00-06）
- **质量**：✅ 优秀（DoD 完整，验收通过）
- **下一步**：🔧 修复 lint 问题，开始 Sprint 1

### 🚀 即将开始
- **Sprint 1**：核心架构期（Tier 1 ADR + 基础功能）
- **Sprint 2**：完整闭环期（Tier 2 ADR + 端到端功能）
- **MVP 发布**：预计 3-4 周后

## 🔍 快速导航

### 👨‍💻 开发者
1. 阅读 [01 概览](./overview/README.md) 了解项目
2. 学习 [03 用户旅程](./journeys/README.md) 理解流程
3. 查看 [05 ADR](./adr/README.md) 了解技术决策
4. 参考 [07 迭代](./sprints/README.md) 开始工作

### 🎨 产品经理
1. 深入 [02 PRD](./prd/README.md) 掌握需求
2. 熟悉 [03 用户旅程](./journeys/README.md) 理解体验
3. 检查 [04 Failure Modes](./failure-modes/README.md) 评估风险
4. 使用 [06 验收](./acceptance/README.md) 定义标准

### 🧪 测试工程师
1. 基于 [03 用户旅程](./journeys/README.md) 设计用例
2. 参考 [04 Failure Modes](./failure-modes/README.md) 设计异常测试
3. 执行 [06 验收](./acceptance/README.md) 中的验收用例
4. 关注 [05 ADR](./adr/README.md) 中的验证方式

### 🔧 运维工程师
1. 了解 [04 Failure Modes](./failure-modes/README.md) 中的故障处理
2. 配置 [06 验收](./acceptance/README.md) 中的监控检查
3. 建立 [07 迭代](./sprints/README.md) 中的质量监控
4. 制定 [02 PRD](./prd/README.md) 中的运维策略

---

📝 **文档维护**：所有文档变更需保持一致性，更新前请检查关联文档  
🔄 **版本控制**：基于 Git 版本管理，重大变更需更新版本号  
⭐ **质量保证**：定期检查文档完整性、一致性和可执行性