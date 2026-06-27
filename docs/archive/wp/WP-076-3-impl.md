# WP-076-3-impl: docs/ 技术文档批量修订

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-076.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-076 |
| **依赖** | WP-076-1-impl |
| **执行角色** | implementer |
| **状态** | ✅ 完成 (2026-05-25) |

## 职责

修订 docs/ 目录下 6 个技术文档中的版本号引用和过时内容，确保与当前代码实际情况一致。**不改变预期类的设计描述**（如未完成开发的部分）。

## 任务清单

### best-practices.md
- [ ] L4: 版本 "0.0.21" → "0.1.2"
- [ ] L359: `tackle-harness@0.0.21` → `tackle-harness@0.1.2`

### daily-workflow-guide.md
- [ ] L4: 版本 "0.0.14" → "0.1.2"
- [ ] L543-558 Skill 速查表补充缺失的 2 个技能：
  - `skill-tackle-sync`: 触发词 "配置tackle" / "sync" / `/skill-tackle-sync`，阶段：辅助
  - `skill-task-archive`: 触发词 "任务归档" / "archive" / `/skill-task-archive`，阶段：辅助

### installation.md
- [ ] L422: "tackle-init" → "tackle-sync"，触发词更新为 "配置tackle、sync、初始化"
- [ ] 检查技能列表是否包含全部 15 个技能

### plugin-development.md
- [ ] L5: "v0.0.24" → "v0.1.2"

### ai_workflow.md
- [ ] L3: "3.0.0" → "0.1.2"

### config-reference.md
- [ ] 检查全文是否有版本号引用，如有则更新
- [ ] 检查配置描述是否与当前代码一致

## 关键文件

- `docs/best-practices.md`
- `docs/daily-workflow-guide.md`
- `docs/installation.md`
- `docs/plugin-development.md`
- `docs/ai_workflow.md`
- `docs/config-reference.md`

## 验收标准

- [ ] 所有文档版本号引用已更新为 0.1.2
- [ ] daily-workflow-guide.md Skill 速查表包含全部 15 个技能
- [ ] installation.md 中已无 tackle-init 引用，全部替换为 tackle-sync
- [ ] 文档描述与当前代码实际情况一致
