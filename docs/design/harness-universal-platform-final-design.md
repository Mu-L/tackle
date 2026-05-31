# Tackle Harness 通用化最终方案设计

**日期**: 2026-05-29
**基于**: WP-109 可行性报告 + WP-110 可行性分析报告
**版本**: v1.0
**状态**: 审查通过

---

## 1. 综合可行性裁决

### 1.1 两报告共识

WP-109 和 WP-110 独立分析后，在以下核心结论上完全一致：

| # | 共识点 | WP-109 来源 | WP-110 来源 |
|---|--------|-------------|-------------|
| C1 | **总体结论一致**: 有条件可行 | 执行摘要: "有条件可行" | 执行摘要: "有条件可行" |
| C2 | **安全是平台化的根本阻塞**: 当前安全成熟度 1/5，外部插件可执行任意代码 | 2.3 节: "安全是平台化的根本性阻塞"，风险 R4 | 5.2 节: 风险 #1 "严重"，WP-110-3 维度 1 |
| C3 | **安全必须前置**: 不能等到生态开放之后才处理安全问题 | 5.1 节: "安全前置"，5.2 节行动项 #1 | 7.2 节: "安全先行"为三项前置条件之首 |
| C4 | **harness-build.js 模块化是多条路线的必经之路**: 1,547 行单体阻塞后续 WP | R1 阻塞项，B1 阻塞点 | 维度 1: "有条件可行"，目标 <800 行可达 |
| C5 | **v0.2.0 时间估算存在低估**: 540min 不够，需 700-800min | 5.2 节: 上调至 700min | 阶段 I 合计 515-790min |
| C6 | **架构基础出人意料地好**: plugin-interface.js 244 行定义完整的生命周期和 DI | 2.1 节: 架构维度 3/5，为最好维度 | 维度 2: "可行"，"差距在工程实践而非架构设计" |
| C7 | **测试基础存在**: 295 测试通过率 100% | 附录 B: "测试基础存在" | 4.1 节: "295 个测试全部通过，行覆盖率 70.48%" |
| C8 | **L2->L3 跃升主要瓶颈是社区而非技术** | 3.3 节: "零外部插件、无社区基础" | 5.4 节: "需 10+ 活跃开发者" |
| C9 | **零外部依赖是供应链安全优势** | 附录 B: "零外部依赖是供应链安全的优势" | 维度 5: "安装确定性...无供应链风险" |
| C10 | **单人维护与平台化存在结构性矛盾** | R7 + 附录 B: "核心风险" | 7.3 节: 需"渐进治理"、"轻量化" |

### 1.2 两报告分歧与裁决

两份报告在以下 5 个方面存在不同程度的差异。基于代码事实和工程判断，逐项裁决如下：

#### 分歧 1: 最大安全风险的具体描述

| 报告 | 描述 |
|------|------|
| WP-109 | "安全模型 1/5 为最大阻塞"（关注成熟度评分） |
| WP-110 | "外部插件任意代码执行为紧急风险"（关注具体攻击面） |

**裁决**: WP-110 的描述更精确。WP-109 从成熟度维度（1/5 评分）给出宏观判断，WP-110 定位到具体代码路径（`plugin-loader.js:462` 的 `require(indexJsPath)` 无沙箱）。两者实质一致，但 WP-110 的攻击面分析对后续安全设计更有指导价值。统一结论采用 WP-110 的具体描述。

#### 分歧 2: 关键障碍的识别侧重

| 报告 | 关键障碍 |
|------|---------|
| WP-109 | harness-build.js 1546 行单体拆分 + 测试计数不一致 |
| WP-110 | Provider 依赖链断裂 + Manifest 不支持项目级外部插件注册 + 手写 YAML 解析静默错误 |

**裁决**: 两者识别的障碍层次不同。WP-109 侧重宏观技术债务（单体文件、测试计数），WP-110 通过逐行代码审查发现了更具体的架构缺陷。裁决如下：

1. **Provider 依赖链断裂**（WP-110 发现）确认为阶段 II 阻塞项 -- `_buildDependencyGraph`（`plugin-loader.js:350-367`）仅处理 `plugins` 依赖不处理 `providers` 依赖，这将导致第三方 Provider 插件无法正确加载
2. **Manifest 外部插件注册缺失**（WP-110 发现）确认为阶段 I 阻塞项 -- `manifest-resolver.js:111-133` 的合并逻辑无法引入外部插件，与 `tackle install` 目标冲突
3. **手写 YAML 解析静默错误**（WP-110 发现）确认为阶段 I 应解决的问题 -- 约 240 行手写解析器不支持的特性静默忽略，用户体验风险

#### 分歧 3: 安全模型的推荐方案

| 报告 | 推荐方案 |
|------|---------|
| WP-109 | "Worker Threads 沙箱 + capabilities 声明"（建议层面） |
| WP-110 | "Worker Threads 沙箱 + capabilities 声明"（含三方案对比评估） |

**裁决**: 无实质分歧。WP-110 提供了更完整的技术选型论证（对比了 Worker Threads / VM Module / 子进程三种方案），并明确排除了 VM Module（已知逃逸，不安全）和子进程（过度工程）。统一采用 WP-110 的三方案对比结论，Worker Threads 为推荐方案。

#### 分歧 4: v0.2.0 安全投入范围

| 报告 | 建议范围 |
|------|---------|
| WP-109 | v0.2.0 安全最小集: 用户确认提示 + 来源警告（~30min），安全模型完整实现推迟到 v0.3.0 |
| WP-110 | v0.2.0 阶段 I: Worker Threads 沙箱 + capabilities 声明（120-180min） |

**裁决**: 采用 **分阶段渐进方案**，结合两者优势：

- **v0.2.0 最小集**: 采用 WP-109 的 30min 方案（用户确认 + 来源警告），确保 `tackle install` 命令发布时至少有基本安全保障
- **v0.3.0 完整安全模型**: 采用 WP-110 的 Worker Threads 沙箱方案，因为完整沙箱实现需要 PluginContext DI 重构，不适合在 v0.2.0 的 700min 预算内完成
- **理由**: v0.2.0 重点是工程补课和模块化，安全沙箱需要 PluginLoader 的 DI 机制重构，与模块化工作存在资源竞争

#### 分歧 5: 零外部依赖策略的未来

| 报告 | 建议 |
|------|------|
| WP-109 | 未具体讨论依赖策略演进 |
| WP-110 | 建议 `optionalDependencies` 机制，将 `ajv` 等列为可选依赖 |

**裁决**: 采纳 WP-110 的建议。在阶段 I 保持零运行时依赖，在阶段 II 引入 `optionalDependencies` 用于开发时工具（如 JSON Schema 验证器）。运行时仍保持零依赖。具体方案：

- `ajv` 作为 `optionalDependencies`，`tackle validate` 使用 schema 验证时尝试加载，不可用时回退到内联验证逻辑
- `package.json` 的 `dependencies` 保持为空

### 1.3 统一结论

**综合裁决: 有条件可行**

Tackle Harness 从"功能完整的工具"改造为"AI Agent 工程平台"的方案在战略方向正确、架构基础足够、技术路径可执行。需要满足以下四项前置条件：

| # | 前置条件 | 阶段 | 来源 |
|---|---------|------|------|
| P1 | **安全前置**: 安全模型必须与 `tackle install` 同步交付，v0.2.0 至少实现用户确认 + 来源警告 | v0.2.0 | C3 |
| P2 | **工程补课**: 为 3 个零测试模块补充测试、修复 Provider 依赖链、扩展 Manifest 注册能力 | v0.2.0 | 分歧 2 |
| P3 | **模块化先行**: harness-build.js 模块化是多条后续路线的必经之路，必须在 Phase 1 完成 | v0.2.0 | C4 |
| P4 | **渐进治理**: 治理机制轻量化，匹配当前团队规模（1 位核心贡献者） | v0.3.0+ | C10 |

**统一成熟度评估**（基于两报告合并的 8 维度数据）:

| 维度 | 当前 | v0.2.0 目标 | v0.3.0 目标 | 最大差距 |
|------|------|-------------|-------------|---------|
| 架构 | 3/5 | 3.5/5 | 4/5 | 最小 |
| 测试 | 2/5 | 3/5 | 3.5/5 | 中等 |
| CI/CD | 2/5 | 2.5/5 | 3/5 | 中等 |
| DX | 2/5 | 2.5/5 | 3/5 | 中等 |
| 安全 | 1/5 | 1.5/5 | 2.5/5 | **最大** |
| 可观测性 | 1/5 | 1.5/5 | 2/5 | 大 |
| 生态 | 1/5 | 1.5/5 | 2/5 | 大 |
| 治理 | 1/5 | 1.5/5 | 2/5 | 大 |

**平均成熟度**: 当前 1.625/5 → v0.2.0 目标 2.1875/5 → v0.3.0 目标 2.75/5

---

## 2. 架构解耦方案

### 2.1 现状分析

#### 2.1.1 harness-build.js 代码结构审计

文件 `plugins/runtime/harness-build.js` 共 1,547 行，包含 27 个 prototype 方法和 9 个独立私有函数。通过逐方法职责分析，天然形成 6 个职责域：

| 职责域 | 方法/函数 | 行数 | 调用关系 |
|--------|----------|------|---------|
| **构造器 + 公共 API** | `HarnessBuild()`, `validate()`, `build()`, `validateConfig()` | ~120 | 入口点 |
| **Registry 读取** | `_readRegistry()`, `_getPluginEntries()` | ~35 | 被公共 API 调用 |
| **验证逻辑** | `_validatePlugin()`, `_formatValidationSummary()` | ~135 | 被 `validate()` 调用 |
| **构建逻辑** | `_resolvePluginDir()`, `_buildPlugin()`, `_buildSkillPlugin()`, `_buildHookPlugin()`, `_buildValidatorPlugin()`, `_buildProviderPlugin()`, `_formatBuildSummary()` | ~290 | 被 `build()` 调用 |
| **内容生成** | `_hasFrontMatter()`, `_generateSkillFrontMatter()`, `_generateSkillContent()`, `_generateHookStub()` | ~90 | 被 `_buildSkillPlugin` 和 `_buildHookPlugin` 调用 |
| **YAML 解析** | `_readHarnessConfig()`, `_parseValue()`, `_parseNestedBlock()`, `_parseChildLines()`, `_parseListItems()`, `_collectChildren()`, `_parseLineAsObject()`, `_parseObjectItems()`, `_serializeConfigValue()` | ~280 | 被 `_injectContextConfig()` 调用 |
| **Context 注入** | `_injectContextConfig()` | ~90 | 被 `_buildSkillPlugin()` 调用 |
| **Settings 合并** | `updateSettings()`, `_isLocalInstall()`, `_upsertHookEntry()` | ~90 | 被 CLI `commands/init.js` 调用 |
| **CLAUDE.md 注入** | `injectClaudeMdRules()`, `_buildClaudeMdRuleBlock()` | ~140 | 被 CLI `commands/init.js` 调用 |
| **工具函数** | `_ensureDir()`, `_mkdirRecursive()`, `_copyDirectory()`, `_log()` | ~75 | 被多处调用 |
| **CLI 入口** | `HarnessBuild.run()` | ~50 | 独立入口 |

#### 2.1.2 耦合点分析

关键耦合点（决定模块边界）：

1. **YAML 解析 <-- Context 注入**: `_injectContextConfig()` 调用 `_readHarnessConfig()` 获取配置数据。这是唯一的跨职责域依赖。
2. **Context 注入 <-- 构建逻辑**: `_buildSkillPlugin()` 调用 `_injectContextConfig()` 处理 skill.md 内容。
3. **Settings 合并 <-- 工具函数**: `updateSettings()` 使用 `_ensureDir()`。
4. **CLAUDE.md 注入 <-- Registry 读取 + 构建逻辑**: `injectClaudeMdRules()` 调用 `_readRegistry()` 和 `_resolvePluginDir()` 扫描 skill 插件。

### 2.2 模块划分

基于职责域分析和耦合关系，拆分为以下 5 个内聚模块 + 保留的精简主模块：

#### 模块 1: `plugins/runtime/yaml-parser.js` (~150 行)

**职责**: 将 `harness-config.yaml` 文件解析为 JavaScript 对象。当前的手写 YAML 解析器仅支持有限语法子集（flat key-value + 单层 list + 单层 object），拆分后可独立测试和逐步替换。

**公共接口**:

```javascript
/**
 * Parse a YAML file into a JavaScript object.
 * Supports flat key-value, single-level lists, and single-level nested objects.
 *
 * @param {string} filePath - absolute path to the YAML file
 * @returns {object} parsed configuration object, empty object on error
 */
function parseYamlFile(filePath) { ... }

/**
 * Parse a YAML string into a JavaScript object.
 *
 * @param {string} content - YAML string content
 * @returns {object} parsed configuration object
 */
function parseYamlString(content) { ... }

/**
 * Serialize a config value for injection into skill.md.
 * Arrays and nested objects become compact JSON; scalars stay as-is.
 *
 * @param {*} val - value to serialize
 * @returns {string} serialized string
 */
function serializeConfigValue(val) { ... }

module.exports = { parseYamlFile, parseYamlString, serializeConfigValue };
```

**提取来源**: `_readHarnessConfig()`, `_parseValue()`, `_parseNestedBlock()`, `_parseChildLines()`, `_parseListItems()`, `_collectChildren()`, `_parseLineAsObject()`, `_parseObjectItems()`, `_serializeConfigValue()` (harness-build.js:870-1131)

**依赖**: 仅 `fs`, `path`（Node.js 内置）

#### 模块 2: `plugins/runtime/settings-merger.js` (~100 行)

