# WP-082-1-impl: 外部插件加载机制 - 代码实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-082.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-082 |
| **依赖** | WP-086 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |

## 职责

实现外部插件加载的核心功能：npm 包加载、本地路径加载、Registry 格式扩展。

## 任务清单

- [ ] Registry entry 增加 `sourceType` 字段 (core/npm/local)
- [ ] 扩展 `resolve-plugin-path.js` 支持 npm source (`require.resolve`)
- [ ] 扩展 `resolve-plugin-path.js` 支持 local source (绝对/相对路径)
- [ ] `plugin-loader.js` 集成 sourceType 分发逻辑
- [ ] `manifest-resolver.js` 增加外部来源扫描与合并
- [ ] `harness-build.js` 适配外部插件构建流程
- [ ] 无效 sourceType 的错误处理
- [ ] 编写 `docs/plugin-package-convention.md`

## 验收标准

- [ ] core 插件正常加载 (回归)
- [ ] npm source 路径解析正确
- [ ] local source 路径解析正确
- [ ] 无效 source 有明确错误信息
- [ ] 插件包约定文档完成

## 关键文件

- `plugins/runtime/plugin-loader.js`
- `plugins/runtime/manifest-resolver.js`
- `plugins/runtime/harness-build.js`
- `plugins/runtime/resolve-plugin-path.js`
- `plugins/plugin-registry.json`
- `docs/plugin-package-convention.md`
