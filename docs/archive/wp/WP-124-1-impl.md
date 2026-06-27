# WP-124-1-impl: 迁移路径实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-124.md`
> - 前置依赖: `docs/wp/WP-115.md`（schema 形式化，迁移验证的前置条件）
> - 包含: 背景、目标、版本迁移路径的完整说明

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-124 |
| **依赖** | WP-115 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 15min |

## 职责

实现 v0.1.x 到 v0.2.0 的迁移路径，验证 plugin.json schema 向后兼容性，编写回滚策略文档。

## 任务清单

### Step 1: 测试 v0.1.x 到 v0.2.0 配置迁移

- [ ] 分析 v0.1.x 与 v0.2.0 之间 `plugin.json` 格式的差异
- [ ] 分析 v0.1.x 与 v0.2.0 之间 `harness-config.yaml` 格式的差异
- [ ] 在 `commands/migrate.js` 中实现迁移逻辑:
  - 读取现有 v0.1.x 配置
  - 转换为 v0.2.0 格式
  - 备份原始配置
  - 写入新格式配置

### Step 2: 验证 plugin.json schema 向后兼容性

- [ ] 确认 v0.1.x 格式的 `plugin.json` 在 v0.2.0 下仍可正常解析
- [ ] 列出 v0.2.0 新增字段及其默认值
- [ ] 确认缺失新字段的 v0.1.x 插件不会导致构建失败
- [ ] 编写向后兼容性测试矩阵

### Step 3: 编写回滚策略文档

- [ ] 在 `docs/migration-guide.md` 中记录:
  - 迁移前置条件检查清单
  - 迁移步骤（逐步操作）
  - 回滚步骤（如何恢复到 v0.1.x）
  - 已知限制和注意事项
- [ ] 包含具体的命令示例
- [ ] 包含配置文件变更对照表

## 关键文件

### 输入（读取）
- `commands/migrate.js` — 现有迁移命令实现
- `plugins/plugin-registry.json` — 插件注册信息
- `plugins/runtime/manifest-resolver.js` — Manifest 解析逻辑
- `plugins/runtime/harness-build.js` — 构建流程

### 输出（修改）
- `commands/migrate.js` — 实现迁移逻辑

### 输出（新建）
- `docs/migration-guide.md` — 迁移指南和回滚策略

## 验收标准

- [ ] v0.1.x 配置可自动迁移到 v0.2.0 格式
- [ ] plugin.json schema 向后兼容（v0.1.x 格式仍可使用）
- [ ] 回滚策略文档完整，包含具体操作步骤
- [ ] 迁移过程有备份机制