**职责**: 将 tackle-harness 的 hook 配置合并到目标项目的 `.claude/settings.json`。处理全局/本地安装模式的路径差异，支持幂等更新。

**公共接口**:

```javascript
/**
 * Merge tackle-harness hooks into the target project's .claude/settings.json.
 * Idempotent: skips hooks that are already registered.
 *
 * @param {object} options
 * @param {string} options.targetRoot  - target project root directory
 * @param {string} options.packageRoot - tackle-harness package root directory
 * @param {Function} [options.ensureDir] - directory creation function (injectable for testing)
 */
function mergeSettings(options) { ... }

/**
 * Detect whether this is a local or global installation.
 *
 * @param {string} packageRoot - package root directory
 * @param {string} targetRoot  - target project root directory
 * @returns {boolean} true if local install
 */
function isLocalInstall(packageRoot, targetRoot) { ... }

module.exports = { mergeSettings, isLocalInstall };
```

**提取来源**: `updateSettings()`, `_isLocalInstall()`, `_upsertHookEntry()` (harness-build.js:1302-1388, 1476-1487)

**依赖**: `fs`, `path`（Node.js 内置）

#### 模块 3: `plugins/runtime/claude-md-injector.js` (~150 行)

**职责**: 扫描所有 skill 插件的 `plan_mode_required` 声明，将 Plan Mode 优先级规则注入目标项目的 `CLAUDE.md`。支持幂等更新（标记块替换）。

**公共接口**:

```javascript
/**
 * Build the rule block content for CLAUDE.md injection.
 *
 * @param {object[]} pluginEntries - enabled plugin entries from registry
 * @param {Function} resolvePluginDir - function to resolve plugin directory
 * @returns {string} rule block content (empty string if no plan_mode_required skills)
 */
function buildRuleBlock(pluginEntries, resolvePluginDir) { ... }

/**
 * Inject tackle-harness managed rules into CLAUDE.md.
 * Idempotent: replaces existing marked block if present, appends if not.
 *
 * @param {object} options
 * @param {string} options.targetRoot    - target project root directory
 * @param {object[]} options.pluginEntries - enabled plugin entries
 * @param {Function} options.resolvePluginDir - plugin directory resolver
 * @param {Function} [options.log]       - logging function
 */
function injectClaudeMdRules(options) { ... }

module.exports = { buildRuleBlock, injectClaudeMdRules };
```

**提取来源**: `injectClaudeMdRules()`, `_buildClaudeMdRuleBlock()`, `CLAUDE_MD_MARKER` 常量 (harness-build.js:1398-1535)

**依赖**: `fs`, `path`（Node.js 内置）

#### 模块 4: `plugins/runtime/plugin-validator.js` (~180 行)

**职责**: 插件格式验证。检查 `plugin.json` 必填字段、类型合规、文件存在性。当前逻辑内嵌在 `HarnessBuild.prototype._validatePlugin()` 中，提取后可独立使用（如 `tackle validate` 命令直接调用）。

**公共接口**:

```javascript
/**
 * Validate a single plugin entry.
 *
 * @param {object} entry  - registry entry with at least a name field
 * @param {string} pluginDir - resolved plugin directory path
 * @returns {{ errors: object[], warnings: object[] }}
 */
function validatePlugin(entry, pluginDir) { ... }

/**
 * Format validation results into a human-readable summary.
 *
 * @param {object} options
 * @param {number} options.totalPlugins
 * @param {object[]} options.errors
 * @param {object[]} options.warnings
 * @returns {string} formatted summary string
 */
function formatValidationSummary(options) { ... }

/**
 * Required fields and valid types constants (exported for external use).
 */
const PLUGIN_REQUIRED_FIELDS = ['name', 'version', 'type', 'description'];
const VALID_PLUGIN_TYPES = ['skill', 'hook', 'validator', 'provider'];

module.exports = {
  validatePlugin, formatValidationSummary,
  PLUGIN_REQUIRED_FIELDS, VALID_PLUGIN_TYPES
};
```

**提取来源**: `_validatePlugin()`, `_formatValidationSummary()`, `PLUGIN_REQUIRED_FIELDS`, `VALID_PLUGIN_TYPES` 常量 (harness-build.js:28-30, 258-386)

**依赖**: `fs`, `path`（Node.js 内置）

#### 模块 5: `plugins/runtime/build-orchestrator.js` (~400 行，精简后的 harness-build.js)

**职责**: 构建编排核心。读取 registry，按类型分发构建，调用子模块完成具体工作。保留为"薄编排层"。

**保留的方法**:
- 构造器 `HarnessBuild()` + 公共 API (`build()`, `validate()`, `validateConfig()`)
- Registry 读取 (`_readRegistry()`, `_getPluginEntries()`)
- 构建分发 (`_buildPlugin()`, `_buildSkillPlugin()`, `_buildHookPlugin()`, `_buildValidatorPlugin()`, `_buildProviderPlugin()`)
- 路径解析委托 (`_resolvePluginDir()` → 调用 `resolve-plugin-path.js`)
- 内容生成 (`_generateSkillFrontMatter()`, `_generateSkillContent()`, `_generateHookStub()`)
- 工具函数 (`_ensureDir()`, `_mkdirRecursive()`, `_copyDirectory()`, `_log()`)
- CLI 入口 (`HarnessBuild.run()`)
- 构建/验证摘要格式化

**新增依赖**:
- `require('./yaml-parser')` — 替代内嵌的 `_readHarnessConfig()`
- `require('./plugin-validator')` — 替代内嵌的 `_validatePlugin()`

**调用方式变化**:

```javascript
// Before: _injectContextConfig() 内部调用 this._readHarnessConfig()
// After:  _injectContextConfig() 内部调用 yamlParser.parseYamlFile(configPath)

// Before: validate() 内部调用 this._validatePlugin(entry)
// After:  validate() 内部调用 pluginValidator.validatePlugin(entry, pluginDir)
```

### 2.3 接口定义

#### 2.3.1 模块间依赖关系

```
                    build-orchestrator.js (~400 行)
                   /           |            \
                  v            v             v
        yaml-parser.js    plugin-validator.js   resolve-plugin-path.js (已有)
        (~150 行)         (~180 行)              (~161 行, 不变)
```

```
settings-merger.js (~100 行)  -- 被 commands/init.js 直接调用
claude-md-injector.js (~150 行) -- 被 commands/init.js 直接调用
```

#### 2.3.2 向后兼容策略

为保持公共 API 不变，`build-orchestrator.js` 仍以 `HarnessBuild` 类名导出：

```javascript
// build-orchestrator.js
var yamlParser = require('./yaml-parser');
var pluginValidator = require('./plugin-validator');

function HarnessBuild(options) {
  // ... 不变的构造器逻辑 ...
}

HarnessBuild.prototype.validate = function validate() {
  // 改为调用 pluginValidator.validatePlugin()
  var pluginEntries = ...;
  for (var i = 0; i < pluginEntries.length; i++) {
    var pluginDir = this._resolvePluginDir(pluginEntries[i]);
    var result = pluginValidator.validatePlugin(pluginEntries[i], pluginDir);
    this._validationErrors = this._validationErrors.concat(result.errors);
    this._validationWarnings = this._validationWarnings.concat(result.warnings);
  }
  // ...
};

// settings-merger 和 claude-md-injector 作为方法代理
var settingsMerger = require('./settings-merger');
HarnessBuild.prototype.updateSettings = function(targetRoot, packageRoot) {
  return settingsMerger.mergeSettings({ targetRoot, packageRoot, ensureDir: this._ensureDir.bind(this) });
};

var claudeMdInjector = require('./claude-md-injector');
HarnessBuild.prototype.injectClaudeMdRules = function(targetRoot) {
  var registry = this._readRegistry();
  var entries = this._getPluginEntries(registry);
  return claudeMdInjector.injectClaudeMdRules({
    targetRoot,
    pluginEntries: entries,
    resolvePluginDir: this._resolvePluginDir.bind(this),
    log: this._log.bind(this)
  });
};

module.exports = HarnessBuild;
```

这样，所有现有调用方（`commands/build.js`, `commands/init.js`, `bin/context.js`, 测试文件）无需修改 import 语句。

#### 2.3.3 测试策略

每个拆分出的模块配备独立测试文件：

| 模块 | 测试文件 | 预估行数 | 关键测试用例 |
|------|---------|---------|------------|
| `yaml-parser.js` | `test/runtime/test-yaml-parser.js` | ~120 | flat KV 解析、单层 list、单层 object、不支持特性静默处理、空文件/缺失文件 |
| `settings-merger.js` | `test/runtime/test-settings-merger.js` | ~80 | 幂等合并、全局/本地路径差异、空 settings 创建 |
| `claude-md-injector.js` | `test/runtime/test-claude-md-injector.js` | ~80 | 首次注入、幂等替换、无 plan_mode 技能时跳过 |
| `plugin-validator.js` | `test/runtime/test-plugin-validator.js` | ~60 | 必填字段缺失、类型无效、skill.md 缺失、版本格式 |

现有 `test/runtime/test-harness-build.js`（341 行）**无需修改**，因为它通过 `new HarnessBuild()` 的公共 API 测试，拆分后的 `build-orchestrator.js` 保持了相同的公共接口。

### 2.4 渐进式拆分路径

拆分按风险从低到高排序，每步完成后运行 295 个测试确认无回归：

| 步骤 | 拆分内容 | 风险 | 预估时间 | 理由 |
|------|---------|------|---------|------|
| **Step 1** | 提取 `yaml-parser.js` | 最低 | 30min | 最独立——仅 `_readHarnessConfig` 调用它，无其他内部依赖 |
| **Step 2** | 提取 `plugin-validator.js` | 低 | 25min | 仅 `validate()` 调用它，接口清晰（输入 entry+dir，输出 errors+warnings） |
| **Step 3** | 提取 `settings-merger.js` | 低 | 20min | 仅 `commands/init.js` 调用 `updateSettings()`，通过 HarnessBuild 代理 |
| **Step 4** | 提取 `claude-md-injector.js` | 中 | 25min | 依赖 `_readRegistry()` 和 `_resolvePluginDir()`，需注入这两个函数 |
| **验证** | 运行全量测试 + 行覆盖率对比 | — | 10min | 确认 295 测试全通过，覆盖率不低于拆分前 |

**总计**: ~110min（含验证和测试编写可并行 ~90min）

**拆分后行数分布**:

| 文件 | 拆分前 | 拆分后 |
|------|--------|--------|
| `harness-build.js` → `build-orchestrator.js` | 1,547 | ~400 |
| `yaml-parser.js` | — | ~150 |
| `plugin-validator.js` | — | ~180 |
| `settings-merger.js` | — | ~100 |
| `claude-md-injector.js` | — | ~150 |
| **合计** | 1,547 | ~980（含新增的 require 语句和接口适配） |

主模块从 1,547 行降至 ~400 行，达到 <800 行目标。新增 4 个模块总计 ~580 行（含 JSDoc 注释和接口声明），总代码量略增（~580 → ~980）是正常的模块化开销。

---

## 3. 安全模型设计

### 3.1 威胁模型

基于 WP-109 和 WP-110 的综合分析，识别以下威胁：

| # | 威胁 | 攻击面 | 严重程度 | 概率 | 当前防护 |
|---|------|--------|----------|------|---------|
| T1 | **外部插件任意代码执行** | `plugin-loader.js:462` 的 `require(indexJsPath)` | 严重 | 高（L1 后必然触发） | 无 |
| T2 | **npm 供应链攻击** | `resolve-plugin-path.js:106` 的 `require.resolve(source)` | 高 | 中 | npm integrity |
| T3 | **Manifest 篡改注入** | `manifest-resolver.js` 的项目级 manifest 覆盖 | 中 | 中 | 无签名/hash |
| T4 | **PluginContext 权限泄露** | `_runtime` 对象直接暴露给所有插件 | 中 | 低 | 下划线约定 |
| T5 | **原型污染** | `plugin.json` 的 `JSON.parse()` 结果直接使用 | 低 | 低 | hook-skill-gate 中的 `sanitizeObject()` |

**威胁优先级**: T1 > T2 > T3 > T4 > T5

**核心攻击路径分析**:

```
用户执行 `tackle install tackle-plugin-malicious`
  → commands/install.js 执行 npm install
  → plugin-registry.json 新增条目 { sourceType: "npm", source: "tackle-plugin-malicious" }
  → 用户执行 `tackle build`
  → harness-build.js 调用 resolve-plugin-path.js 解析路径
  → plugin-loader.js:462 执行 require(resolvedPath + "/index.js")
  → 恶意插件的 index.js 获得宿主进程完全控制权
  → 可执行: child_process.exec(), fs.readFileSync('/etc/passwd'), 网络请求...
```

### 3.2 Capabilities 声明系统

#### 3.2.1 设计原则

- **最小权限默认**: 插件不声明任何 capability 时，只能访问 PluginContext 提供的基础服务（eventBus, stateStore, logger, config）
- **显式声明**: 每个需要额外权限的操作（文件系统、网络、子进程）必须在 `plugin.json` 中声明
- **用户可见**: `tackle build` 和 `tackle validate` 时显示每个插件声明的 capabilities
- **拒绝时静默降级**: 插件应处理 capability 被拒绝的情况，不应崩溃

#### 3.2.2 plugin.json 扩展

```json
{
  "name": "hook-skill-gate",
  "version": "0.1.2",
  "type": "hook",
  "description": "Skill gate hook plugin",
  "capabilities": {
    "filesystem": {
      "read": ["${pluginDir}/**", "${targetRoot}/.claude/**"],
      "write": ["${targetRoot}/.claude/**"]
    },
    "network": false,
    "child_process": false,
    "env": ["TACKLE_*"]
  }
}
```

#### 3.2.3 Capabilities 枚举定义

