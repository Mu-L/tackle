# WP-114-3-verify: A3 3 模块测试补全 - 覆盖率验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-114.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-114 |
| **依赖** | WP-114-2-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

运行全量测试并确认三个模块的覆盖率均达标。

## 任务清单

- [ ] 运行 `node --test test/**/*.js` 全量测试通过
- [ ] 检查 `validator-pipeline.js` 覆盖率 ≥ 75%
- [ ] 检查 `hook-dispatcher.js` 覆盖率 ≥ 70%
- [ ] 检查 `manifest-resolver.js` 覆盖率 ≥ 75%
- [ ] 对比 WP-114 的初始覆盖率，确认提升幅度
- [ ] 检查测试用例无跳过（skip）或待定（todo）项
- [ ] 记录覆盖率数据

## 验收标准

- [ ] 全量测试通过，无失败用例
- [ ] validator-pipeline.js 覆盖率 ≥ 75%
- [ ] hook-dispatcher.js 覆盖率 ≥ 70%
- [ ] manifest-resolver.js 覆盖率 ≥ 75%
- [ ] 覆盖率数据已记录

## 关键文件

- `test/runtime/test-validator-pipeline.js` — 验证对象
- `test/runtime/test-hook-dispatcher.js` — 验证对象
- `test/runtime/test-manifest-resolver.js` — 验证对象
