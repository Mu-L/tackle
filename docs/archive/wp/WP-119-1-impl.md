# WP-119-1-impl: A5 API 稳定性分类 - API 表面审计 + JSDoc 标注

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-119.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-119 |
| **依赖** | WP-113 |
| **执行角色** | architect |
| **状态** | ✅ 已完成 |

## 职责

审计所有公共 API，为每个导出接口标注 `@public`、`@internal`、`@experimental` JSDoc 标签。

## 任务清单

- [ ] 扫描 `plugins/runtime/*.js` 所有模块的导出接口
- [ ] 扫描 `plugins/contracts/*.js` 基类和接口
- [ ] 扫描 `commands/*.js` 命令模块的公共接口
- [ ] 分类每个 API 为 public / internal / experimental
- [ ] 为所有 public API 添加 `@public` JSDoc 标签 + 稳定性说明
- [ ] 为所有 internal API 添加 `@internal` JSDoc 标签
- [ ] 为所有 experimental API 添加 `@experimental` JSDoc 标签 + 变更提示
- [ ] 创建 API 分类索引（模块 → API 列表 → 分类）

## 验收标准

- [ ] 所有 `plugins/runtime/*.js` 导出接口已标注
- [ ] 所有 `plugins/contracts/*.js` 基类接口已标注
- [ ] API 分类有明确标准（public/internal/experimental 定义）
- [ ] JSDoc 标签格式正确

## 关键文件

- `plugins/runtime/*.js` — 标注对象
- `plugins/contracts/*.js` — 标注对象
- `commands/*.js` — 标注对象
