# WP-121-1-impl: Provider 依赖图补全

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-121.md`
> - 包含: 背景、目标、Provider 依赖链补全的完整说明

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-121 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 20min |

## 职责

在 `plugin-loader.js` 中补全 `_buildDependencyGraph` 方法，使其正确处理 provider 类型插件的依赖关系，实现拓扑排序加载、循环依赖检测，确保 Provider 加载顺序正确（被依赖者优先）。

## 任务清单

### Step 1: 分析现有 _buildDependencyGraph 方法

- [ ] 读取 `plugin-loader.js` 中的 `_buildDependencyGraph` 方法
- [ ] 分析当前依赖图的节点类型覆盖范围
- [ ] 确认 provider 类型插件在依赖图中的处理现状
- [ ] 识别缺失的 provider 依赖发现逻辑

### Step 2: 增加 provider 依赖发现

- [ ] 在 `_buildDependencyGraph` 中增加对 provider 类型插件 `provides`/`requires` 字段的解析
- [ ] 解析 `plugin.json` 中的 `dependencies` 字段，识别 provider 间依赖
- [ ] 构建 provider 节点及其入边（被依赖关系）
- [ ] 确保 provider 节点与 skill/hook 节点的依赖关系统一处理

### Step 3: 实现拓扑排序加载

- [ ] 使用 Kahn 算法实现拓扑排序
- [ ] 排序结果确保被依赖的 provider 排在前面
- [ ] 处理无依赖 provider 的并行加载提示
- [ ] 将排序结果传递给插件加载流程

### Step 4: 实现循环依赖检测

- [ ] 在拓扑排序过程中检测循环依赖
- [ ] 循环依赖时抛出明确错误，列出参与的插件名称
- [ ] 错误信息包含循环链路的完整路径
- [ ] 添加循环依赖的日志记录

## 关键文件

### 输入（读取）
- `plugins/runtime/plugin-loader.js` — 现有插件加载和依赖图构建逻辑
- `plugins/plugin-registry.json` — 插件注册信息
- `plugins/contracts/plugin-interface.js` — 插件接口定义

### 输出（修改）
- `plugins/runtime/plugin-loader.js` — 补全 `_buildDependencyGraph` 方法

## 验收标准

- [ ] `_buildDependencyGraph` 正确处理 provider 类型插件的依赖
- [ ] 拓扑排序确保被依赖的 provider 先加载
- [ ] 循环依赖被检测并抛出明确错误
- [ ] 无 provider 依赖时行为不变（向后兼容）
- [ ] 新增逻辑有 JSDoc 注释
