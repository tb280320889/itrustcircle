# Change: Establish Module-First Architecture Skeleton

## Why

sentinel/tower/contact 的增量开发需要稳定的归位框架。如果没有清晰的架构边界，新功能会散落在各层，导致目录重排、跨层污染和大量重构成本。本次变更建立面向未来的 module-first 结构，明确层职责和依赖规则。

## What Changes

- 在 `apps/mobile/src/modules/` 下创建 module-first 目录骨架
- 新增规范 spec：`repo-structure` 定义层职责、依赖方向、禁止模式
- 使用 `.gitkeep` + README 建立空目录追踪策略
- 定义路由规范（thin-shell 原则）、横切关注点隔离规范（aspects）、层分离规则
- 非目标：不迁移现有代码、不实现 lint/CI、不新增业务功能

## Impact

- 受影响的规范：无（新增规范）
- 受影响的代码：`apps/mobile/src/`（仅新目录结构）
- 迁移影响：无（仅空目录）