```javascript
// plugins/contracts/capabilities.js

const Capability = Object.freeze({
  // 文件系统访问
  FS_READ: 'fs.read',           // 读取文件系统
  FS_WRITE: 'fs.write',         // 写入文件系统

  // 网络访问
  NET_REQUEST: 'net.request',   // 发起 HTTP/HTTPS 请求
  NET_LISTEN: 'net.listen',     // 监听网络端口

  // 进程控制
  CHILD_PROCESS: 'child_process', // 启动子进程

  // 环境变量
  ENV_READ: 'env.read',         // 读取环境变量

  // 跨插件访问
  PLUGIN_ACCESS: 'plugin.access', // 访问其他插件的 Provider

  // 核心能力（默认授予，无需声明）
  _DEFAULTS: ['eventbus', 'statestore', 'logger', 'config']
});

// 能力等级分类
const CapabilityLevel = Object.freeze({
  SAFE: 'safe',           // 纯计算，无副作用
  LOW_RISK: 'low_risk',  // 受限的 FS 读、ENV 读
  MEDIUM: 'medium',       // FS 写、网络请求
  HIGH_RISK: 'high_risk' // 子进程、网络监听
});

// 能力 → 风险等级映射
const CAPABILITY_LEVELS = {
  [Capability.FS_READ]: CapabilityLevel.LOW_RISK,
  [Capability.FS_WRITE]: CapabilityLevel.MEDIUM,
  [Capability.NET_REQUEST]: CapabilityLevel.MEDIUM,
  [Capability.NET_LISTEN]: CapabilityLevel.HIGH_RISK,
  [Capability.CHILD_PROCESS]: CapabilityLevel.HIGH_RISK,
  [Capability.ENV_READ]: CapabilityLevel.LOW_RISK,
  [Capability.PLUGIN_ACCESS]: CapabilityLevel.LOW_RISK,
};

module.exports = { Capability, CapabilityLevel, CAPABILITY_LEVELS };
```

#### 3.2.4 能力校验流程

```
1. 插件加载阶段 (plugin-loader.js._loadPlugin)
   ├─ 读取 plugin.json 的 capabilities 字段
   ├─ 如果字段缺失 → 默认为空（仅基础服务）
   ├─ 如果 sourceType === 'core' → 自动信任（跳过校验）
   └─ 如果 sourceType === 'npm' | 'local' → 进入安全审查

2. 安全审查 (v0.2.0 最小集)
   ├─ 在 tackle build 输出中显示外部插件的 capabilities 摘要
   ├─ 在 tackle install 时提示用户确认 capabilities
   │   "插件 tackle-plugin-xxx 声明以下权限:
   │    - fs.read: ${pluginDir}/**
   │    - fs.write: ${targetRoot}/.claude/**
   │    确认安装？[y/N]"
   └─ 用户拒绝 → 中止安装

3. 安全审查 (v0.3.0 完整版)
   ├─ Worker Threads 沙箱内运行时校验
   └─ 违规操作 → 抛出 SecurityError + 审计日志
```

### 3.3 Worker Threads 沙箱架构

#### 3.3.1 架构概览

```
主线程 (Main Thread)                          Worker Thread
┌─────────────────────────┐                  ┌─────────────────────────┐
│ PluginLoader             │                  │ Sandbox Worker           │
│                          │   postMessage    │                          │
│  _activateInSandbox() ──┼─────────────────>│  Plugin.onActivate()     │
│                          │   workerData     │    ├─ context.getProvider│
│  SandboxManager          │                  │    ├─ context.stateStore │
│    ├─ createWorker()     │                  │    └─ context.logger    │
│    ├─ terminateWorker()  │                  │                          │
│    └─ auditLog[]         │<─────────────────│  result / error          │
│                          │   postMessage    │                          │
└─────────────────────────┘                  └─────────────────────────┘
```

#### 3.3.2 与 PluginContext DI 的集成

当前 `PluginContext` 直接持有运行时对象的引用：

```javascript
// 当前: plugin-interface.js:196-208
class PluginContext {
  constructor(pluginName, runtime) {
    this.eventBus = runtime.eventBus;      // 直接引用
    this.stateStore = runtime.stateStore;  // 直接引用
    this.logger = runtime.logger;          // 直接引用
    this.config = runtime.configManager;   // 直接引用
    this._runtime = runtime;               // 整个运行时暴露
  }
}
```

在 Worker Threads 沙箱中，无法传递函数引用跨线程边界（函数不可序列化）。需要引入 **消息代理层**：

```javascript
// plugins/runtime/sandbox-context.js (v0.3.0)

class SandboxContext {
  /**
   * 创建沙箱内的 PluginContext 代理。
   * 所有方法调用通过 postMessage 传递到主线程执行。
   *
   * @param {string} pluginName
   * @param {MessagePort} mainPort - 与主线程通信的端口
   */
  constructor(pluginName, mainPort) {
    this.pluginName = pluginName;
    this._port = mainPort;

    // 代理 eventBus: 仅支持 emit（publish），不支持 on（subscribe 需主线程协调）
    this.eventBus = {
      emit: (event, data) => this._rpc('eventBus.emit', [event, data]),
    };

    // 代理 stateStore
    this.stateStore = {
      get: (key) => this._rpc('stateStore.get', [key]),
      set: (key, value) => this._rpc('stateStore.set', [key, value]),
      delete: (key) => this._rpc('stateStore.delete', [key]),
    };

    // 代理 logger（日志在主线程输出）
    this.logger = {
      info: (msg) => this._rpc('logger.info', [msg]),
      warn: (msg) => this._rpc('logger.warn', [msg]),
      error: (msg) => this._rpc('logger.error', [msg]),
    };
  }

  async getProvider(name) {
    return this._rpc('getProvider', [name]);
  }

  /**
   * RPC 调用: 向主线程发送请求并等待响应。
   * @param {string} method - 方法名
   * @param {Array} args - 参数（必须可序列化）
   * @returns {Promise<any>}
   */
  _rpc(method, args) {
    return new Promise((resolve, reject) => {
      const id = Date.now() + Math.random();
      const handler = (msg) => {
        if (msg.type === 'rpc-response' && msg.id === id) {
          this._port.off('message', handler);
          if (msg.error) reject(new Error(msg.error));
          else resolve(msg.result);
        }
      };
      this._port.on('message', handler);
      this._port.postMessage({ type: 'rpc-request', id, method, args });
    });
  }
}
```

#### 3.3.3 沙箱限制策略

```javascript
// plugins/runtime/sandbox-manager.js (v0.3.0)

const { Worker } = require('worker_threads');
const { Capability, CAPABILITY_LEVELS } = require('../contracts/capabilities');

class SandboxManager {
  /**
   * 在 Worker Thread 中激活插件。
   *
   * @param {object} plugin - 插件实例
   * @param {object} capabilities - 声明的 capabilities
   * @param {object} context - PluginContext（主线程侧）
   * @returns {Promise<void>}
   */
  async activateInSandbox(plugin, capabilities, context) {
    // 1. 序列化约束: 只传递可序列化的数据到 worker
    const workerData = {
      pluginName: plugin.name,
      pluginPath: this._getPluginPath(plugin),
      capabilities: capabilities,
    };

    // 2. 创建 Worker，限制模块加载
    const worker = new Worker(this._getSandboxScriptPath(), {
      workerData,
      // 限制 eval/Function
      execArgv: ['--disable-eval'],
    });

    // 3. 设置 RPC 处理器（响应沙箱内的 context 代理请求）
    worker.on('message', (msg) => {
      if (msg.type === 'rpc-request') {
        this._handleRpcRequest(worker, msg, context, capabilities);
      }
    });

    // 4. 等待激活完成
    return new Promise((resolve, reject) => {
      worker.on('message', (msg) => {
        if (msg.type === 'activated') resolve();
        if (msg.type === 'activation-error') reject(new Error(msg.error));
      });
    });
  }

  /**
   * 处理沙箱内的 RPC 请求，应用 capability 校验。
   */
  _handleRpcRequest(worker, msg, context, capabilities) {
    const { id, method, args } = msg;

    // 能力校验
    if (method === 'getProvider' && !this._hasCapability(capabilities, 'plugin.access')) {
      worker.postMessage({ type: 'rpc-response', id, error: 'Capability plugin.access not declared' });
      this._audit('deny', context.pluginName, method, 'capability not declared');
      return;
    }

    // 执行主线程方法
    try {
      const result = this._callMethod(context, method, args);
      // 结果必须可序列化
      worker.postMessage({ type: 'rpc-response', id, result: this._sanitize(result) });
      this._audit('allow', context.pluginName, method, 'ok');
    } catch (err) {
      worker.postMessage({ type: 'rpc-response', id, error: err.message });
      this._audit('error', context.pluginName, method, err.message);
    }
  }
}
```

### 3.4 权限分级策略

#### 3.4.1 插件来源与权限映射

| sourceType | 信任等级 | 默认权限 | 安全审查 |
|-----------|---------|---------|---------|
| `core` | 完全信任 | 所有 capability 可用 | 无需审查 |
| `npm` | 中度信任 | 仅基础服务，需显式声明额外权限 | 用户确认 + capabilities 校验 |
| `local` | 低信任 | 仅基础服务，需显式声明额外权限 | 用户确认 + capabilities 校验 + 来源路径审计 |

#### 3.4.2 能力限制矩阵

| Capability | core | npm | local | 说明 |
|-----------|------|-----|-------|------|
| eventBus.emit | 自动 | 自动 | 自动 | 事件发布无副作用 |
| stateStore.get/set | 自动 | 自动 | 自动 | 受限 KV 存储 |
| logger.info/warn/error | 自动 | 自动 | 自动 | 日志输出 |
| config.get | 自动 | 自动 | 自动 | 只读配置 |
| fs.read | 自动 | 需声明 | 需声明 | 仅声明路径可读 |
| fs.write | 自动 | 需声明 | 需声明 | 仅声明路径可写 |
| net.request | 自动 | 需声明 | 需声明 | v0.2.0 阶段为警告 |
| child_process | 自动 | 禁止 | 禁止 | v0.2.0 阶段完全禁止 |
| plugin.access | 自动 | 需声明 | 需声明 | 跨插件 Provider 访问 |

### 3.5 审计日志设计

#### 3.5.1 日志格式

```javascript
// 审计日志条目结构
{
  timestamp: '2026-05-29T10:30:00.000Z',
  event: 'capability.check',        // 事件类型
  plugin: 'tackle-plugin-xxx',       // 插件名
  sourceType: 'npm',                 // 来源类型
  capability: 'fs.read',             // 请求的 capability
  decision: 'allow',                 // allow | deny | warn | error
  detail: 'path=${targetRoot}/.claude/**', // 详情
  sessionId: 'abc123',               // 会话标识（用于关联）
}
```

#### 3.5.2 事件类型

| 事件 | 触发时机 | 记录内容 |
|------|---------|---------|
| `plugin.install` | `tackle install` 执行时 | 插件名、来源、声明的 capabilities |
| `plugin.load` | `plugin-loader.js._loadPlugin()` | 插件名、sourceType、capability 审查结果 |
| `capability.check` | 沙箱内 RPC 请求时 | 请求的 capability、决策（allow/deny） |
| `capability.violation` | 插件尝试未声明的 capability | 插件名、capability、调用栈（截取） |
| `sandbox.create` | Worker Thread 创建时 | 插件名、线程 ID |
| `sandbox.terminate` | Worker Thread 终止时 | 插件名、原因（正常/异常） |

#### 3.5.3 日志存储

- **v0.2.0**: 审计日志输出到 `console.warn`（集成到现有 `logger.js`）
- **v0.3.0**: 审计日志写入 `${targetRoot}/.claude/logs/audit-${date}.jsonl`（JSON Lines 格式，每行一条记录）
- **v0.4.0**: 支持日志轮转和远程上报（如有企业需求）

### 3.6 v0.2.0 安全最小集

#### 3.6.1 范围定义

v0.2.0 安全最小集的目标是：**在外部插件首次被加载时，让用户意识到安全风险并做出知情决策**。不实现沙箱，不实现运行时权限校验，仅实现"安装时确认 + 构建时警告"。

#### 3.6.2 具体实现

**实现 1: tackle install 用户确认提示** (~15min)

```javascript
// commands/install.js 中增加确认逻辑

async function confirmInstall(pluginName, registryEntry) {
  // 读取 plugin.json 的 capabilities
  const capabilities = registryEntry.capabilities || {};

  if (Object.keys(capabilities).length === 0) {
    console.log('插件 ' + pluginName + ' 未声明额外权限（仅使用基础服务）。');
    return true; // 无额外权限，自动通过
  }

  console.log('插件 ' + pluginName + ' 声明以下额外权限:');
  for (const [cap, detail] of Object.entries(capabilities)) {
    const level = CAPABILITY_LEVELS[cap] || 'unknown';
    console.log('  - ' + cap + ' (' + level + '): ' + JSON.stringify(detail));
  }
  console.log('');

  // 在非交互模式下拒绝
  if (process.env.TACKLE_ASSUME_YES !== 'true') {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question('确认安装此插件？[y/N] ', resolve);
    });
    rl.close();
    return answer.toLowerCase() === 'y';
  }

  return true;
}
```

**实现 2: tackle build 外部插件来源警告** (~10min)

```javascript
// harness-build.js._buildPlugin() 中增加来源警告

HarnessBuild.prototype._buildPlugin = function(entry) {
  var pluginDir = this._resolvePluginDir(entry);
  // ...

  // 外部插件来源警告
  if (entry.sourceType === 'npm' || entry.sourceType === 'local') {
    this._log('warn', 'Building external plugin: ' + pluginName + ' (source: ' + entry.sourceType + ')');
    if (entry.capabilities) {
      this._log('warn', '  Declared capabilities: ' + Object.keys(entry.capabilities).join(', '));
    } else {
      this._log('warn', '  No capabilities declared (limited to basic services)');
    }
  }

  // ... 原有构建逻辑 ...
};
```

