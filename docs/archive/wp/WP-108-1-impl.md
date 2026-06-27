# WP-108-1-impl: 架构耦合与抽象可行性分析

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-108.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（分析实现） |
| **父工作包** | WP-108 |
| **依赖** | 无 |
| **执行角色** | architect |
| **状态** | 📋 待执行 |

## 职责

分析当前 tackle-harness 代码与 Claude Code 的耦合点，评估抽象方案（Adapter Pattern、Builder Strategy 等）的可行性。明确哪些耦合可以解耦、哪些需要重写、哪些是平台固有的。

## 任务清单

- [ ] 读取 `plugins/runtime/harness-build.js`，识别所有 Claude Code 特有的路径和格式
- [ ] 读取 `plugins/runtime/plugin-loader.js`，识别 Claude Code 特有的生命周期钩子
- [ ] 读取 `plugins/runtime/manifest-resolver.js`，识别 Claude Code 特有的清单格式
- [ ] 读取 `plugins/plugin-registry.json`，识别 Claude Code 特有的注册表字段
- [ ] 读取 `bin/tackle.js` / `commands/*.js`，识别 Claude Code 特有的 CLI 逻辑
- [ ] 对每个耦合点分类：可解耦 / 需重构 / 不可解耦
- [ ] 评估 Adapter Pattern 的适用性
- [ ] 评估 Builder Strategy Pattern 的适用性
- [ ] 输出分析结果（供 WP-108-4 汇总使用）

## 验收标准

- [ ] 所有 Claude Code 耦合点已识别并列出
- [ ] 每个耦合点有"可解耦 / 需重构 / 不可解耦"三级评估
- [ ] 至少评估了 2 种抽象方案的可行性
- [ ] 分析结果格式化输出，可供综合报告引用

## 关键文件

- `plugins/runtime/harness-build.js` — 核心构建模块（~1546 行，主要耦合点）
- `plugins/runtime/plugin-loader.js` — 插件加载器
- `plugins/runtime/manifest-resolver.js` — 清单解析
- `plugins/plugin-registry.json` — 插件注册表
- `bin/tackle.js` — CLI 入口
- `commands/*.js` — CLI 子命令模块

## 输出格式

将分析结果作为结构化文本输出，供 WP-108-4 综合报告引用。建议格式：

```
## 架构耦合分析

### 耦合点清单
| # | 耦合点 | 所在文件 | 耦合类型 | 评估 | 抽象方案建议 |
|---|--------|----------|----------|------|------------|

### 抽象方案评估
| 方案 | 适用场景 | 优势 | 劣势 | 推荐度 |
|------|----------|------|------|--------|
```
