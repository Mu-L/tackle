# WP-125-2-verify: WP-113 模块化校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-125.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-125 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 20min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-113: A2 harness-build.js 模块化** — 将 1547 行的单体文件拆分为 5 个内聚模块 + 精简主模块，实现向后兼容和独立可测试。

## 职责

逐项验证 WP-113 的所有验收标准，确认模块化拆分正确，向后兼容，无循环引用。

## 任务清单

- [ ] 验证 4 个新模块文件存在且有 JSDoc:
  - `plugins/runtime/yaml-parser.js`
  - `plugins/runtime/plugin-validator.js`（注意此文件也服务于 WP-112/115）
  - `plugins/runtime/settings-merger.js`
  - `plugins/runtime/claude-md-injector.js`
- [ ] 验证 `harness-build.js` 主模块行数 < 1100
- [ ] 验证模块间无循环引用（检查 require 链）
- [ ] 验证向后兼容：运行 `node --test test/runtime/test-harness-build.js`
- [ ] 验证 CLI 正常工作：`node bin/tackle.js build`
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] yaml-parser.js / plugin-validator.js / settings-merger.js / claude-md-injector.js 4 个模块文件存在且有 JSDoc
- [ ] harness-build.js 主模块行数 < 1100
- [ ] 模块间无循环引用
- [ ] test-harness-build.js 全部通过，0 失败
- [ ] `node bin/tackle.js build` 正常执行

## 关键文件

- `plugins/runtime/harness-build.js` — 主编排器
- `plugins/runtime/yaml-parser.js` — YAML 解析模块
- `plugins/runtime/settings-merger.js` — 设置合并模块
- `plugins/runtime/claude-md-injector.js` — CLAUDE.md 注入模块
- `plugins/runtime/plugin-validator.js` — 插件验证模块
- `test/runtime/test-harness-build.js` — 对应测试
