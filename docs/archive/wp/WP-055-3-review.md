# WP-055-3-review: 报告撰写

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-055.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准
> - 同时阅读 WP-055-1-impl 和 WP-055-2-impl 的分析结果

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | review |
| **父工作包** | WP-055 |
| **依赖** | WP-055-1-impl, WP-055-2-impl |
| **执行角色** | architect |
| **状态** | 📋 待执行 |

## 职责

汇编 WP-055-1-impl 和 WP-055-2-impl 的分析结果，撰写完整的兼容性分析报告，输出到 `docs/reports/wp-999-compatibility-analysis.md`。

## 任务清单

- [ ] 汇总 Runtime 层分析结果（WP-055-1-impl）
- [ ] 汇总 Skill 文档层分析结果（WP-055-2-impl）
- [ ] 按风险等级分类（Critical / High / Medium / Low）
- [ ] 撰写报告，包含以下结构：
  1. **概述** - 分析范围、方法、结论摘要
  2. **风险总览表** - 按严重程度排序的汇总表
  3. **逐功能点分析** - 每个受影响功能点的详细分析
     - 功能点描述
     - 具体代码位置（文件路径:行号）
     - 风险说明（排序错乱/截断/溢出/冲突/显示异常）
     - 建议修复方案
  4. **受影响文件清单** - 所有涉及 WP 编号的文件列表
  5. **修复优先级建议** - 推荐的修复顺序
- [ ] 确保报告写入 `docs/reports/wp-999-compatibility-analysis.md`
- [ ] 确保 `docs/reports/` 目录存在

## 验收标准

- [ ] 报告覆盖所有 JS 代码和 skill.md 中的 WP 编号相关逻辑
- [ ] 每个风险点有具体的文件路径和行号引用
- [ ] 每个风险有明确的风险等级和建议修复方案
- [ ] 报告格式清晰，结构完整
- [ ] 报告已成功写入 `docs/reports/wp-999-compatibility-analysis.md`

## 关键文件

**输入**（分析结果来源）：
- `docs/wp/WP-055-1-impl.md` - Runtime 层分析结果
- `docs/wp/WP-055-2-impl.md` - Skill 文档层分析结果

**输出**：
- `docs/reports/wp-999-compatibility-analysis.md`
