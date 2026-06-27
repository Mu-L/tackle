# WP-125-13-verify: 全量测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-125.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-125 |
| **依赖** | WP-125-1~12 全部完成 |
| **执行角色** | tester |
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 职责

在所有独立校验完成后，执行全量测试验证整体质量，汇总所有子包发现的问题。

## 任务清单

- [ ] 运行全量测试：`node --test test/**/*.js`
- [ ] 运行覆盖率：`npm run test:coverage`
- [ ] 运行构建：`node bin/tackle.js build`
- [ ] 运行验证：`node bin/tackle.js validate`
- [ ] 运行冒烟测试：`node test/smoke-test.js`
- [ ] 汇总 WP-125-1~12 发现的所有问题及修复状态
- [ ] 输出最终校验报告

## 验收标准

- [ ] `node --test test/**/*.js` 全量 0 失败
- [ ] `npm run test:coverage` 覆盖率 ≥ 70%
- [ ] `node bin/tackle.js build && node bin/tackle.js validate` 通过
- [ ] `node test/smoke-test.js` 通过
- [ ] 所有子包发现的问题已修复或已与用户讨论决策

## 关键文件

- 全部测试文件（test/**/*.js）
- `bin/tackle.js` — CLI 入口
- `test/smoke-test.js` — 冒烟测试
