## 1. Implementation

- [x] 1.1 创建 `specs/alert-event-contract/spec.md` 规范文件，定义 AlertEvent 数据模型、HTTP 协议、幂等语义、重试语义、错误模型、版本化和安全要求（仅限契约与互操作语义，观测/导出/保留/防抖/配置拆分到后续 change）
- [x] 1.2 运行 `openspec validate add-alert-event-contract --strict --no-interactive` 验证规范格式正确性
- [x] 1.3 更新 ADR-0004 状态为"已定"，添加对新规范的引用
- [x] 1.4 更新 ADR-0008 状态为"已定"，添加对新规范的引用
- [x] 1.5 再次运行 `openspec validate add-alert-event-contract --strict --no-interactive` 确认所有引用正确

## 2. Review 与 Approval

- [x] 2.1 技术评审：验证契约定义与 PRD 需求的一致性
- [x] 2.2 架构评审：确认幂等性、重试语义、版本化策略与系统架构的兼容性
- [x] 2.3 安全评审：验证认证机制、错误码暴露、敏感信息处理的安全性
- [x] 2.4 目录边界一致性检查：路径与依赖边界不引入漂移（对齐 `repo-structure`）
- [x] 2.5 契约闭合性检查：成功/重复/错误/不支持版本/认证失败/权限失败 6 类场景可直接写集成测试断言
- [x] 2.6 获得批准进入实施阶段
