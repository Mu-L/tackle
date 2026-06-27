# WP-120-1-impl: Manifest 扩展实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-120.md`
> - 包含: 背景、目标、Manifest 外部插件注册扩展的完整说明

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-120 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 25min |

## 职责

扩展 `manifest-resolver.js` 支持项目级外部插件注册，使项目可通过 `harness-config.yaml` 或 `settings.json` 引入外部插件，并与现有 `plugin-registry.json` 正确合并。

## 任务清单

### Step 1: 设计外部插件注册格式

- [ ] 确定项目级外部插件的配置格式（`harness-config.yaml` 中的 `externalPlugins` 字段或 `settings.json` 中的对应字段）
- [ ] 定义外部插件条目结构: `{ name, version, source, sourceType }`
- [ ] `sourceType` 支持以下类型: `local`（本地路径）、`npm`（npm 包）、`git`（Git 仓库）
- [ ] 编写配置格式示例供测试使用

### Step 2: 实现项目级插件发现逻辑

- [ ] 在 `manifest-resolver.js` 中新增 `_resolveExternalPlugins(config)` 方法
- [ ] 从 `harness-config.yaml` 读取 `externalPlugins` 配置
- [ ] 解析每个外部插件的 `source` 路径，验证路径有效性
- [ ] 为外部插件生成标准化 manifest 对象，标注 `sourceType`

### Step 3: 实现与 core 插件的合并逻辑

- [ ] 在 `manifest-resolver.js` 中新增 `_mergePluginManifests(corePlugins, externalPlugins)` 方法
- [ ] 合并规则: 外部插件不覆盖同名 core 插件（core 优先）
- [ ] 重复插件处理: 记录 warning 日志，保留 core 版本
- [ ] 合并后的完整插件列表按依赖拓扑排序

### Step 4: 集成到构建流程

- [ ] 修改 `harness-build.js` 中的构建流程，在读取 `plugin-registry.json` 后调用外部插件发现
- [ ] 确保构建日志中区分 core 和外部插件的来源
- [ ] 确保向后兼容: 无外部插件配置时行为不变

## 关键文件

### 输入（读取）
- `plugins/runtime/manifest-resolver.js` — 现有 Manifest 解析逻辑
- `plugins/runtime/plugin-loader.js` — 插件加载逻辑
- `plugins/plugin-registry.json` — 现有插件注册表
- `plugins/runtime/harness-build.js` — 构建流程入口

### 输出（修改）
- `plugins/runtime/manifest-resolver.js` — 新增外部插件发现和合并方法

## 验收标准

- [ ] 外部插件可通过项目级 `harness-config.yaml` 配置注册
- [ ] `sourceType` 正确标注（local/npm/git）
- [ ] 外部插件与 core 插件正确合并，core 优先
- [ ] 重复插件记录 warning 日志
- [ ] 无外部插件配置时行为完全不变（向后兼容）
- [ ] 新增方法有 JSDoc 注释