**实现 3: plugin.json capabilities schema 字段** (~5min)

在 `plugin-validator.js`（拆分后）中增加 capabilities 字段的结构验证：

```javascript
// plugin-validator.js 中增加

function validateCapabilities(capabilities) {
  const warnings = [];
  if (!capabilities) return warnings;

  const knownCapabilities = ['filesystem', 'network', 'child_process', 'env'];

  for (const key of Object.keys(capabilities)) {
    if (knownCapabilities.indexOf(key) === -1) {
      warnings.push({
        field: 'capabilities.' + key,
        message: 'Unknown capability: "' + key + '". Known: ' + knownCapabilities.join(', '),
      });
    }
  }

  return warnings;
}
```

#### 3.6.3 v0.2.0 安全最小集验收标准

- [ ] `tackle install` 对声明 capabilities 的外部插件要求用户确认
- [ ] `tackle build` 对外部插件输出来源和 capabilities 警告
- [ ] `tackle validate` 识别 capabilities 字段并验证已知 capability 名称
- [ ] core 插件（sourceType=core）不触发任何安全提示
- [ ] 预估总时间: ~30min

#### 3.6.4 v0.3.0 完整安全模型路线

| 阶段 | 交付物 | 预估时间 | 依赖 |
|------|--------|---------|------|
| v0.3.0-alpha | `capabilities.js` 契约定义 + `sandbox-manager.js` 基础框架 | 60min | harness-build.js 模块化完成 |
| v0.3.0-beta | `sandbox-context.js` RPC 代理 + Worker Threads 集成 | 90min | PluginLoader DI 重构 |
| v0.3.0-rc | 审计日志持久化 + 能力违规处理 | 60min | sandbox-manager 验证 |
| v0.3.0 | 安全 E2E 测试 + 文档 | 30min | 全部完成 |

---

## 4. 质量体系建设

### 4.1 五层质量金字塔

```
                    ┌─────────┐
                    │ L5 关卡  │  CI 门控 + 发布门控
                    ├─────────┤
                    │ L4 E2E  │  init → build → validate 全流程
                    ├─────────┤
                    │ L3 集成  │  模块交互 + 外部插件生命周期
                    ├─────────┤
                    │ L2 单元  │  295+ 测试 + 覆盖率 80%+
                    ├─────────┤
                    │ L1 契约  │  plugin.json schema + 类型合规
                    └─────────┘
```

### 4.2 当前状态评估

#### 4.2.1 各层级现状（基于 WP-110-2 代码审计）

| 层级 | 当前状态 | 关键数据 |
|------|---------|---------|
| **L1 契约验证** | 部分就绪 | `tackle validate` 已实现 plugin.json 必填字段检查；缺少 JSON Schema 形式化定义；`PLUGIN_REQUIRED_FIELDS` 和 `VALID_PLUGIN_TYPES` 硬编码在 `harness-build.js:28-30` |
| **L2 单元测试** | 基础存在 | 295 测试全通过；整体行覆盖率 70.48%，分支覆盖率 71.74%，函数覆盖率 67.93%；3 个模块零专属测试（validator-pipeline, hook-dispatcher, manifest-resolver，共 1,046 行） |
| **L3 集成测试** | 部分存在 | 2 个集成测试文件（test-build-pipeline.js 341 行 + test-plugin-lifecycle.js 478 行）；缺少外部插件生命周期测试和跨平台路径验证 |
| **L4 E2E 测试** | 完全缺失 | 无 CLI 子进程级端到端测试；init → build → validate 工作流无覆盖 |
| **L5 质量关卡** | 基础存在 | CI 有 validate + build + test 步骤；无覆盖率门槛；无发布门控工作流；无 branch protection |

#### 4.2.2 测试覆盖盲区详情

按严重程度排序的盲区（来源: WP-110-2 维度 1）:

| 优先级 | 模块 | 行数 | 行覆盖率 | 函数覆盖率 | 影响分析 |
|--------|------|------|---------|-----------|---------|
| P0 | `validator-pipeline.js` | 467 | 33.83% | 0% | 验证器编排核心，`tackle validate` 直接依赖 |
| P0 | `hook-dispatcher.js` | 309 | 38.19% | 0% | Hook 事件分发，所有 hook 插件的执行路径 |
| P1 | `manifest-resolver.js` | 270 | 47.41% | 50% | 项目级插件覆盖逻辑，外部插件管理基础 |
| P1 | `harness-build.js` | 1,546 | 62.61% | 58.54% | 构建核心，YAML 解析和 Settings 合并无测试 |
| P2 | `config-validator.js` | 582 | 73.88% | 77.78% | 配置校验，分支覆盖率仅 42.11% |

### 4.3 实施路径

#### 4.3.1 L1 契约验证强化 (~30min)

**目标**: 将隐式验证规则形式化为 JSON Schema，使 `tackle validate` 基于声明式 schema 校验。

**实施步骤**:

1. **提取并形式化 plugin.json schema** (15min)
   ```json
   // plugins/contracts/plugin-schema.json
   {
     "$schema": "http://json-schema.org/draft-07/schema#",
     "title": "Tackle Plugin Manifest",
     "type": "object",
     "required": ["name", "version", "type", "description"],
     "properties": {
       "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
       "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+" },
       "type": { "enum": ["skill", "hook", "validator", "provider"] },
       "description": { "type": "string", "minLength": 1 },
       "source": { "type": "string" },
       "sourceType": { "enum": ["core", "npm", "local"] },
       "capabilities": {
         "type": "object",
         "properties": {
           "filesystem": {
             "type": "object",
             "properties": {
               "read": { "type": "array", "items": { "type": "string" } },
               "write": { "type": "array", "items": { "type": "string" } }
             }
           },
           "network": { "type": "boolean" },
           "child_process": { "type": "boolean" },
           "env": { "type": "array", "items": { "type": "string" } }
         }
       },
       "config": { "type": "object" },
       "metadata": { "type": "object" },
       "dependencies": {
         "type": "object",
         "properties": {
           "plugins": { "type": "array", "items": { "type": "string" } },
           "providers": { "type": "array", "items": { "type": "string" } }
         }
       }
     }
   }
   ```

2. **反向验证 23 个现有插件** (10min)
   - 使用 schema 对 23 个 `plugins/core/*/plugin.json` 执行验证
   - 确保所有现有插件通过 schema 校验
   - 如有不一致，以代码为准更新 schema（不强制改插件）

3. **集成到 `tackle validate`** (5min)
   - `plugin-validator.js`（拆分后）加载 schema 并执行校验
   - 零依赖策略下：自实现轻量 schema 校验（仅 required + type + enum），或回退到内联验证

#### 4.3.2 L2 单元测试补全 (~90min)

**目标**: 为 3 个零测试模块补充专属测试，将整体行覆盖率从 70.48% 提升至 80%+。

**各模块测试计划**:

| 模块 | 新测试文件 | 测试用例数 | 预估时间 | 关键场景 |
|------|-----------|-----------|---------|---------|
| `validator-pipeline.js` | `test/runtime/test-validator-pipeline.js` | 12-15 | 35min | 单验证器执行、多验证器链式执行、blocking 验证器失败时中断、验证器异常隔离 |
| `hook-dispatcher.js` | `test/runtime/test-hook-dispatcher.js` | 10-12 | 30min | 单 hook 触发、多 hook 优先级排序、PreToolUse/PostToolUse 事件分发、hook 异常不阻塞其他 hook |
| `manifest-resolver.js` | `test/runtime/test-manifest-resolver.js` | 8-10 | 25min | 全局默认、项目覆盖启用/禁用、智能覆盖项删除（与全局一致时移除）、空 manifest |

**预期覆盖率提升**:

| 模块 | 当前行覆盖率 | 目标行覆盖率 |
|------|------------|------------|
| `validator-pipeline.js` | 33.83% | 75%+ |
| `hook-dispatcher.js` | 38.19% | 70%+ |
| `manifest-resolver.js` | 47.41% | 75%+ |
| **整体** | **70.48%** | **80%+** |

#### 4.3.3 L3 集成测试扩展 (~30min)

**目标**: 在现有 2 个集成测试基础上，增加外部插件生命周期和跨模块交互测试。

**新增测试场景**:

| 场景 | 测试内容 | 预估时间 |
|------|---------|---------|
| 外部插件加载 | 通过 `sourceType: 'local'` 加载外部插件，验证 `resolve-plugin-path.js` + `plugin-loader.js` + `harness-build.js` 协同工作 | 15min |
| Provider 依赖链 | 验证 Provider A 被 Plugin B 依赖时，加载顺序正确且 `getProvider()` 可用 | 10min |
| Manifest + Registry 合并 | 验证项目级 manifest 的覆盖项正确合并到全局 registry | 5min |

#### 4.3.4 L4 E2E 测试建立 (~45min)

**目标**: 建立 CLI 子进程级端到端测试，覆盖 `init → build → validate` 标准工作流。

**技术方案**: 基于 `node:test` + `child_process.execSync` + `os.tmpdir()`。

```javascript
// test/e2e/test-standard-workflow.js 示例结构

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

test('init -> build -> validate standard workflow', async (t) => {
  const tmpDir = path.join(os.tmpdir(), 'tackle-e2e-' + Date.now());

  before(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await t.test('tackle init creates .claude/ structure', () => {
    execSync('node ' + path.resolve('bin/tackle.js') + ' init', { cwd: tmpDir });
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'hooks')));
  });

  await t.test('tackle build generates skill and hook files', () => {
    const result = execSync('node ' + path.resolve('bin/tackle.js') + ' build', {
      cwd: tmpDir, encoding: 'utf-8'
    });
    assert.ok(result.includes('Build SUCCEEDED'));
  });

  await t.test('tackle validate passes for all plugins', () => {
    const result = execSync('node ' + path.resolve('bin/tackle.js') + ' validate', {
      cwd: tmpDir, encoding: 'utf-8'
    });
    assert.ok(result.includes('Validation PASSED'));
  });
});
```

**测试用例清单** (6-8 个):

| # | 用例 | 覆盖路径 |
|---|------|---------|
| 1 | `tackle init` 创建 `.claude/` 结构 | init 命令 + settings.json 生成 |
| 2 | `tackle build` 成功构建所有插件 | build 命令 + 输出文件生成 |
| 3 | `tackle validate` 通过验证 | validate 命令 + plugin.json 校验 |
| 4 | `tackle init` 在已有项目上幂等执行 | init 的覆盖检测 |
| 5 | `tackle build --verbose` 输出详细信息 | verbose 模式 |
| 6 | 禁用部分插件后 `tackle build` 仅构建启用的插件 | manifest 覆盖 |
| 7 | `tackle validate` 对缺失 plugin.json 报错 | 错误路径 |

#### 4.3.5 L5 质量关卡配置 (~20min)

**CI 门控** (PR 合并时):

```yaml
# .github/workflows/ci.yml 增强
# 现有步骤保持不变，增加覆盖率报告和 branch protection

jobs:
  test:
    steps:
      # ... 现有步骤 ...
      - name: Coverage Report
        run: node --experimental-test-coverage --test test/**/*.js 2>&1 | tee coverage.txt
      - name: Check Coverage Threshold
        run: |
          # 解析覆盖率输出，确保行覆盖率 >= 70%
          # 使用 grep + awk 从 coverage.txt 提取数据
          LINE_COV=$(grep "all files" coverage.txt | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$LINE_COV < 70" | bc -l) )); then
            echo "Coverage $LINE_COV% is below threshold 70%"
            exit 1
          fi
```

**发布门控** (版本发布时，新建工作流):

```yaml
# .github/workflows/release.yml (新建)
name: Release Gate
on:
  push:
    tags: ['v*']

jobs:
  release-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run validate
      - run: npm run build
      - run: npm test
      - name: E2E Tests
        run: node --test test/e2e/*.js
      - name: Check Lock File Sync
        run: node -e "const pkg = require('./package.json'); const lock = require('./package-lock.json'); if (lock.version !== pkg.version) { console.error('Lock file version mismatch'); process.exit(1); }"
```

#### 4.3.6 实施时间线

| 优先级 | 层级 | 任务 | 预估时间 | 前置条件 | 目标版本 |
|--------|------|------|---------|---------|---------|
| P0 | L2 | 3 模块测试补全 | 90min | 无 | v0.2.0 Phase 1 |
| P0 | L1 | plugin.json schema 形式化 | 30min | 无 | v0.2.0 Phase 1 |
| P1 | L4 | E2E 标准工作流测试 | 45min | WP-082 (外部插件) | v0.2.0 Phase 2 |
| P1 | L3 | 外部插件生命周期测试 | 30min | WP-082 | v0.2.0 Phase 2 |
| P2 | L5 | 覆盖率 CI 门槛 | 15min | L2 补全完成 | v0.2.0 Phase 2 |
| P2 | L5 | 发布门控工作流 | 15min | L4 完成 | v0.2.0 Phase 3 |

**总计**: ~225min（可在 v0.2.0 的 700min 预算内完成，占总预算 32%）

---

## 5. 实施路线图

### 5.1 v0.2.0 修正行动项

以下行动项由 WP-109（10 项）和 WP-110（6 项）合并去重而成，按优先级排序。标记 **[新增]** 的项目来自 WP-110 的补充发现，标记 **[合并]** 的项目表示两报告在本质上一致但表述不同。

