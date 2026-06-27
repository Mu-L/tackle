# WP-125-9-verify: WP-121 Provider 依赖链校验

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

**WP-121: A8 Provider 依赖链补全** — 扩展 _buildDependencyGraph 正确处理 providers 依赖和循环检测，解决第三方 Provider 插件加载的依赖链断裂问题。

## 职责

验证 Provider 依赖链构建正确、循环检测有效、加载顺序正确。

## 任务清单

- [ ] 验证 `_buildDependencyGraph` 正确处理 provider 依赖
- [ ] 验证 `_buildProviderMap` 扫描 plugin.json 构建 provider→plugin 映射
  - 支持短名/全名解析
  - 多层依赖链
  - 混合依赖
- [ ] 验证循环依赖检测有效
- [ ] 验证 Provider 加载顺序正确（被依赖者优先）
- [ ] 运行 `node --test test/runtime/test-plugin-loader.js`
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] _buildDependencyGraph 正确处理 provider 依赖
- [ ] _buildProviderMap 扫描 plugin.json 构建 provider→plugin 映射
- [ ] 循环依赖检测有效
- [ ] Provider 加载顺序正确（被依赖者优先）
- [ ] test-plugin-loader.js 全部通过，0 失败

## 关键文件

- `plugins/runtime/plugin-loader.js` — 插件加载器
- `test/runtime/test-plugin-loader.js` — 对应测试
