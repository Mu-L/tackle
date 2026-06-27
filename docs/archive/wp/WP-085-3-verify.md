# WP-085-3-verify: CLI 模块化重构 - 测试验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-085.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-085 |
| **依赖** | WP-085-2-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

运行全量测试，确保 CLI 模块化重构无回归。

## 任务清单

- [ ] 运行 `node --test test/**/*.js` 全量通过
- [ ] 运行 `node bin/tackle.js build` 验证构建正常
- [ ] 运行 `node bin/tackle.js validate` 验证校验正常
- [ ] 运行 `node bin/tackle.js version` 验证版本输出
- [ ] 运行 `node bin/tackle.js list` 验证列表输出
- [ ] 运行 `node bin/tackle.js status` 验证状态输出

## 验收标准

- [ ] 164 测试全通过
- [ ] 所有 CLI 命令行为与重构前一致

## 关键文件

- `bin/tackle.js` — 验证对象