| # | 行动项 | 优先级 | 预估时间 | 来源 | 阻塞关系 |
|---|--------|--------|----------|------|----------|
| **A1** | **安全最小集**: 外部插件加载时用户确认提示 + tackle install 来源警告 | 阻塞 | ~30min | WP-109 R4, WP-110 风险 #1 | 无前置；必须先于 tackle install 发布 |
| **A2** | **harness-build.js 模块化**: 评估（15min）+ 渐进式拆分至 <800 行（第 2 章方案） | 阻塞 | ~110min | WP-109 R1/B1, WP-110 维度 1 | **后续 A4、A5 的前置条件** |
| **A3** | **3 模块测试补全**: validator-pipeline + hook-dispatcher + manifest-resolver（第 4.3.2 节） | 阻塞 | ~90min | WP-109-2 债务, WP-110-2 盲区 | 无前置 |
| **A4** | **E2E 测试套件**: init -> build -> validate 全流程（第 4.3.4 节） | 高 | ~45min | WP-109-1 债务 #3, WP-110-2 | 依赖 A2（模块化稳定后） |
| **A5** | **API 稳定性分类**: JSDoc 标注 public/internal/experimental | 高 | ~60min | WP-109-1 债务 #4 | 依赖 A2（拆分后的模块接口更清晰） |
| **A6** | **plugin.json schema 形式化**: JSON Schema 定义 + 反向验证 23 个插件（第 4.3.1 节） | 高 | ~30min | WP-109 B5, WP-110-2 | 无前置，可与 A2 并行 |
| **A7** | **Manifest 外部插件注册扩展** **[新增]**: manifest-resolver.js 支持项目级外部插件引入 | 高 | ~60min | WP-110 维度 4（manifest 机制） | 阻塞 tackle install 命令 |
| **A8** | **Provider 依赖链补全** **[新增]**: plugin-loader.js `_buildDependencyGraph` 处理 providers 依赖 | 高 | ~45min | WP-110 维度 3（加载机制） | 阻塞第三方 Provider 插件加载 |
| **A9** | **跨平台 CI 矩阵**: 添加 windows-latest | 中 | ~15min | WP-109 R2 | 无前置 |
| **A10** | **覆盖率基线 + CI 门槛**: 配置 Node.js 内置覆盖率、设 70% 门槛 | 中 | ~15min | WP-109-1 债务 #7, WP-110-2 | 依赖 A3（测试补全后才有意义） |
| **A11** | **工程卫生**: lock 文件同步、CONTRIBUTING.md 更新、测试计数统一 | 中 | ~30min | WP-109-1 债务 #9/#13/#15 | 无前置 |
| **A12** | **版本迁移路径**: tackle migrate 升级路径测试 + 回滚策略文档 | 中 | ~30min | WP-109-2 缺口 #1/#2 | 依赖 A6（schema 形式化后才能验证迁移） |
| **A13** | **轻量 API 变更记录**: 持续性习惯，每个 WP 完成时记录变更点到 CHANGELOG | 中 | 持续 | WP-109 R5 | 无前置 |

**v0.2.0 总计**: ~560min（不含 A13 持续性工作），加上 15% 缓冲 = ~645min

**依赖关系图**:

```
Phase 1（无前置，可并行启动）:
  A1 安全最小集 (~30min)
  A2 harness-build.js 模块化 (~110min)
  A3 3 模块测试补全 (~90min)
  A6 plugin.json schema 形式化 (~30min)
  A9 跨平台 CI 矩阵 (~15min)

Phase 2（依赖 Phase 1 完成）:
  A4 E2E 测试套件 (依赖 A2) ~45min
  A5 API 稳定性分类 (依赖 A2) ~60min
  A7 Manifest 外部注册 (可与 Phase 1 并行，但建议 Phase 2) ~60min
  A8 Provider 依赖链 (可与 Phase 1 并行，但建议 Phase 2) ~45min
  A10 覆盖率基线 (依赖 A3) ~15min
  A11 工程卫生 (无依赖，随时可做) ~30min

Phase 3（收尾）:
  A12 版本迁移路径 (依赖 A6) ~30min
```

### 5.2 v0.3.0 行动项

v0.3.0 的核心目标是**生态使能**——在安全模型完善的基础上，开放第三方插件的开发和加载。

| # | 行动项 | 优先级 | 预估时间 | 前置条件 | 来源 |
|---|--------|--------|----------|----------|------|
| **B1** | **安全模型完整实现**: Worker Threads 沙箱 + capabilities 运行时校验 + 审计日志持久化（第 3.3 节方案） | 阻塞 | ~240min | A1 安全最小集、A2 模块化 | WP-109 R4/R6, WP-110 风险 #1 |
| **B2** | **API 稳定性正式分类 + TypeScript 类型定义**: 将 JSDoc 标注转化为 d.ts 类型声明 | 高 | ~120min | A5 API 稳定性分类 | WP-109 R5, WP-110 |
| **B3** | **插件质量标准定义 + tackle doctor 诊断工具**: 自动检测插件结构合规性 | 高 | ~180min | A6 schema 形式化 | WP-110-3 |
| **B4** | **Provider 依赖链 E2E 验证**: 多层 Provider 依赖的完整集成测试 | 中 | ~60min | A8 依赖链补全 | WP-110 维度 3 |
| **B5** | **tackle install/uninstall 命令**: npm 包安装、capabilities 确认、注册表更新 | 高 | ~120min | A7 Manifest 扩展、B1 安全模型 | WP-110-3 |
| **B6** | **示例外部插件**: 编写 1-2 个参考实现，作为第三方开发者模板 | 中 | ~60min | B5 install 命令 | WP-109 R8 缓解 |
| **B7** | **生态 L2a 达标**: 质量标准就绪（工程任务），tackle doctor 通过核心插件 | 中 | ~60min | B3 质量标准 | WP-110-3 |
| **B8** | **结构化日志增强**: logger.js 增加 JSON 格式和耗时记录 | 低 | ~45min | 无 | WP-109-1 债务 |

**v0.3.0 总计**: ~885min

**关键路径**: A1 → B1（安全最小集 → 完整安全模型），A7 → B5（Manifest 扩展 → install 命令）

**v0.3.0 安全模型分期**（基于第 3.6.4 节）:

| 子阶段 | 交付物 | 预估时间 |
|--------|--------|----------|
| v0.3.0-alpha | capabilities.js 契约定义 + sandbox-manager.js 基础框架 | 60min |
| v0.3.0-beta | sandbox-context.js RPC 代理 + Worker Threads 集成 | 90min |
| v0.3.0-rc | 审计日志持久化 + 能力违规处理 | 60min |
| v0.3.0 | 安全 E2E 测试 + 文档 | 30min |

### 5.3 v0.4.0/v1.0.0 远期行动项

v0.4.0 和 v1.0.0 的行动项以**方向性指引**为主，不做精确时间估算。具体范围需在 v0.3.0 完成后根据社区反馈重新评估。

#### v0.4.0: 平台治理

| # | 行动项 | 前置条件 | 说明 |
|---|--------|----------|------|
| C1 | **轻量 RFC 流程** | 有外部贡献者参与 | 限定范围：Plugin 基类接口变更、plugin-registry.json schema 变更。使用 GitHub Discussions 或 ISSUE_TEMPLATE 管理 |
| C2 | **弃用策略**（2 版本弃期） | B2 TypeScript 类型定义完成 | 弃用标记 → 下一个 minor 版本保留但警告 → 再下一个 minor 版本移除 |
| C3 | **结构化日志 + 性能基准** | B8 日志增强完成 | JSON 格式日志、构建性能基准、插件加载耗时追踪 |
| C4 | **SHA-256 插件签名** | B1 安全模型完成 | 使用 Node.js 内置 crypto，对 plugin.json 和 index.js 计算 hash |
| C5 | **自动化 API 变更检测** | B2 TypeScript 类型完成 | CI 中对比 d.ts 文件变更，破坏性变更自动标注 |

#### v1.0.0: 生态成熟

| # | 行动项 | 前置条件 | 说明 |
|---|--------|----------|------|
| D1 | **插件发现机制** | B5 install 命令稳定 | 降级为"npm 上可搜索"，复用 npm registry，不建独立市场。通过 `tackle search` 搜索 npm 上 `tackle-plugin-*` 命名空间的包 |
| D2 | **SLA 级 API 稳定性保证** | C5 API 变更检测运行稳定 | v1.0.0 的定义从"10+ 第三方插件"改为"**工程能力就绪**"——API 有类型定义、变更有检测、破坏有弃期 |
| D3 | **性能基准和回归检测** | C3 结构化日志完成 | CI 中对比构建耗时、内存占用 |
| D4 | **企业需求评估** | 有明确的企业用户反馈 | 远程日志上报、RBAC、多租户等需求在有用户需求后再投入 |

### 5.4 生态演进修正路径

基于 WP-109（3.3 节）和 WP-110（5.4 节）的分析，原始路线图的生态演进路径存在两个问题：一是 L2 未区分工程任务与社区任务，二是 L3 依赖社区规模而非技术方案。修正如下：

| 层级跃升 | 定义 | 性质 | 时间估算 | 关键门槛 | 来源 |
|----------|------|------|----------|----------|------|
| **L0 → L1** | 外部插件可加载 | 技术任务 | **已实现**（WP-082） | resolve-plugin-path.js 支持 core/npm/local 三种 sourceType | WP-109, WP-110 |
| **L1 → L2a** | 质量标准就绪 | **工程任务** | ~300-400min | plugin.json schema 形式化、tackle doctor 可检测插件合规、测试覆盖率 80%+ | WP-109 建议, WP-110-3 |
| **L1 → L2b** | 有外部插件通过标准 | **社区任务** | 不设硬性目标 | 至少 1 个非核心贡献者开发的外部插件通过质量标准 | WP-110-3 社区分析 |
| **L2 → L3** | 自治生态 | **长期愿景** | >1000min | 10+ 活跃外部插件开发者、活跃的 Issue/PR 流动 | WP-109 C8, WP-110-3 |
| **L3 → L4** | 生产就绪平台 | **远期目标** | 未估算 | SLA 级 API 稳定性、性能基准、企业用户需求 | WP-110-3 |

**修正要点**:

1. **L2 拆分为 L2a + L2b**: L2a（质量标准就绪）是纯工程任务，可在 v0.3.0 内完成；L2b（有外部插件通过标准）取决于社区采用，不设硬性时间目标
2. **L3 的核心瓶颈是社区而非技术**: 插件市场基础设施（搜索、评分、安全审查）在 L2b 未达成之前不应投入
3. **v1.0.0 定义修正**: 从"10+ 第三方插件"改为"工程能力就绪"——类型定义、变更检测、弃用策略、安全模型均已稳定

```
生态演进时间线（预估）:

v0.2.0 (~700min): L0 稳固 + 安全最小集 + 工程补课
                  ↓
v0.3.0 (~900min): L1→L2a 完成 + 安全模型完整 + 质量标准工具
                  ↓                ↘
v0.4.0 (估算中):  L2a→L2b 开始     L2b（社区驱动，时间不可控）
                  ↓
v1.0.0:           工程能力就绪（L3 以下全部稳定）
                  ↓
远期:             L3 自治生态（依赖社区增长）
```

---

## 6. 风险治理

### 6.1 综合风险矩阵

合并 WP-109（8 项风险 + 5 个阻塞点）和 WP-110（10 项风险），去重后按风险等级排序。标记来源以便追溯。

| # | 风险 | 严重程度 | 概率 | 风险等级 | 来源 | 影响阶段 |
|---|------|----------|------|----------|------|----------|
| **R1** | **外部插件任意代码执行**: `plugin-loader.js:462` 的 `require(indexJsPath)` 无沙箱，恶意插件获得宿主进程完全控制权 | 严重 | 高（L1 后必然触发） | **紧急** | WP-109 R4, WP-110 #1 | I→II |
| **R2** | **Provider 依赖链断裂**: `_buildDependencyGraph`（`plugin-loader.js:350-367`）仅处理 plugins 依赖不处理 providers 依赖 | 高 | 高 | **高** | WP-110 维度 3, WP-109 分歧 2 | II |
| **R3** | **npm 供应链攻击**: `resolve-plugin-path.js:106` 的 `require.resolve(source)` 可被 typosquat 或账户劫持攻击 | 高 | 中 | **高** | WP-110 #2 | I→II |
| **R4** | **harness-build.js 模块化复杂度低估**: 1,547 行单体内 31 个 prototype 方法间存在隐式耦合，拆分可能出现循环依赖 | 高 | 高 | **高** | WP-109 R1/B1, WP-110 维度 1 | I |
| **R5** | **Manifest 外部插件注册缺失**: `manifest-resolver.js:111-133` 合并逻辑无法引入外部插件，与 tackle install 目标冲突 | 高 | 中 | **中高** | WP-110 维度 4, WP-109 分歧 2 | I |
| **R6** | **测试覆盖盲区**: validator-pipeline（33.83%）、hook-dispatcher（38.19%）、manifest-resolver（47.41%）三个模块共 1,046 行零专属测试 | 高 | 中 | **中高** | WP-110-2, WP-109-1 | I |
| **R7** | **社区规模不足**: L2→L3 需要 10+ 活跃开发者，当前为零外部贡献者，插件市场运维成本远超团队能力 | 高 | 高 | **中高** | WP-109 C8/R8, WP-110 #10 | III/IV |
| **R8** | **手写 YAML 解析静默错误**: ~240 行手写解析器不支持的特性静默忽略，用户配置错误无反馈 | 中 | 中 | **中** | WP-110 维度 1, WP-109 分歧 2 | I |
| **R9** | **插件契约无版本化**: Plugin 基类和 plugin.json schema 变更无版本管理，破坏性变更无迁移路径 | 中 | 中 | **中** | WP-110 #7, WP-109 R5 | II |
| **R10** | **v0.2.0 时间估算低估**: 报告 540min 未包含多项新增行动项，实际可能超过 700min | 中 | 中 | **中** | WP-109 R3, WP-110 阶段 I | I |
| **R11** | **单人维护与平台化结构性矛盾**: 四阶段路线图涉及安全工程、社区运营等多专业领域 | 中 | 高 | **中** | WP-109 R7, WP-110 #7 | 全程 |
| **R12** | **E2E 测试建立成本**: CLI 子进程测试涉及跨平台路径、临时目录清理 | 低 | 中 | **低中** | WP-110 #8 | I |
| **R13** | **零依赖策略与生态工具冲突**: optionalDependencies 策略对 CI 和安装体验的影响 | 低 | 低 | **低** | WP-110 #9, WP-109 分歧 5 | II/III |

