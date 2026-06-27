# WP-126-6-verify: WP-121 Provider 依赖链二次校验

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

对 WP-121 Provider 依赖链补全进行二次校验，验证依赖解析逻辑的正确性。

## 任务清单

- [ ] 运行 `node --test test/runtime/test-plugin-loader.js`（28 测试）
- [ ] 验证 `_buildDependencyGraph` 两阶段处理（plugins + providers）
- [ ] 验证 `_buildProviderMap` 方法正确构建 provider→plugin 映射
- [ ] 测试场景验证：
  - 短名/全名解析
  - 多层依赖链
  - 混合依赖（plugins + providers）
  - 循环检测
  - 第三方 Provider
- [ ] 验证 plugin-loader.js 覆盖率合理（当前 94.05%）
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 28/28 测试通过
- [ ] _buildDependencyGraph 和 _buildProviderMap 逻辑正确
- [ ] 循环依赖检测生效
- [ ] 覆盖率 ≥ 90%

## 关键文件

- `plugins/runtime/plugin-loader.js`（~639 行，覆盖率 94.05%）
- `test/runtime/test-plugin-loader.js`（28 测试）
