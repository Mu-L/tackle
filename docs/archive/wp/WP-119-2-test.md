# WP-119-2-test: A5 API 稳定性分类 - API 稳定性文档生成

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-119.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-119 |
| **依赖** | WP-119-1-impl |
| **执行角色** | documenter |
| **状态** | 📋 待执行 |

## 职责

从 JSDoc 标注生成 API 参考文档（Markdown 格式），包含每个 API 的分类和稳定性说明。

## 任务清单

- [ ] 定义 API 参考文档结构（按模块分组）
- [ ] 为 public API 编写详细文档（描述、参数、返回值、示例）
- [ ] 为 experimental API 编写文档并标注不稳定警告
- [ ] 列出 internal API（仅索引，无详细文档）
- [ ] 编写 API 稳定性承诺说明（public 契约 vs experimental 变更策略）
- [ ] 生成 `docs/api-reference.md`

## 验收标准

- [ ] `docs/api-reference.md` 生成完成
- [ ] 所有 public API 有完整文档
- [ ] experimental API 有不稳定警告标注
- [ ] internal API 仅有索引列表
- [ ] 文档结构清晰，可独立阅读

## 关键文件

- `docs/api-reference.md` — 新建
- `plugins/runtime/*.js` — 源文件（读取 JSDoc）
