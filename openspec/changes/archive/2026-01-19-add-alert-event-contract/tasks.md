## 1. Implementation

- [x] 1.1 更新 `docs/adr/adr-0004-min-data-model.md`：将状态改为"已定"，并添加指向 `specs/alert-event-contract/spec.md` 的链接
- [x] 1.2 更新 `docs/adr/adr-0008-idempotency.md`：将状态改为"已定"，并添加指向 `specs/alert-event-contract/spec.md` 的链接
- [x] 1.3 运行 `openspec validate add-alert-event-contract --strict --no-interactive` 确保所有关联引用正确

## 2. Review 与 Approval

- [ ] 2.1 技术评审：验证契约定义与 PRD 需求的一致性
- [ ] 2.2 架构评审：确认幂等性、重试语义、版本化策略与系统架构的兼容性
- [ ] 2.3 安全评审：验证认证机制、错误码暴露、敏感信息处理的安全性
- [ ] 2.4 目录边界一致性检查：路径与依赖边界不引入漂移（对齐 `repo-structure`）
- [ ] 2.5 契约闭合性检查：成功/重复/错误/不支持版本/认证失败/权限失败 6 类场景可直接写集成测试断言
- [ ] 2.6 获得批准进入实施阶段
