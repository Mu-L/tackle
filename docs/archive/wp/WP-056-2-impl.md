# WP-056-2-impl: Skill 文档层验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-056.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-056 |
| **依赖** | 无 |
| **执行角色** | 领域专家 |
| **状态** | ✅ 完成 |

## 职责

验证原报告第 3.1-3.3、3.5-3.7 节中所有 skill 文档相关结论的准确性。包括显式约束、隐式暗示、示例编号模式。

## 任务清单

- [ ] 验证 `skill-split-work-package/skill.md` 行 352 显式三位约束（High 风险）
- [ ] 验证行 353 前导零示例 `WP-001 → WP-002 → WP-003`
- [ ] **新增发现检查**: 扫描该文件中子任务编号模式（`XXX-001`, `GAZE-001`, `XXX-001-A1`, `XXX-001-T1`）是否也有前导零三位格式
- [ ] 验证 `skill-task-creator/skill.md` 模板占位符行号（344, 388, 468-474, 607-707）及风险描述
- [ ] 验证 `skill-batch-task-creator/skill.md` 批量编号示例行号（289, 336, 434, 602）及风险描述
- [ ] 验证 `skill-progress-tracker/skill.md` 示例行号（89, 104, 134, 169）及风险描述
- [ ] 验证 `skill-agent-dispatcher/skill.md` 示例行号（46-56, 163-164, 178, 753）及风险描述
- [ ] 验证 `skill-completion-report/skill.md` 占位符行号（67, 83, 97, 114-120, 161-178）
- [ ] 对每项给出验证结论：✅ 准确 / ⚠️ 部分准确 / ❌ 不准确
- [ ] 记录原报告未覆盖的新发现

## 验收标准

- [ ] 所有声称的行号已核对（含 6 个 skill 文件共 20+ 个位置）
- [ ] 每个风险评级已重新评估（是否同意 High/Medium/Low 分级）
- [ ] 新发现已记录（如子任务编号前导零模式）
- [ ] 验证结果清晰可追溯

## 关键文件

- `plugins/core/skill-split-work-package/skill.md`
- `plugins/core/skill-task-creator/skill.md`
- `plugins/core/skill-batch-task-creator/skill.md`
- `plugins/core/skill-progress-tracker/skill.md`
- `plugins/core/skill-agent-dispatcher/skill.md`
- `plugins/core/skill-completion-report/skill.md`
