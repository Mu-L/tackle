# WP-102-1-impl: 数据准确性验证与校准

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-102.md`
> - 包含: 背景说明、代码级验证发现、关键数据偏差表

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-102 |
| **依赖** | 无 |
| **执行角色** | architect |
| **状态** | ✅ 完成 |

## 职责

逐项验证评估报告 `docs/reports/2026-05-25_roadmap-global-assessment.md` 中的数据声明，纠正错误数据，重新校准受影响的时间估算。

## 任务清单

- [ ] 统计所有 runtime 文件的函数/方法数（精确到每个文件）
- [ ] 统计 JSDoc 覆盖率（全文件扫描，按文件分别统计）
- [ ] 验证测试数量（运行 `node --test test/**/*.js`）
- [ ] 验证 harness-build.js 行数和方法密度
- [ ] 检查 package-lock.json vs package.json 版本差异
- [ ] 基于修正数据重新校准 WP-091 (API 文档) 和 WP-093 (TypeScript) 的时间估算
- [ ] 输出 `docs/reports/2026-05-28_wp102-data-verification.md`

## 验收标准

- [ ] 所有数据声明均标注数据来源和验证方法
- [ ] 偏差 >20% 的数据项有详细修正说明
- [ ] 受影响的时间估算已重新计算（WP-091/093）
- [ ] 评估报告中 "463 方法" 声明有明确真伪判断

## 关键文件

- `plugins/runtime/harness-build.js` (1,547 行)
- `plugins/runtime/plugin-loader.js` (521 行)
- `plugins/runtime/config-manager.js`
- `plugins/runtime/event-bus.js`
- `plugins/runtime/state-store.js`
- `plugins/runtime/hook-dispatcher.js`
- `plugins/runtime/config-validator.js`
- `plugins/runtime/manifest-resolver.js`
- `plugins/runtime/validator-pipeline.js`
- `plugins/runtime/logger.js`
- `docs/reports/2026-05-25_roadmap-global-assessment.md` (评估报告)
- `package.json` / `package-lock.json`
