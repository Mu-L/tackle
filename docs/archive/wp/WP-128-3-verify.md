# WP-128-3-verify: 插件生态域校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-128.md`

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-128 |
| **依赖** | 无 |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

校验 WP-120（Manifest 外部插件注册扩展）、WP-121（Provider 依赖链补全）的成果。

## 校验范围

### WP-120 Manifest 扩展
- `plugins/runtime/manifest-resolver.js` — resolveEffectivePlugins, registerExternalPlugin, unregisterExternalPlugin, listExternalPlugins
- `plugins/runtime/plugin-loader.js` — 适配外部插件加载

### WP-121 Provider 依赖链
- `plugins/runtime/plugin-loader.js` — _buildDependencyGraph, _buildProviderMap
- `plugins/runtime/resolve-plugin-path.js` — resolvePluginPath, resolveNpmPath
- `test/runtime/test-manifest-resolver.js`
- `test/runtime/test-resolve-plugin-path.js`

## 任务清单

- [ ] 运行 test-manifest-resolver.js 全部测试通过
- [ ] 运行 test-resolve-plugin-path.js 全部测试通过
- [ ] 验证 registerExternalPlugin 注册逻辑
- [ ] 验证 unregisterExternalPlugin 注销逻辑
- [ ] 验证 listExternalPlugins 列表逻辑
- [ ] 验证 resolveEffectivePlugins 合并外部插件
- [ ] 验证 _buildDependencyGraph 处理 providers 依赖
- [ ] 验证 _buildProviderMap 映射正确性
- [ ] 验证循环依赖检测
- [ ] 验证 resolve-plugin-path 三种源类型（core/npm/local）
- [ ] 记录发现的问题

## 验收标准

- [ ] 所有相关测试通过
- [ ] 外部插件注册 API 完整
- [ ] Provider 依赖链解析正确
- [ ] 循环依赖检测有效
- [ ] 发现的问题已记录

## 关键文件

- `plugins/runtime/manifest-resolver.js`
- `plugins/runtime/plugin-loader.js`
- `plugins/runtime/resolve-plugin-path.js`
- `test/runtime/test-manifest-resolver.js`
- `test/runtime/test-resolve-plugin-path.js`