**风险等级分布**:
- **紧急**（需立即行动）: 1 项
- **高**（阶段阻塞）: 3 项
- **中高**（需优先解决）: 3 项
- **中**（需关注）: 4 项
- **低**（可延后）: 2 项

### 6.2 风险响应策略

对每项风险采用标准四策略（接受/缓解/转移/规避）之一，并明确责任阶段和验证方式。

| 风险 | 策略 | 具体措施 | 责任阶段 | 验证方式 |
|------|------|----------|----------|----------|
| **R1** 外部插件任意代码执行 | **缓解** | v0.2.0: 用户确认提示 + 来源警告（~30min）；v0.3.0: Worker Threads 沙箱 + capabilities 运行时校验 + 审计日志（~240min） | v0.2.0 起步，v0.3.0 完成 | 安全 E2E 测试：加载恶意 mock 插件时被沙箱阻止 |
| **R2** Provider 依赖链断裂 | **缓解** | v0.2.0 Phase 2 补全 `_buildDependencyGraph` 的 providers 处理（~45min） | v0.2.0 | 多层 Provider 依赖的集成测试通过 |
| **R3** npm 供应链攻击 | **缓解** | v0.2.0: install 时来源警告；v0.3.0: npm integrity 校验 + `tackle-plugin-` 命名空间保护建议 | v0.2.0 起步 | install 命令显示包来源和 hash 信息 |
| **R4** 模块化复杂度低估 | **缓解** | 先执行 15min 评估确认模块边界；采用渐进式拆分（第 2.4 节 4 步路径）；每步运行 295 测试确认无回归 | v0.2.0 Phase 1 | 拆分后 295 测试全通过，主模块 <800 行 |
| **R5** Manifest 注册缺失 | **缓解** | v0.2.0 Phase 2 扩展 manifest-resolver 合并逻辑，支持项目级外部插件条目（~60min） | v0.2.0 | 外部插件通过 manifest 注册的集成测试 |
| **R6** 测试覆盖盲区 | **缓解** | v0.2.0 Phase 1 为 3 模块补充专属测试（~90min），目标行覆盖率 75%+ | v0.2.0 | CI 覆盖率报告显示三模块行覆盖率达标 |
| **R7** 社区规模不足 | **接受** | L2→L3 的社区增长不可控；策略调整为：v1.0.0 定义为"工程能力就绪"而非"生态数量达标"；编写示例外部插件降低准入门槛 | 全程 | 监测 GitHub Stars、外部插件数量 |
| **R8** YAML 解析静默错误 | **缓解** | harness-build.js 模块化后，yaml-parser.js 独立测试可暴露静默行为；v0.2.0 内增加不支持特性的 warning 输出 | v0.2.0 | yaml-parser 测试覆盖不支持语法的处理路径 |
| **R9** 插件契约无版本化 | **缓解** | v0.2.0: plugin.json schema 形式化（~30min）；v0.3.0: TypeScript 类型定义（~120min）；每次 schema 变更记录到 CHANGELOG | v0.2.0 起步 | schema 变更有对应的 CHANGELOG 条目 |
| **R10** 时间估算低估 | **接受 + 缓解** | 接受 540min 不可行的现实，上调至 700min（第 7.1 节论证）；严格按优先级执行，Phase 3 的低优先项可延至 v0.2.1 | v0.2.0 | 预算消耗追踪，超出 600min 时触发范围裁剪 |
| **R11** 单人维护 | **接受** | 每个版本聚焦 2-3 个核心目标；优先完成高杠杆率工作（模块化、E2E 测试）以降低后续维护成本 | 全程 | 每版本交付不超过 3 个主要特性 |
| **R12** E2E 测试成本 | **缓解** | 复用 test-build-pipeline.js 的 createTestProject() 模式；先实现 6-8 个核心用例，不追求全覆盖 | v0.2.0 Phase 2 | E2E 测试在 CI 中稳定通过 |
| **R13** 零依赖策略冲突 | **接受** | 阶段 I 保持零运行时依赖；阶段 II 引入 optionalDependencies（如 ajv），运行时仍保持零依赖 | v0.3.0 | package.json 的 dependencies 为空 |

### 6.3 关键阻塞点

基于 WP-109 的 5 个阻塞点和 WP-110 的阶段阻塞分析，确认以下关键阻塞点及解决路径。

#### 阻塞点 1: 安全模型是平台化的根本性阻塞

| 属性 | 说明 |
|------|------|
| **影响范围** | 全部后续阶段——没有安全模型就不能发布 tackle install，不能开放生态 |
| **来源** | WP-109 R4/B3, WP-110 风险 #1, WP-111 分歧 4 |
| **当前状态** | 安全成熟度 1/5，外部插件可在无约束下执行任意代码 |
| **解决路径** | v0.2.0: 安全最小集（用户确认 + 来源警告，~30min）→ v0.3.0: Worker Threads 沙箱 + capabilities + 审计（~240min） |
| **验证标准** | 安全 E2E 测试通过；tackle install 对外部插件有用户确认流程 |
| **风险** | v0.2.0 最小集仅是"知情同意"，不提供实际防护——在 v0.3.0 沙箱完成前，用户需自行承担风险 |

#### 阻塞点 2: harness-build.js 模块化是多条路线的必经之路

| 属性 | 说明 |
|------|------|
| **影响范围** | API 稳定性分类、E2E 测试、YAML 解析器改进、后续所有 harness-build.js 上的工作 |
| **来源** | WP-109 R1/B1, WP-110 维度 1, WP-111 第 2 章 |
| **当前状态** | 1,547 行单体，6 种职责混合，31 个 prototype 方法 |
| **解决路径** | 4 步渐进式拆分（第 2.4 节），目标主模块 <800 行，拆分为 5 个内聚模块 |
| **验证标准** | 295 测试全通过无回归；主模块行数 <800；新增 4 个模块各有独立测试 |
| **风险** | 隐式耦合可能导致拆分时出现循环依赖——通过 15min 评估先行确认边界来缓解 |

#### 阻塞点 3: Manifest 外部插件注册缺失

| 属性 | 说明 |
|------|------|
| **影响范围** | tackle install 命令——安装的外部插件无法通过 manifest 管理 |
| **来源** | WP-110 维度 4, WP-109 分歧 2 |
| **当前状态** | `manifest-resolver.js:111-133` 合并逻辑仅覆盖已存在插件的 enabled 和 config |
| **解决路径** | v0.2.0 Phase 2 扩展合并逻辑，支持项目级 manifest 引入外部插件条目（~60min） |
| **验证标准** | 外部插件通过 manifest 注册后，tackle build 可正确构建 |

#### 阻塞点 4: plugin.json schema 隐式定义

| 属性 | 说明 |
|------|------|
| **影响范围** | 所有核心插件——schema 每次扩展都是隐式修改，第三方开发者无据可依 |
| **来源** | WP-109 B5, WP-110-2 |
| **当前状态** | 验证规则硬编码在 harness-build.js:28-30，无形式化 schema 定义 |
| **解决路径** | v0.2.0 Phase 1 提取 JSON Schema，反向验证 23 个现有插件（~30min） |
| **验证标准** | 23 个核心插件全部通过 schema 校验；schema 文件可被第三方开发者引用 |

#### 阻塞点 5: 测试计数不一致

| 属性 | 说明 |
|------|------|
| **影响范围** | 质量体系全局——文档中测试数量 164/215/295 三种说法，影响质量可信度 |
| **来源** | WP-109 B4 |
| **当前状态** | CI 实测 295 测试通过，但文档引用不一致 |
| **解决路径** | v0.2.0 Phase 1 以 CI 报告为唯一事实来源，同步修正所有文档 |
| **验证标准** | 所有文档中测试数量引用统一为 CI 实测值 |

---

## 7. 预算与资源

### 7.1 v0.2.0 预算建议

#### 三方估算对比

| 来源 | 估算范围 | 包含内容 | 未包含内容 |
|------|----------|----------|------------|
| **原始路线图** | 540min | 5 个 milestone 的 WP 级估算 | 跨平台 CI、覆盖率配置、安全最小集、schema 形式化 |
| **WP-109 建议** | 700min | 在原始路线上增加安全最小集、schema 形式化、模块化、缓冲 | Manifest 注册扩展、Provider 依赖链补全 |
| **WP-110 建议** | 700-800min | 在 WP-109 基础上增加 Manifest 扩展、YAML 解析器改进 | Worker Threads 沙箱（推至 v0.3.0） |

#### 行动项汇总估算

| 分类 | 行动项 | 小计 |
|------|--------|------|
| Phase 1（无前置） | A1 安全最小集(30) + A2 模块化(110) + A3 测试补全(90) + A6 schema(30) + A9 CI(15) | ~275min |
| Phase 2（依赖 Phase 1） | A4 E2E(45) + A5 API 分类(60) + A7 Manifest 扩展(60) + A8 Provider 链(45) + A10 覆盖率(15) + A11 工程卫生(30) | ~255min |
| Phase 3（收尾） | A12 迁移路径(30) | ~30min |
| **小计** | | **~560min** |
| 缓冲（15%） | 模块化评估偏差、测试编写超时、CI 调试 | ~84min |
| **总计** | | **~644min** |

#### 最终建议值: **700min**

**理由**:

1. **WP-109 和 WP-110 独立给出 700-800min 范围**，两份报告基于不同的分析方法（WP-109 侧重风险驱动，WP-110 侧重代码审计）得出相近结论，可信度高
2. **行动项汇总为 ~560min + 15% 缓冲 = ~644min**，接近两报告建议的下限
3. **700min 为整数预算**，便于授权管理和进度追踪（WP 级授权可精确到 30min 粒度）
4. **剩余 56min 缓冲**（700 - 644）可用于：未预见的技术问题、测试编写超时、Phase 3 范围扩展
5. **与战术路线图的 575-600min 差异约 100-125min**，差异主要来自：安全最小集（30min）、Manifest 扩展（60min）、Provider 链补全（45min）——均为 WP-110 新增发现的必要工作

#### 预算风险控制

| 信号 | 触发条件 | 响应动作 |
|------|----------|----------|
| 黄色警告 | Phase 1 消耗超过 300min | 重新评估 Phase 2 范围，A11/A12 可延至 v0.2.1 |
| 红色警告 | 总消耗超过 600min | 冻结 Phase 3，Phase 2 仅保留 A4（E2E）和 A7（Manifest） |
| 范围裁剪原则 | — | 低优先级项（A11 工程卫生、A12 迁移路径）最先被裁剪；阻塞项和高优先级项不可裁剪 |

### 7.2 资源假设

#### 核心假设

1. **单人维护模式**: v0.2.0 由 1 位核心贡献者完成全部工作，无并行开发能力
2. **时间碎片化**: 每次工作会话约 60-120min，行动项的拆分粒度应匹配此约束
3. **已验证的能力**: 模块化 CLI（WP-085）的成功证明代码拆分能力已具备；295 测试的编写证明测试能力已具备
4. **外部依赖零风险**: 所有行动项基于 Node.js 内置 API，无 npm install 风险

#### 范围控制策略

| 原则 | 说明 |
|------|------|
| **2-3 个核心目标/版本** | v0.2.0: 工程补课 + 安全最小集 + 模块化；v0.3.0: 安全模型 + 生态使能 |
| **高杠杆优先** | 模块化（一次投入，多路线受益）、E2E 测试（长期回归保障）优先于文档更新 |
| **可延后识别** | A11 工程卫生、A12 迁移路径明确标记为可延至 v0.2.1 的候选项 |
| **不可妥协项** | 安全最小集（A1）、模块化（A2）、测试补全（A3）为 v0.2.0 不可裁剪的核心交付 |

### 7.3 时间线

基于 700min 预算和单人维护假设的预估时间线。以每次工作会话 60-120min、每周约 5-8 次会话计算。

#### v0.2.0 预估时间线

| 阶段 | 内容 | 预估时间 | 会话数 | 前置条件 |
|------|------|----------|--------|----------|
| **Phase 1** | 安全最小集 + 模块化评估/拆分 + 测试补全 + schema 形式化 + CI 矩阵 | ~275min | 3-4 次 | 无 |
| **Phase 2** | E2E 测试 + API 分类 + Manifest 扩展 + Provider 链 + 覆盖率 + 工程卫生 | ~255min | 3-4 次 | Phase 1 完成 |
| **Phase 3** | 迁移路径 + 收尾验证 | ~30min | 1 次 | Phase 2 完成 |
| **总计** | | **~560min** (+缓冲至 700min) | **7-9 次** | |

#### 全局时间线

