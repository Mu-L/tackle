# WP-126-4-verify: WP-113 模块化二次校验

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
| **预估时间** | 20min |
| **状态** | 📋 待执行 |

## 职责

对 WP-113 harness-build.js 模块化进行二次校验，验证重构后的模块结构正确性、拆出模块的接口一致性。

## 任务清单

- [ ] 运行 `node --test test/runtime/test-harness-build.js`（20 测试）
- [ ] 验证 harness-build.js 行数确实从 1571 降至 ≤1100（目标 1026）
- [ ] 验证 4 个拆出模块的导出接口一致性：
  - `yaml-parser.js` — parseYAML / parseYAMLFileSync
  - `settings-merger.js` — mergeSettings / resolveSettings
  - `claude-md-injector.js` — injectClaudeMd / extractSections
  - `plugin-validator.js` — 已合并 WP-112 capabilities 验证
- [ ] 验证 require 路径正确性（所有模块引用无断裂）
- [ ] 运行 `node bin/tackle.js build && validate` 确认构建通过
- [ ] 标记 DECISION-2：commands/init.js:62 require 路径疑似错误

## 验收标准

- [ ] 20/20 测试通过
- [ ] harness-build.js 行数 ≤ 1100
- [ ] 4 个拆出模块导出接口完整
- [ ] build + validate 通过
- [ ] DECISION-2 已标记

## 关键文件

- `plugins/runtime/harness-build.js`（~1057 行）
- `plugins/runtime/yaml-parser.js`（~348 行）
- `plugins/runtime/settings-merger.js`（~160 行）
- `plugins/runtime/claude-md-injector.js`（~159 行）
- `plugins/runtime/plugin-validator.js`（~491 行）
- `test/runtime/test-harness-build.js`
- `commands/init.js` — DECISION-2 涉及文件

## 待决策问题

**DECISION-2**: `commands/init.js` 第 62 行 `require('../../plugins/runtime/manifest-resolver')` 路径疑似错误（从 commands/ 出发应为 `../plugins/runtime/manifest-resolver`）。WP-112 执行报告将其标记为"非阻塞，建议后续修复"。是否在二次校验中修复此问题？需确认该路径在实际运行中是否被触达。
