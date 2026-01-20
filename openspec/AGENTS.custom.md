# 自定义 AGENTS 配置

> ⚠️ 此文件内容不会被 `openspec update` 覆盖
> 
> AI 助手应同时阅读 `AGENTS.md` 和此文件。

## 语言协议

为确保开发团队的效率与清晰度，严格遵循以下语言规范：

1. **思考与推理**：使用**简体中文**进行所有分析和推理步骤
2. **文档主体**：以下内容的*正文*使用简体中文：
   - `proposal.md`（Why、What Changes、Impact）
   - `tasks.md`（检查清单项）
   - `design.md`（决策、上下文）
   - `spec.md`（需求描述、场景步骤）
3. **关键结构保持英文**：以下关键词和标题必须保持英文，以便 `openspec` 工具正确解析：
   - `## ADDED Requirements`
   - `## MODIFIED Requirements`
   - `## REMOVED Requirements`
   - `## RENAMED Requirements`
   - `### Requirement: [名称]`（名称部分可以使用中文）
   - `#### Scenario: [名称]`（名称部分可以使用中文）
   - `## Why`、`## What Changes`、`## Impact`（在 proposal.md 中）
   - `## 1. Implementation`（在 tasks.md 中）
   - 关键词：`MUST`、`SHALL`、`WHEN`、`THEN`、`GIVEN`
4. **命名规范**：
   - 文件名和目录：`kebab-case`（英文），例如 `add-user-login`
   - 代码符号（变量、函数）：使用英文

## Git 环境检查（每次任务开始必须执行）

- [ ] `git status`：确认工作区干净
- [ ] `git branch -vv`：确认分支与远端追踪关系
- [ ] `git log -5 --oneline`：确认最近提交上下文
- [ ] `git diff` / `git diff --stat`：确认变更范围可解释

**禁止**在 `main/master` 上直接提交；必须在 change 分支上推进。

## Worktree 使用规则

默认禁止 worktree；只有在以下情况才临时启用：
- 需要同时维护长期 hotfix + 主线变更
- 需要保留 main 只读对照工作区
