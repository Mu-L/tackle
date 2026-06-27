# WP-110-1-impl: 架构与技术可行性分析

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-110.md`
> - 包含: 背景、目标、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（分析） |
| **父工作包** | WP-110 |
| **依赖** | 无 |
| **执行角色** | architect |
| **状态** | ✅ 完成 |

## 职责

评估当前 Tackle Harness 插件架构是否支撑 roadmap 提出的通用 harness 改造方案。

## 分析维度

### 1. harness-build.js 模块化可行性

- 评估当前 1,546 行单体的拆分难度
- 检查是否已有模块化基础（WP-085 CLI 模块化的经验）
- 评估 roadmap 提出的拆分方案（yaml-parser、settings-merger、claude-md-injector）是否合理
- 判断目标 <800 行是否可达

### 2. 插件契约稳定性

- 评估 plugin-interface.js（244 行）定义的 7 种生命周期状态是否完备
- 4 种插件类型（Skill、Provider、Hook、Validator）是否覆盖所有需求
- PluginContext 的 getProvider()/getPlugin() 懒加载能力是否足够
- 当前契约在扩展为通用平台时是否需要破坏性变更

### 3. 插件加载机制可扩展性

- PluginLoader 依赖解析和拓扑排序是否支持大规模插件
- 循环依赖检测机制是否健壮
- 生命周期管理（load → activate → deactivate）是否满足复杂场景

### 4. Manifest 机制评估

- manifest-resolver 的全局/项目级覆盖是否满足多项目管理需求
- sourceType（core/npm/local）扩展是否足够灵活
- 清单合并策略是否支持版本化

### 5. 零外部依赖策略利弊

- 14,000 行代码零依赖的优势和代价
- 在生态开放后该策略是否可持续
- 是否需要引入选择性依赖机制

### 6. CLI 架构评估

- 模块化后的 commands/ 目录结构是否易于扩展
- 自动发现新命令的机制是否健壮
- 全局安装与本地安装的兼容性

## 任务清单

- [ ] 读取并分析 `plugins/runtime/harness-build.js` 结构
- [ ] 读取并分析 `plugins/contracts/plugin-interface.js` 契约设计
- [ ] 读取并分析 `plugins/runtime/plugin-loader.js` 加载机制
- [ ] 读取并分析 `plugins/runtime/manifest-resolver.js` 覆盖机制
- [ ] 对照 roadmap 方案逐项评估可行性
- [ ] 输出架构可行性分析结论

## 验收标准

- [ ] 每个分析维度有明确的可行性判断（可行/有条件可行/不可行）
- [ ] 判断基于代码事实而非假设
- [ ] 识别出至少 3 个架构层面的关键障碍（如有）
- [ ] 给出架构层面的风险等级评估

## 关键文件

- `plugins/runtime/harness-build.js`
- `plugins/contracts/plugin-interface.js`
- `plugins/runtime/plugin-loader.js`
- `plugins/runtime/manifest-resolver.js`
- `plugins/runtime/resolve-plugin-path.js`
- `bin/tackle.js`
- `commands/` 目录
- `docs/reports/report-2026-05-29-harness-roadmap.md`

---

## 分析结论

> 分析完成时间: 2026-05-29
> 分析基于代码版本: v0.1.2 (commit 2f17b4d)
> 分析方法: 逐文件源码审阅 + 代码度量

### 维度 1: harness-build.js 模块化可行性

**判断: 有条件可行**

**代码事实:**

- 文件实际 1,547 行（含尾部空行），包含 27 个 prototype 方法和 9 个独立私有函数
- 职责边界可通过方法前缀清晰识别，天然形成了 5 个内聚模块:
  - YAML 解析（`_readHarnessConfig` + 8 个 `_parse*` 私有函数，约 280 行）
  - Settings 合并（`updateSettings` + `_isLocalInstall` + `_upsertHookEntry`，约 160 行）
  - CLAUDE.md 注入（`injectClaudeMdRules` + `_buildClaudeMdRuleBlock`，约 140 行）
  - 内容生成（`_generateSkillFrontMatter` + `_generateSkillContent` + `_generateHookStub`，约 90 行）
  - 核心 Build/Validate（`build` + `validate` + 各 `_build*Plugin` + `_validatePlugin`，约 300 行）
- 剩余约 577 行为构造器、工具方法（`_ensureDir`、`_mkdirRecursive`、`_copyDirectory`、`_log`）和 CLI 入口点

**可行性分析:**

- Roadmap 提出的 yaml-parser / settings-merger / claude-md-injector 三模块拆分方案与实际职责边界基本吻合
- YAML 解析模块（约 280 行）是最容易提取的——仅 `_readHarnessConfig` 调用它，无其他依赖
- 目标 < 800 行可达：提取三个模块后，harness-build.js 主文件约 400-500 行
- **条件**: 拆分需同步更新 7 个引用点（`test/runtime/test-harness-build.js` 341 行 + CLI `commands/build.js` 169 行 + `bin/context.js` 的 `createBuilder`）

**风险: 中等** — 拆分本身不复杂，但测试覆盖面需同步扩展。当前测试文件 341 行仅覆盖 build/validate 主流程，YAML 解析和 Settings 合并无独立测试。

---

### 维度 2: 插件契约稳定性

**判断: 可行（需补充工程实践）**

**代码事实:**

- `plugin-interface.js`（244 行）定义了:
  - 7 种生命周期状态: `DISCOVERED → LOADED → RESOLVED → ACTIVATED → RUNNING → DEACTIVATED → UNLOADED`
  - 4 种插件类型: `SkillPlugin`、`HookPlugin`、`ValidatorPlugin`、`ProviderPlugin`，均继承自 `Plugin` 基类
  - `PluginContext` DI 容器: 提供 `getProvider()`（异步懒加载 + Map 缓存）和 `getPlugin()`（同步查找）
- 每种插件类型有明确的抽象方法约束:
  - `SkillPlugin.execute()` — 必须实现
  - `HookPlugin.handle()` — 必须实现
  - `ValidatorPlugin.validate()` — 必须实现
  - `ProviderPlugin.factory()` — 必须实现

**契约完备性评估:**

- 生命周期状态覆盖完整，`RESOLVED` 和 `RUNNING` 状态当前未被 `plugin-loader.js` 实际使用（loader 只到达 `ACTIVATED`），但预留了扩展空间
- 依赖声明通过 `dependencies: { plugins?: string[], providers?: string[] }` 支持，`plugin-loader.js:359` 实际读取 `entry.config.dependencies.plugins` 进行拓扑排序
- `PluginContext.getProvider()` 使用 `Map` 缓存 + `async/await`，设计合理

**扩展为通用平台时的契约风险:**

- **无版本化**: `Plugin` 基类没有版本标识，第三方插件无法声明兼容的契约版本
- **无 API 可见性分类**: 所有方法对子类可见，无 public/internal/experimental 区分
- **SkillPlugin 是特例**: Skill 插件（15/23）不走 JS 类继承，而是通过 `plugin.json` + `skill.md` 文件驱动。`plugin-loader.js:451-458` 为 Skill 类型创建了 `SkillPlugin` 实例但仅存储元数据，不执行 JS 代码。这意味着对 Skill 插件，契约约束仅存在于验证层面
- **PluginContext._runtime 暴露**: `_runtime` 对象直接传递给 `PluginContext` 构造器（`plugin-loader.js:125-131`），虽以下划线标记为私有，但 JS 无真正访问控制

**风险: 低** — 契约本身设计合理，差距在契约周围的工程实践（版本化、可见性分类、schema 验证），不在契约代码本身。

---

### 维度 3: 插件加载机制可扩展性

**判断: 有条件可行**

**代码事实:**

- `plugin-loader.js`（533 行）核心流程:
  1. `_readRegistry()` → 解析 JSON
  2. `_getPluginNames()` → 支持数组和对象两种格式
  3. `_buildDependencyGraph()` → 从 `entry.config.dependencies.plugins` 提取依赖
  4. `_topologicalSort()` → DFS 三色标记算法（WHITE/GRAY/BLACK）
  5. `_loadPlugin()` → 按 type 分发加载
  6. `activate()` → 创建 `PluginContext` + 注入 DI + 调用 `onActivate`

**拓扑排序与循环依赖检测:**

- `_topologicalSort`（`plugin-loader.js:375-415`）使用经典 DFS 三色算法:
  - GRAY → 检测到回边 → 抛出循环依赖错误
  - 缺失依赖节点 → 抛出未知插件错误
- 算法正确性已验证，但存在一个限制: 依赖仅从 `entry.config.dependencies.plugins` 读取，不读取 `plugin.json` 中可能定义的依赖（`Plugin` 基类有 `dependencies` 属性），存在两个依赖声明源的不一致风险

**可扩展性评估:**

- 当前 23 个插件，533 行 loader 代码可胜任
- 缺失 `Provider` 类型依赖解析: `_buildDependencyGraph` 仅读取 `plugins` 依赖，不处理 `providers` 依赖。`ProviderPlugin` 的 `provides` 字段在 `activate()` 中注册到 `_providerRegistry`，但没有在拓扑排序阶段考虑 `getProvider()` 的依赖关系
- 错误隔离已实现（`plugin-loader.js:100-103`）: 单个插件加载失败不阻塞其他插件
- 缺少热加载/热卸载机制: `deactivate` 仅调用 `onDeactivate()`，不从 `loadedPlugins` Map 中移除

**规模化瓶颈:**

- 同步 `fs.readFileSync` 用于读取 registry 和 plugin.json — 大量插件时成为 I/O 瓶颈
- `_topologicalSort` 使用递归 DFS，极深的依赖链可能导致调用栈溢出（虽然对 23 个插件不现实）
- 无加载并行化: 所有插件按拓扑序串行加载和激活

**风险: 中等** — 当前架构可支撑 50+ 插件，但需修复 providers 依赖缺失和同步 I/O 问题才能达到 100+ 插件规模。

---

### 维度 4: Manifest 机制评估

**判断: 有条件可行**

**代码事实:**

- `manifest-resolver.js`（270 行）实现全局 registry + 项目 manifest 合并:
  - `resolveEffectivePlugins()` — 遍历全局插件列表，用项目 manifest 中的覆盖项更新 `enabled` 和 `config`
  - `updatePluginInManifest()` — 智能更新: 若新状态与全局默认一致则从 manifest 中删除覆盖项
  - `createDefaultManifest()` — 从全局 registry 生成包含所有插件的状态快照

- `resolve-plugin-path.js`（161 行）支持三种 sourceType:
  - `core` — `path.join(defaultPluginsDir, source)`
  - `npm` — `require.resolve(source)` + `findPackageRoot()` 向上遍历查找 package.json
  - `local` — 绝对路径直接使用，相对路径基于 registryDir 解析

**关键发现:**

- 当前 23 个 registry 条目全部使用默认 sourceType (`"core"`)，无一声明 `"npm"` 或 `"local"`
- Manifest 合并策略仅覆盖 `enabled` 和 `config` 两个维度，不覆盖 `source` 和 `sourceType` — 项目无法使用 manifest 指定外部插件源
- 无版本化: manifest 有 `version: "1.0.0"` 和 `tackleHarnessVersion` 字段，但没有版本迁移逻辑
- `resolve-plugin-path.js` 的 `findPackageRoot()`（第 136-155 行）使用同步 `fs.existsSync` 循环向上遍历，在 node_modules 嵌套层级深时效率低

**缺失能力:**

- 项目级外部插件注册: 要添加 npm/local 插件，需修改全局 `plugin-registry.json`，项目无法独立引入外部插件
- 版本兼容性: 无 `minHarnessVersion` 字段，无法在加载时校验插件与平台的版本兼容性
- Manifest 与 registry 的 schema 不统一: registry 条目有 `source`、`sourceType`、`config`；manifest 条目仅覆盖 `enabled`、`config`

**风险: 中等** — 核心合并机制健壮，但外部插件的项目级管理能力缺失，需在 v0.3.0 前补齐。

---

### 维度 5: 零外部依赖策略利弊

**判断: 有条件可行（建议引入选择性依赖机制）**

**代码事实:**

- `package.json` 无 `dependencies` 和 `devDependencies` 字段 — 真正的零外部依赖
- 项目自实现了:
  - YAML 解析器（`harness-build.js` 中约 280 行手写 YAML 解析）
  - JSON Schema 验证（`config-validator.js` 582 行手写校验逻辑）
  - 拓扑排序（`plugin-loader.js` 中约 40 行 DFS 算法）
  - 目录递归操作（`_mkdirRecursive`、`_copyDirectory` 约 50 行）
  - 日志系统（`logger.js` 174 行）
  - 事件总线（`event-bus.js` 195 行纯内存 pub/sub）

**优势（代码可验证）:**

- 安装确定性: `npm install tackle-harness` 无网络请求（除 registry 拉包），无供应链风险
- 总代码量约 14,000 行，其中约 1,500 行是自实现的基础设施（YAML 解析 + 配置校验 + 工具函数），占总代码量约 10.7%
- CI 在 Node 18/20 两个版本上运行，零依赖意味着零版本冲突

**代价（代码可验证）:**

- 手写 YAML 解析器（`harness-build.js:870-1111`，约 240 行）仅支持 flat key-value + 单层 list + 单层 object，不支持多行字符串、锚点、引用等 YAML 特性。这是一个潜在的 bug 来源——`harness-config.yaml` 的用户如果使用不支持的 YAML 特性将得到静默错误
- `config-validator.js`（582 行）的验证规则全部硬编码，无法声明式定义 schema。Roadmap 提出的 JSON Schema 形式化将需要引入 `ajv` 或自实现 JSON Schema 验证器
- 缺少 `glob` 库: `test/**/*.js` 测试发现依赖 Node.js 内置 `node:test` 的 glob 支持，CLI 代码中无文件 glob 能力

**可持续性评估:**

- 当前规模（23 插件、4,918 行运行时）零依赖策略可持续
- Roadmap 阶段 II/III 的功能（TypeScript 类型、插件签名验证、性能基准）可能需要引入 `typescript`（编译期）、`crypto`（Node 内置，无需外部包）、`performance-now`（可用 `performance.now()` 替代）
- **关键阈值**: 当外部插件生态启动时，`tackle validate` 需要验证第三方插件的 `plugin.json` schema。自实现 JSON Schema 验证的成本约 1,000-2,000 行代码，引入 `ajv`（约 200KB gzip）可节省大量维护成本

**建议: 引入 `optionalDependencies` 机制**，将 `ajv` 等开发时工具列为可选依赖，运行时仍保持零依赖。

**风险: 低** — 当前策略在阶段 I 完全可持续。阶段 II/III 需评估是否引入选择性依赖，不构成架构障碍。

---

### 维度 6: CLI 架构评估

**判断: 可行**

**代码事实:**

- `bin/tackle.js`（180 行）作为轻量路由器:
  1. 解析全局 flags（`--root`、`--verbose`、`--no-color`、`--help`、`--version`）
  2. 分派到 `commands/*.js` 模块
- `bin/context.js`（119 行）创建执行上下文，提供 `createBuilder()` 工厂方法
- `commands/` 目录有 12 个命令模块，共 1,492 行:
  - 最大: `interactive.js`（340 行）、`init.js`（275 行）、`migrate.js`（212 行）
  - 最小: `version.js`（16 行）、`validate.js`（15 行）

**自动发现机制（`bin/tackle.js:117-149`）:**

- 三级查找: (1) 内置映射表 `commandModules` → (2) 自动发现 `commands/<cmdName>.js` → (3) 遍历所有模块查找 `aliases` 数组
- 新增命令只需创建 `commands/<name>.js` 并导出 `execute(ctx)` 方法，即可被自动发现（第二级）
- 内置映射表 `commandModules`（第 101-115 行）包含 12 个条目，实际上自动发现已覆盖这些路径，映射表仅用于确保别名和快捷方式的优先加载

**扩展性评估:**

- 新增 `tackle doctor`、`tackle generate`、`tackle install` 等命令: 创建对应 .js 文件即可，无需修改 `bin/tackle.js`
- 全局安装与本地安装: `context.js` 的 `createBuilder()` 正确区分 `packageRoot`（npm 包位置）和 `targetRoot`（目标项目），路径解析通过 `resolve-plugin-path.js` 统一处理
- `context.js:86-87` 中 `createBuilder()` 传入 `rootDir`（已标记 deprecated 的旧名），兼容性考虑得当

**局限:**

- 无子命令嵌套: `tackle config set` 和 `tackle config get` 在 `commands/config.js`（82 行）内部用 `if/else` 分支处理，不是框架级子命令路由
- 无参数校验框架: 各命令模块自行解析剩余参数，无统一的参数类型定义和校验
- `commands/interactive.js`（340 行）是最大的命令模块，包含完整的交互式流程逻辑，若继续增长可能需要拆分

**风险: 低** — CLI 架构简洁有效，WP-085 的模块化改造已成功将 1,624 行拆分为 12 个模块。新增命令的边际成本极低。

---

### 架构层面关键障碍

1. **Provider 依赖链断裂** — `_buildDependencyGraph`（`plugin-loader.js:350-367`）仅处理 `plugins` 依赖，不处理 `providers` 依赖。当 Provider A 依赖 Provider B 的输出时，拓扑排序无法保证正确加载顺序。当前 23 个插件未暴露此问题（Provider 无跨依赖），但在生态开放后，第三方插件很可能需要 Provider 间依赖。**影响: 阶段 II 生态使能的阻塞项。**

2. **Manifest 不支持项目级外部插件注册** — `manifest-resolver.js` 的合并逻辑（第 111-133 行）仅覆盖全局 registry 中已存在插件的 `enabled` 和 `config`，无法让项目独立引入 npm/local 插件。这意味着外部插件只能通过修改全局 `plugin-registry.json` 安装，与 Roadmap 阶段 I 的 `tackle install` 命令目标冲突。**影响: 阶段 I 生态基础的阻塞项。**

3. **手写 YAML 解析器的静默错误风险** — `harness-build.js:870-1111` 约 240 行手写 YAML 解析仅支持有限语法子集。对于不支持的 YAML 特性（多行字符串、锚点、复杂嵌套），解析器不报错而是静默忽略或产生错误结果。这在当前只有 `harness-config.yaml` 一个消费者时可接受，但若未来配置文件复杂化将成为稳定性风险。**影响: 阶段 I 模块化拆分时应一并解决。**

---

### 架构风险等级评估

| 风险项 | 概率 | 影响 | 风险等级 | 涉及阶段 |
|--------|------|------|----------|----------|
| Provider 依赖链断裂 | 高（生态开放后必然触发） | 高（加载顺序错误导致运行时失败） | **高** | II |
| Manifest 外部插件注册缺失 | 高（tackle install 需此能力） | 中（可通过修改全局 registry 规避） | **中高** | I |
| 手写 YAML 解析静默错误 | 中（配置文件复杂化时触发） | 中（构建时产生错误输出） | **中** | I |
| harness-build.js 拆分回归 | 低（职责边界清晰） | 中（构建流程中断） | **低中** | I |
| 插件契约无版本化 | 中（第三方插件引入时） | 中（不兼容插件静默加载） | **中** | II |
| 零依赖策略与生态工具冲突 | 低（可选依赖可规避） | 低（影响开发体验而非运行时） | **低** | II/III |

---

### 总体可行性判断

**有条件可行** — 当前架构支撑 Roadmap 阶段 I 的所有工程化改造，但在进入阶段 II 生态开放前需解决三个阻塞项:

1. Provider 依赖链补全（约 2-4 小时工作量）
2. Manifest 外部插件注册扩展（约 4-6 小时工作量）
3. 手写 YAML 解析器替换为 schema-formal 化方案（约 3-4 小时工作量，含 JSON Schema 编写）

Roadmap 四阶段演进路线在架构层面无根本性障碍。`plugin-interface.js` 的契约设计出人意料地完整，CLI 模块化成果显著，核心差距集中在工程实践层面（schema 验证、API 分类、版本化）而非架构层面。
