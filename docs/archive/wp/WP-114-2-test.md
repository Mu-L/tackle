# WP-114-2-test: A3 3 模块测试补全 - hook-dispatcher + manifest-resolver 测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-114.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-114 |
| **依赖** | WP-114-1-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

为 `hook-dispatcher.js`（当前覆盖率 38.19%）和 `manifest-resolver.js`（当前覆盖率 47.41%）编写单元测试。

## 任务清单

- [ ] 分析 `hook-dispatcher.js` 公共接口（事件分发、钩子注册、执行回调）
- [ ] 分析 `manifest-resolver.js` 公共接口（清单解析、依赖解析、缓存）
- [ ] 编写 hook-dispatcher 事件注册测试
- [ ] 编写 hook-dispatcher 事件分发测试
- [ ] 编写 hook-dispatcher 错误处理测试
- [ ] 编写 manifest-resolver 清单解析测试
- [ ] 编写 manifest-resolver 依赖解析测试
- [ ] 编写 manifest-resolver 缓存行为测试
- [ ] 运行测试确认通过

## 验收标准

- [ ] `test/runtime/test-hook-dispatcher.js` 测试文件创建完成
- [ ] `test/runtime/test-manifest-resolver.js` 测试文件创建完成
- [ ] hook-dispatcher.js 覆盖率 ≥ 70%
- [ ] manifest-resolver.js 覆盖率 ≥ 75%
- [ ] 所有测试用例通过

## 关键文件

- `test/runtime/test-hook-dispatcher.js` — 新建
- `test/runtime/test-manifest-resolver.js` — 新建
- `plugins/runtime/hook-dispatcher.js` — 测试对象
- `plugins/runtime/manifest-resolver.js` — 测试对象