```
v0.2.0 (700min): 工程补课 + 安全最小集
  ├── Phase 1 (~275min): 核心模块化 + 测试 + 安全
  ├── Phase 2 (~255min): E2E + API 稳定性 + 扩展
  └── Phase 3 (~30min): 迁移 + 收尾
      ↓
v0.3.0 (~900min): 安全模型 + 生态使能
  ├── 安全模型 (240min): 沙箱 + capabilities + 审计
  ├── API 正式分类 (120min): TS 类型定义
  ├── 质量工具 (180min): tackle doctor
  ├── 生态命令 (120min): install/uninstall
  └── 其他 (240min): 示例插件 + L2a + 日志增强
      ↓
v0.4.0 (估算中): 平台治理
  ├── RFC 流程 + 弃用策略
  ├── 插件签名 + API 变更检测
  └── 结构化日志 + 性能基准
      ↓
v1.0.0: 工程能力就绪
  ├── 插件发现机制 (npm 搜索)
  ├── SLA 级 API 稳定性
  └── 性能基准和回归检测
```

**关键里程碑**:

| 里程碑 | 版本 | 验收标准 |
|--------|------|----------|
| M1: 工程基础稳固 | v0.2.0 | harness-build.js <800 行；行覆盖率 80%+；E2E 工作流测试通过 |
| M2: 安全模型上线 | v0.3.0 | Worker Threads 沙箱阻止未声明 capability 的操作；审计日志持久化 |
| M3: 生态开放就绪 | v0.3.0 | tackle install/uninstall 可用；质量标准工具就绪；1+ 示例外部插件 |
| M4: 治理机制建立 | v0.4.0 | RFC 流程运行；弃用策略执行过至少一次；API 变更检测自动化 |
| M5: 平台能力成熟 | v1.0.0 | API 有 TS 类型 + 变更检测 + 弃期保证；插件可搜索；性能有基准 |

---

## 8. 交叉验证报告

**验证日期**: 2026-05-29
**验证范围**: 第 1-7 章内部一致性、WP-109/WP-110 源报告覆盖、可读性与格式
**验证方法**: 逐章交叉比对 + 源报告逐项追踪

### 8.1 内部一致性验证结果

#### 8.1.1 可行性裁决(Ch1) 与架构方案(Ch2)

**结论: 一致**

- 架构解耦方案（Ch2）的 5 模块拆分直接解决了 Ch1 识别的 C4 阻塞项（"harness-build.js 模块化是多条路线的必经之路"），拆分目标 <800 行与 Ch1 引用一致。
- Ch1 中"架构基础 3/5"的评价与 Ch2 的模块化可行性分析一致——Ch2 确认了 1,547 行可拆分为 5 个内聚模块，未发现结构性障碍，与 3/5 的"差距在工程实践而非架构"判断吻合。
- 分歧 2 中裁决的 3 项障碍（Provider 依赖链断裂、Manifest 注册缺失、YAML 解析静默错误）均在 Ch2 中有对应模块化方案处理。

#### 8.1.2 安全模型(Ch3) 与质量体系(Ch4)

**结论: 基本一致，发现 1 处待修正项**

- 安全测试已间接纳入质量金字塔——Ch4 的 L2 单元测试（4.3.2 节）补全对象为 validator-pipeline、hook-dispatcher、manifest-resolver，未直接包含安全模块测试。但 Ch3 的 v0.2.0 安全最小集（3.6 节）仅需 ~30min 实现用户确认+来源警告，属于非沙箱层面的功能实现，其测试可通过 L3 集成测试覆盖。
- **待修正项 [S1]**: Ch4 的 L2 单元测试目标（4.3.2 节）未明确覆盖 `plugin-validator.js` 中新增的 `validateCapabilities()` 函数（Ch3 3.6.2 实现 3）。建议在 Ch4 的 L2 测试计划中补充 `plugin-validator.js` 的 capabilities 校验测试用例。此为小范围补充，不构成架构矛盾。

#### 8.1.3 路线图(Ch5) 与架构方案(Ch2) + 安全模型(Ch3)

**结论: 一致，已修正 1 处引用错误**

- **harness-build.js 模块化 110min 与 5 模块拆分方案匹配**: Ch2 第 2.4 节拆分路径总计 ~110min（30+25+20+25+10），与 Ch5 A2 的 ~110min 一致。拆分为 5 个模块（yaml-parser + plugin-validator + settings-merger + claude-md-injector + build-orchestrator 精简主模块）与 Ch2 方案吻合。
- **v0.2.0 安全最小集 30min 合理性**: Ch3 第 3.6 节明确为 3 个实现项（15+10+5=30min），与 Ch5 A1 的 ~30min 一致。v0.3.0 的完整安全模型 ~240min 也与 Ch3 第 3.6.4 节的分阶段估算（60+90+60+30=240min）吻合。
- **已修正**: A2 阻塞关系中 "后续 A5、A9 的前置条件" 修正为 "后续 A4、A5 的前置条件"（A9 跨平台 CI 矩阵不依赖模块化，A4 E2E 测试依赖模块化稳定）。

#### 8.1.4 风险矩阵(Ch6) 与路线图(Ch5)

**结论: 一致**

- **紧急和高风险项均有对应行动项**:
  - R1（外部插件任意代码执行，紧急）→ A1 安全最小集（v0.2.0）+ B1 完整安全模型（v0.3.0）
  - R2（Provider 依赖链断裂，高）→ A8 Provider 依赖链补全（v0.2.0）
  - R3（npm 供应链攻击，高）→ A1 安全最小集中的来源警告 + R3 缓解措施
  - R4（模块化复杂度低估，高）→ A2 模块化评估先行（15min）
- **中高风险项覆盖**:
  - R5（Manifest 注册缺失）→ A7 Manifest 扩展
  - R6（测试覆盖盲区）→ A3 测试补全
  - R7（社区规模不足）→ 已修正 v1.0.0 定义为"工程能力就绪"（Ch5 5.4 节）
- **风险缓解措施与路线图行动项一一对应**: 所有 13 项风险的缓解策略均可在 Ch5 中找到具体行动项。无遗漏。

#### 8.1.5 预算(Ch7) 与路线图(Ch5)

**结论: 一致**

- **v0.2.0 行动项汇总验证**:
  - Phase 1: A1(30) + A2(110) + A3(90) + A6(30) + A9(15) = 275min — 与 Ch7 第 7.1 节 Phase 1 小计 ~275min 一致
  - Phase 2: A4(45) + A5(60) + A7(60) + A8(45) + A10(15) + A11(30) = 255min — 与 Ch7 Phase 2 小计 ~255min 一致
  - Phase 3: A12(30) = 30min — 与 Ch7 Phase 3 小计 ~30min 一致
  - 合计: 275 + 255 + 30 = 560min — 与 Ch5 "v0.2.0 总计 ~560min" 一致
- **15% 缓冲计算**: 560 * 1.15 = 644min — 与 Ch7 计算一致
- **700min 最终建议**: 700 - 644 = 56min 剩余缓冲 — Ch7 的论证逻辑自洽
- **v0.2.0 vs v0.3.0 预算分配**: Ch5 v0.3.0 总计 ~885min 与 Ch7 第 7.3 节全局时间线中的 v0.3.0 ~900min 存在 15min 差异，原因在于 v0.3.0 子项四舍五入。差异在合理范围内，已在 Ch7 保留为 ~900min 概算。

### 8.2 源报告覆盖验证结果

#### 8.2.1 WP-109 核心发现覆盖检查

**8 维度成熟度评估 — 完全覆盖**: Ch1 第 1.3 节"统一成熟度评估"表将 8 个维度（架构、测试、CI/CD、DX、安全、可观测性、生态、治理）全部纳入，当前值、v0.2.0 目标、v0.3.0 目标均已定义，与 WP-109 第 2.1 节的 8 维度数据一致。

**18 项技术债务 — 已纳入路线图**: WP-109 第 2.2 节识别的 18 项技术债务在 Ch5 行动项中的覆盖情况:
- 阻塞级（1 项，无安全模型）→ A1 安全最小集 + B1 完整安全模型
- 高风险（4 项）→ A2 模块化、A4 E2E 测试、A5 API 分类、A6 schema 形式化
- 中风险（6 项）→ A9 跨平台 CI、A10 覆盖率、A11 工程卫生、A12 迁移路径、B8 日志增强、v0.4.0 结构化日志
- 低风险（7 项）→ A11 lock 文件同步、A13 API 变更记录、v0.4.0 弃用策略等

**8 项风险 + 5 个阻塞点 — 完全覆盖**: Ch6 第 6.1 节综合风险矩阵包含 13 项风险（R1-R13），其中:
- WP-109 的 R1-R8 全部纳入（对应设计文档的 R1、R3-R4、R6-R7、R9-R11，部分重新编号）
- WP-109 的 B1-B5 全部纳入 Ch6 第 6.3 节的 5 个关键阻塞点

**10 项行动项 — 完全覆盖**: WP-109 第 5.2 节的 10 项行动项与 Ch5 v0.2.0 的 A1-A13 完全对齐:
- WP-109 行动项 1-10 → Ch5 A1-A13（部分合并或扩展），无遗漏

#### 8.2.2 WP-110 核心发现覆盖检查

**10 项风险矩阵 — 完全覆盖**: WP-110 第 6.1 节的 10 项风险在 Ch6 中全部纳入:
- WP-110 #1-10 → Ch6 R1-R13（重新编号合并后），风险等级评定与源报告一致

**3 个关键架构障碍 — 全部解决**:
- Provider 依赖链断裂 → Ch1 分歧 2 裁决为阶段 II 阻塞项 + Ch5 A8 补全 + Ch6 R2 风险追踪
- Manifest 外部插件注册缺失 → Ch1 分歧 2 裁决为阶段 I 阻塞项 + Ch5 A7 扩展 + Ch6 R5 风险追踪
- 手写 YAML 解析静默错误 → Ch1 分歧 2 裁决为阶段 I 应解决 + Ch2 拆分 yaml-parser.js 独立模块 + Ch6 R8 风险追踪

**安全沙箱方案 — 已采纳**: Ch3 第 3.3 节采用 Worker Threads 沙箱方案，并提供了三方案对比（排除了 VM Module 和子进程），与 WP-110 第 5.3 节推荐一致。

**生态演进路径 — 已整合**: Ch5 第 5.4 节的生态演进修正路径（L2 拆分为 L2a+L2b、L3 瓶颈是社区、v1.0.0 定义修正）完全整合了 WP-110 第 5.4 节的分析，并与 WP-109 第 3.3 节的建议一致。

#### 8.2.3 共识与分歧呈现

**共识 — 正确列出**: Ch1 第 1.1 节的 C1-C10 共识点逐一与 WP-109 和 WP-110 源报告对照验证:
- C1-C10 均可从两份源报告中找到对应内容，来源引用（WP-109 章节号、WP-110 章节号）准确
- C5 的"v0.2.0 时间估算存在低估"在 WP-109 第 3.1 节和 WP-110 第 7.2 节中均有体现，覆盖正确

**分歧裁决 — 有明确理由**: Ch1 第 1.2 节的 5 项分歧均有:
- 两报告各自观点的陈述
- 基于代码事实或工程判断的裁决理由
- 统一的采纳结论

### 8.3 发现的问题与修正

#### 已直接修正的问题

| # | 位置 | 问题类型 | 修正内容 |
|---|------|---------|---------|
| F1 | Ch5 A2 阻塞关系列 | 引用错误 | "后续 A5、A9 的前置条件" 修正为 "后续 A4、A5 的前置条件"。A9（跨平台 CI 矩阵）不依赖模块化，而 A4（E2E 测试）依赖模块化稳定 |

#### 记录的待修正项

| # | 位置 | 问题类型 | 描述 | 严重程度 |
|---|------|---------|------|---------|
| S1 | Ch4 第 4.3.2 节 L2 测试计划 | 覆盖缺口 | 新增的 `plugin-validator.js` 拆分模块中包含 `validateCapabilities()` 函数（Ch3 第 3.6.2 节实现 3），但 Ch4 的 L2 测试计划表未列出此模块的测试用例。建议在拆分完成时补充 plugin-validator 的 capabilities 校验测试 | 低 |
| S2 | Ch4 第 4.3.2 节测试文件表 | 行数估算 | yaml-parser.js 测试文件预估 ~120 行（Ch2 第 2.3.3 节测试策略表）与 Ch4 的 L2 测试计划不一致——Ch4 的 L2 计划仅覆盖 3 个零测试模块，未包含拆分新增模块的测试。建议将拆分模块测试纳入 L2 计划或明确标注为 A2 模块化 WP 的一部分 | 低 |

#### 无需修正的确认项

以下内容经验证无问题:

1. **数据一致性**: 560min 行动项汇总 + 15% 缓冲 = 644min → 700min 预算，计算正确
2. **Phase 分配**: Phase 1/2/3 的时间汇总与行动项明细一致
3. **风险等级分布**: Ch6 统计（紧急 1、高 3、中高 3、中 4、低 2）与 R1-R13 表逐一核对一致
4. **成熟度平均值**: 当前 1.625/5 = (3+2+2+2+1+1+1+1)/8 = 13/8 = 1.625，计算正确
5. **v0.2.0 目标平均值**: 2.1875/5 = (3.5+3+2.5+2.5+1.5+1.5+1.5+1.5)/8 = 17.5/8 = 2.1875，计算正确
6. **v0.3.0 目标平均值**: 2.75/5 = (4+3.5+3+3+2.5+2+2+2)/8 = 22/8 = 2.75，计算正确
7. **模块拆分行数**: 400+150+180+100+150 = 980，合计与表格声明一致
8. **Ch5 中 [新增] 标记**: A7、A8 标记为 [新增]，确实来自 WP-110 的补充发现，WP-109 未包含这两项

### 8.4 验证结论

**整体评价: 设计文档内部一致，与源报告无遗漏，可独立阅读。**

#### 一致性评级

