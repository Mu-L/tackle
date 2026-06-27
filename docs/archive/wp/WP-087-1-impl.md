# WP-087-1-impl: 性能监控与诊断模块 - 代码实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-087.md`

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-087 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |

## 职责

实现非侵入式性能监控模块。

## 任务清单

- [ ] 创建 `plugins/runtime/performance-monitor.js`
- [ ] 实现 EventBus 事件监听 (plugin.activated/deactivated)
- [ ] 实现耗时记录 (duration 计算)
- [ ] 实现性能数据查询 API
- [ ] 实现 JSON 导出功能
- [ ] 确保不侵入 PluginLoader 代码

## 验收标准

- [ ] 模块可监听 EventBus 性能事件
- [ ] 自动记录插件操作耗时
- [ ] API 可查询性能数据
- [ ] JSON 导出功能正常

## 关键文件

- `plugins/runtime/performance-monitor.js` — 新建
- `plugins/runtime/event-bus.js` — 事件消费
