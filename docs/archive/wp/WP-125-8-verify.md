# WP-125-8-verify: WP-120 Manifest 扩展校验

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

**WP-120: A7 Manifest 外部插件注册扩展** — 扩展 manifest-resolver.js 支持项目级外部插件引入，清除 tackle install 命令的 manifest 管理障碍。

## 职责

验证 manifest-resolver 新增 API 功能正确、外部插件注册/注销流程正常。

## 任务清单

- [ ] 验证 `manifest-resolver.js` 中 `resolveEffectivePlugins` 合并外部插件逻辑正确
- [ ] 验证 3 个新 API 存在且可用：
  - `registerExternalPlugin()`
  - `unregisterExternalPlugin()`
  - `listExternalPlugins()`
- [ ] 验证 `updatePluginInManifest` 允许外部插件
- [ ] 运行 `node --test test/runtime/test-manifest-resolver.js`
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] resolveEffectivePlugins 合并外部插件正确
- [ ] registerExternalPlugin / unregisterExternalPlugin / listExternalPlugins 3 个 API 可用
- [ ] updatePluginInManifest 允许外部插件
- [ ] test-manifest-resolver.js 全部通过，0 失败

## 关键文件

- `plugins/runtime/manifest-resolver.js` — Manifest 解析器
- `test/runtime/test-manifest-resolver.js` — 对应测试
