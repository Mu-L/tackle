# WP-126-5-verify: WP-119 API 稳定性分类二次校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-126.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-126 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 职责

对 WP-119 API 稳定性分类进行二次校验。注意：WP-125 首次校验未覆盖 WP-119，这是二次校验的新增内容。

## 任务清单

- [ ] 验证 `docs/api-reference.md` 存在且内容完整（~1729 行）
- [ ] 抽查 JSDoc 标注准确性：@public / @internal / @experimental 分类与代码实际行为一致
- [ ] 验证 ~211 个 API 标注数量：@public ~136 + @experimental ~11 + @internal ~60
- [ ] 确认 WP-119 修复的 5 处不一致未回归
- [ ] 重点检查 sandbox 相关的 @experimental 标注是否合理
- [ ] 标记 DECISION-3：CAPABILITY_RESTRICTIONS @internal 仍导出问题

## 验收标准

- [ ] api-reference.md 存在且包含完整标注
- [ ] WP-119 修复的 5 处不一致未回归
- [ ] 全量 runtime 测试通过（JSDoc 修改不影响运行时）
- [ ] DECISION-3 已标记

## 关键文件

- `docs/api-reference.md`（~1729 行）
- `plugins/contracts/plugin-interface.js` — JSDoc 标注
- `plugins/contracts/capabilities.js` — JSDoc 标注
- `plugins/runtime/sandbox-manager.js` — @experimental 标注
- `plugins/runtime/sandbox-context.js` — @experimental 标注

## 待决策问题

**DECISION-3**: CAPABILITY_RESTRICTIONS 标注为 @internal 但仍通过 module.exports 导出（WP-119 已记录为低优先级改进项）。是否需要在 v0.2.0 正式发布前处理，还是接受为已知文档约定？