| 验证维度 | 评级 | 说明 |
|---------|------|------|
| Ch1-Ch2 可行性裁决与架构方案 | 通过 | 架构解耦方案完整解决了可行性裁决识别的阻塞项 |
| Ch3-Ch4 安全模型与质量体系 | 基本通过 | 安全测试覆盖存在 2 处小范围待补充项（S1、S2），不构成架构矛盾 |
| Ch5-Ch2+Ch3 路线图与架构+安全 | 通过 | 时间估算与复杂度评估匹配，已修正 1 处引用错误（F1） |
| Ch6-Ch5 风险矩阵与路线图 | 通过 | 所有紧急和高风险项均有对应行动项，缓解措施可追溯 |
| Ch7-Ch5 预算与路线图 | 通过 | 数学计算一致，15% 缓冲合理 |
| WP-109 核心发现覆盖 | 通过 | 8 维度 + 18 债务 + 8 风险 + 5 阻塞点 + 10 行动项全部纳入 |
| WP-110 核心发现覆盖 | 通过 | 10 风险 + 3 架构障碍 + 沙箱方案 + 生态路径全部纳入 |
| 可读性与独立性 | 通过 | 文档不依赖源报告即可阅读，章节间引用正确 |

#### 遗留项汇总

- **已修正**: 1 项（F1: A2 阻塞关系引用错误）
- **待补充**: 2 项（S1: plugin-validator capabilities 测试; S2: 拆分模块测试归属）
- **重大遗漏或矛盾**: 无

---

*文档结束。WP-111 完整方案包含 9 章: 综合可行性裁决 (1)、架构解耦方案 (2)、安全模型设计 (3)、质量体系建设 (4)、实施路线图 (5)、风险治理 (6)、预算与资源 (7)、交叉验证报告 (8)、审查记录 (9)。*

## 9. 审查记录

**审查日期**: 2026-05-29
**审查者**: WP-111-4-review (方案质量审查)
**审查对象**: harness-universal-platform-final-design.md v1.0 (第 1-8 章)
**审查方法**: 逐章审查 + 代码库事实核对 + 数学验证

### 9.1 审查结论

**PASS WITH NOTES** -- 设计文档质量达到交付标准，可作为 v0.2.0 后续执行的指导文档。

文档在技术正确性、完整性、可行性三个维度均通过审查。发现并直接修正了 3 处数据错误（成熟度平均值计算、缓冲金额四舍五入），均不影响方案结论。发现 2 处低风险记录项（安全模块测试归属、手写 YAML 解析器替换时机），不构成阻断。

### 9.2 技术正确性审查

#### 9.2.1 架构方案合理性

**结论: 通过**

1. **5 模块拆分完整性**: 通过逐行核对 `harness-build.js` (1547 行) 的代码结构，确认文档中列出的 11 个职责域完整覆盖了所有 prototype 方法和独立函数。5 个拆分模块（yaml-parser、settings-merger、claude-md-injector、plugin-validator、build-orchestrator）的划分与代码中实际的耦合关系吻合：
   - yaml-parser: 函数 `_readHarnessConfig` 至 `_serializeConfigValue` 位于行 870-1131，确认为最独立的职责域
   - settings-merger: `updateSettings` (行 1329)、`_isLocalInstall` (行 1302)、`_upsertHookEntry` (行 1476) 为独立操作组
   - claude-md-injector: `injectClaudeMdRules` (行 1496)、`_buildClaudeMdRuleBlock` (行 1407) 依赖 registry 和 resolvePluginDir，文档已正确识别需注入这两个函数
   - plugin-validator: `_validatePlugin` (行 258) 和 `_formatValidationSummary` (行 355) 接口清晰
   - build-orchestrator: 精简主模块保留构建编排逻辑

2. **模块间接口定义**: 文档为每个模块提供了 JSDoc 级别的接口定义（输入参数、返回值类型、依赖声明），足以指导实现。依赖关系图（2.3.1 节）准确反映了代码中的 require 关系。

3. **向后兼容策略**: `build-orchestrator.js` 保持 `HarnessBuild` 类名和公共 API 不变的方案可行。经核实，所有现有调用方（`commands/*.js`、测试文件）均通过 `new HarnessBuild()` 或 `HarnessBuild.run()` 使用，代理模式（prototype 方法内部转发到子模块）不会破坏现有调用。

4. **渐进式拆分路径**: 4 步拆分按风险从低到高排序合理。Step 1 (yaml-parser) 确实是最独立的模块——经代码确认，仅 `_readHarnessConfig` 调用链涉及这些函数，无其他内部依赖。每步后运行 295 测试的验证策略正确。

#### 9.2.2 安全模型适当性

**结论: 通过**

1. **Worker Threads 沙箱方案**: 文档选择 Worker Threads 而非 VM Module 或子进程的论证合理。VM Module 确实存在已知的逃逸漏洞（可通过 `this.constructor.constructor('return this')()` 获取全局对象），不适合安全场景。子进程方案确实过度工程且通信开销大。Worker Threads 方案：
   - 优势：同一进程内隔离、支持 `execArgv: ['--disable-eval']` 限制、支持 `workerData` 传递约束
   - 与 PluginContext DI 的集成方案（SandboxContext RPC 代理层）技术上可行，`postMessage` 通信模式是 Worker Threads 的标准模式
   - 局限性：当前设计仅代理了 eventBus/stateStore/logger，未代理 `config` 对象的写操作——但 config 通常为只读，影响不大

2. **Capabilities 声明系统**: 最小权限默认 + 显式声明 + 用户可见 + 拒绝时静默降级的设计原则合理。`plugin.json` 扩展格式向后兼容（capabilities 字段可选）。能力分级（safe/low_risk/medium/high_risk）映射清晰。

3. **v0.2.0 安全最小集**: 30min 方案（用户确认提示 + 来源警告 + capabilities schema 字段）是务实选择。在 700min 总预算内不做完整沙箱实现是正确的资源分配。

4. **权限分级**: core/npm/local 三级信任模型与 `resolve-plugin-path.js` 中已有的 `sourceType` 字段一致，无需额外数据结构。`child_process` 对 npm/local 插件禁止的策略在 v0.2.0 阶段适当。

#### 9.2.3 质量体系完整性

**结论: 通过**

1. **五层质量金字塔**: L1(契约) → L2(单元) → L3(集成) → L4(E2E) → L5(关卡) 的分层逻辑清晰，每层有明确的目标和验收标准。未发现遗漏的关键质量维度。

2. **实施路径**: L2 补全（~90min）→ L1 schema（~30min）→ L4 E2E（~45min）→ L3 集成（~30min）→ L5 关卡（~20min）的顺序合理，优先补全测试盲区再建立上层验证。

3. **覆盖率目标**: 三个零测试模块的目标行覆盖率（validator-pipeline 75%+、hook-dispatcher 70%+、manifest-resolver 75%+）与当前基础（33.83%、38.19%、47.41%）相比是可实现的跳跃。整体 80%+ 目标在 L2 补全后可达成。

### 9.3 完整性审查

#### 9.3.1 验收标准逐项检查

| # | 验收标准 | 状态 | 说明 |
|---|---------|------|------|
| 1 | 两份报告的核心发现均被综合覆盖 | PASS | Ch1 的 C1-C10 共识点、5 项分歧裁决完整覆盖 WP-109 和 WP-110。Ch8 第 8.2 节逐项验证了 WP-109 的 8 维度 + 18 债务 + 8 风险 + 5 阻塞点 + 10 行动项，以及 WP-110 的 10 风险 + 3 架构障碍 + 沙箱方案 + 生态路径 |
| 2 | 架构解耦方案有具体的模块划分和接口定义 | PASS | Ch2 提供了 5 个模块的完整 JSDoc 接口、行数估算、提取来源行号、依赖关系图、向后兼容策略、4 步拆分路径 |
| 3 | 安全模型有具体的技术方案 | PASS | Ch3 包含威胁模型(5 项)、capabilities 枚举定义(含代码)、Worker Threads 架构图、SandboxContext RPC 代理实现、权限分级矩阵、审计日志设计、v0.2.0 最小集 3 个具体实现 |
| 4 | 路线图包含修正后的时间估算和优先级 | PASS | Ch5 的 A1-A13 行动项含优先级、时间估算、来源、阻塞关系。Phase 1/2/3 分组与依赖关系图一致 |
| 5 | 风险矩阵涵盖两报告的所有高风险项 | PASS | Ch6 的 R1-R13 合并了两报告的所有风险项。紧急 1 + 高 3 + 中高 3 = 7 项高风险项均有对应行动项和缓解策略 |
| 6 | 文档内部无矛盾 | PASS | Ch8 交叉验证报告逐章确认一致性。本审查发现并修正了成熟度平均值计算错误（2.125 → 2.1875），修正后无矛盾 |

#### 9.3.2 关键缺失项识别

| # | 缺失项 | 严重程度 | 建议 |
|---|--------|---------|------|
| N1 | `plugin-validator.js` 拆分模块的 `validateCapabilities()` 测试用例未纳入 Ch4 L2 测试计划 | 低 | 在模块化 WP 执行时一并补充。已在 Ch8 记录为 S1 |
| N2 | 拆分新增模块的测试（yaml-parser 等 4 个）在 Ch2 测试策略表和 Ch4 L2 计划中存在归属不清 | 低 | 建议明确归属为 A2 模块化 WP 的产出。已在 Ch8 记录为 S2 |

无高严重程度缺失项。N1、N2 均已在 Ch8 交叉验证中识别，属于执行层面的细化，不影响设计完整性。

### 9.4 可行性审查

#### 9.4.1 路线图可执行性

**结论: 可执行**

- **Phase 结构合理**: Phase 1（无前置，可并行启动 5 项工作）→ Phase 2（依赖 Phase 1）→ Phase 3（收尾）的划分与实际依赖关系一致
- **单步粒度适当**: 最大单步 A2 模块化 110min，在 60-120min 工作会话范围内可完成
- **阻塞关系准确**: A4(E2E) 依赖 A2(模块化)、A10(覆盖率) 依赖 A3(测试补全) 的依赖关系经代码分析确认合理——模块化改变文件结构会影响 E2E 测试的路径引用，测试补全会改变覆盖率基线

#### 9.4.2 v0.2.0 预算评估

**结论: 700min 合理**

- 经验证，行动项汇总 560min + 15% 缓冲 = 644min，最终建议 700min 有 56min 额外缓冲
- 两份源报告独立给出 700-800min 范围，与本设计一致
- 预算风险控制信号（黄色 300min、红色 600min）提供了范围裁剪触发机制

#### 9.4.3 单人维护模式评估

**结论: 资源需求现实**

- v0.2.0 预计 7-9 次工作会话，每次 60-120min，按每周 5-8 次会话计算约需 1-2 周
- 核心不可妥协项（A1 安全、A2 模块化、A3 测试）总计 230min，即使最坏情况也仅需 3-4 次会话
- 可延后项（A11 工程卫生、A12 迁移路径）已明确标记，预算超支时有明确的裁剪策略

### 9.5 文档质量审查

#### 9.5.1 结构清晰度

**结论: 优秀**

- 8 章结构逻辑清晰：综合裁决 → 架构方案 → 安全模型 → 质量体系 → 路线图 → 风险 → 预算 → 交叉验证
- 每章有明确的小节划分和表格辅助
- 章节间引用关系明确（如 "第 2.4 节"、"Ch3 第 3.6 节"）

#### 9.5.2 格式问题

**发现并修正 3 处数据错误**:

| # | 位置 | 问题类型 | 修正内容 |
|---|------|---------|---------|
| E1 | Ch1 第 115 行 | 数学计算错误 | v0.2.0 目标平均值 2.125 → 2.1875（实际 sum=17.5，非 17） |
| E2 | Ch7 第 1440 行 | 四舍五入不一致 | 缓冲总计 ~645min → ~644min（560*1.15=644，非 645） |
| E3 | Ch8 第 8.2 节 | 跟随 E1/E2 的错误声明 | 同步修正 Ch8 中对 E1/E2 的交叉验证描述 |

**无拼写错误、无 broken references、无表格格式问题。**

#### 9.5.3 数据一致性

**修正后一致**。所有数值声明经独立核算确认：
- 行数统计与代码库一致（harness-build.js 1547 行、resolve-plugin-path.js 161 行）
- 测试数量与 CI 实测一致（295 tests）
- 核心插件数量与目录一致（23 个）
- 风险等级分布统计（紧急 1、高 3、中高 3、中 4、低 2）与 R1-R13 表逐一核对一致
- v0.3.0 行动项汇总 885min 与明细一致

### 9.6 修正项清单

#### 已直接修正（本审查执行）

| # | 位置 | 修正内容 |
|---|------|---------|
| E1 | 第 115 行 | v0.2.0 目标平均成熟度: 2.125 → 2.1875 |
| E2 | 第 1440、1447、1449 行 | 缓冲金额: 645 → 644，剩余缓冲: 55 → 56 |
| E3 | 第 1651、1655、1584-1585 行 | Ch8 交叉验证中对 E1/E2 的确认同步修正 |
| E4 | 第 5 行 | 文档状态: 草案 → 审查通过 |
| E5 | 第 1685 行 | 文档结束注释: 8 章 → 9 章 |

#### 记录的低风险观察项

| # | 位置 | 观察 | 建议 |
|---|------|------|------|
| O1 | Ch3 第 3.3.2 节 | SandboxContext 未代理 `config` 对象的写操作 | v0.3.0 实现时确认 config 是否需要代理（当前判断为只读，影响小） |
| O2 | Ch4 第 4.3.2 节 | L2 测试计划未覆盖拆分新增模块（yaml-parser、plugin-validator 等）的测试 | 在 A2 模块化 WP 中明确包含拆分模块测试作为验收标准 |

#### 阻断项

**无阻断项。**
