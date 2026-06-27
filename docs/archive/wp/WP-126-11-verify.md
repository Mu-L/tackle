# WP-126-11-verify: WP-120 Manifest 外部插件注册二次校验

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

对 WP-120 Manifest 外部插件注册扩展进行二次校验，验证 3 个新 API 和合并逻辑的正确性。

## 任务清单

- [ ] 运行 `node --test test/runtime/test-manifest-resolver.js`（35 测试）
- [ ] 验证 3 个新 API 的完整功能：
  - `registerExternalPlugin` — 注册外部插件
  - `unregisterExternalPlugin` — 注销外部插件
  - `listExternalPlugins` — 列出外部插件
- [ ] 验证 `resolveEffectivePlugins` 合并逻辑正确处理核心+外部插件
- [ ] 验证 `updatePluginInManifest` 允许外部插件更新
- [ ] 确认 manifest-resolver.js 行数从 270 增长到 448 的合理性
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 35/35 测试通过
- [ ] 3 个新 API 功能正确
- [ ] resolveEffectivePlugins 合并逻辑无误
- [ ] updatePluginInManifest 正确处理外部插件

## 关键文件

- `plugins/runtime/manifest-resolver.js`（~448 行）
- `test/runtime/test-manifest-resolver.js`（35 测试）
