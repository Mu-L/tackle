# WP-082-2-test: 外部插件加载机制 - 单元测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-082.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-082 |
| **依赖** | WP-082-1-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

为外部插件加载机制编写路径解析和加载测试。

## 任务清单

- [ ] core source 路径解析测试
- [ ] npm source 路径解析测试 (require.resolve)
- [ ] local source 绝对路径测试
- [ ] local source 相对路径测试
- [ ] 无效 sourceType 错误测试
- [ ] 不存在的 npm 包错误测试
- [ ] 不存在的本地路径错误测试
- [ ] Registry 格式扩展的解析测试
- [ ] manifest-resolver 外部来源合并测试

## 验收标准

- [ ] 所有测试用例通过
- [ ] 覆盖 core/npm/local 三种 sourceType
- [ ] 覆盖边界情况和错误处理

## 关键文件

- `test/runtime/test-external-plugin-loader.js` — 新建
- `plugins/runtime/resolve-plugin-path.js`
- `plugins/runtime/plugin-loader.js`
