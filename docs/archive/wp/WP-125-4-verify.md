# WP-125-4-verify: WP-115 Schema 形式化校验

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
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-115: A6 plugin.json schema 形式化** — 创建 plugin.json 的 JSON Schema 定义，反向验证 23 个现有插件，集成到 tackle validate 命令。

## 职责

验证 JSON Schema 覆盖完整、23 个核心插件通过验证、validate 命令集成正确。

## 任务清单

- [ ] 验证 `plugins/contracts/plugin-schema.json` 存在且覆盖所有 plugin.json 字段
- [ ] 验证 `plugins/runtime/plugin-validator.js` 中 schema 验证集成正确
- [ ] 验证 ajv 作为 optionalDependencies，不可用时回退到内联验证
- [ ] 运行 `node --test test/runtime/test-wp115-schema.js`
- [ ] 运行 `node bin/tackle.js validate` 确认使用 schema 验证
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] plugin-schema.json 覆盖所有 plugin.json 字段
- [ ] 23 个核心插件全部通过 schema 验证
- [ ] ajv 作为 optionalDependencies，不可用时回退到内联验证
- [ ] `node bin/tackle.js validate` 使用 schema 验证
- [ ] test-wp115-schema.js 全部通过，0 失败

## 关键文件

- `plugins/contracts/plugin-schema.json` — JSON Schema 定义
- `plugins/runtime/plugin-validator.js` — schema 验证集成
- `test/runtime/test-wp115-schema.js` — 对应测试
- `plugins/core/*/plugin.json` — 23 个核心插件配置
