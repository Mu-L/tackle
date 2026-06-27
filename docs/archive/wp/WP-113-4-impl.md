# WP-113-4-impl: Create slim build-orchestrator.js

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-113.md`
> - 设计文档: `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 5、第 2.3.2 节向后兼容策略
> - **前置条件**: WP-113-1、WP-113-2、WP-113-3 必须全部完成

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-113 |
| **依赖** | WP-113-1-impl, WP-113-2-impl, WP-113-3-impl |
| **执行角色** | architect |
| **状态** | 📋 待执行 |
| **预估时间** | 20min |

## 职责

基于 WP-113-1~3 完成的四个子模块，创建精简的 `build-orchestrator.js`，并将 `harness-build.js` 转为 proxy pattern，确保向后兼容。

## 任务清单

### Step 1: 创建 build-orchestrator.js

- [ ] 创建 `plugins/runtime/build-orchestrator.js`
- [ ] 引入子模块:
  ```javascript
  var yamlParser = require('./yaml-parser');
  var pluginValidator = require('./plugin-validator');
  ```
- [ ] 保留以下方法（从 harness-build.js 迁移）:
  - 构造器 `HarnessBuild()` + 公共 API (`build()`, `validate()`, `validateConfig()`)
  - Registry 读取 (`_readRegistry()`, `_getPluginEntries()`)
  - 构建分发 (`_buildPlugin()`, `_buildSkillPlugin()`, `_buildHookPlugin()`, `_buildValidatorPlugin()`, `_buildProviderPlugin()`)
  - 路径解析 (`_resolvePluginDir()`)
  - 内容生成 (`_generateSkillFrontMatter()`, `_generateSkillContent()`, `_generateHookStub()`)
  - 工具函数 (`_ensureDir()`, `_mkdirRecursive()`, `_copyDirectory()`, `_log()`)
  - CLI 入口 (`HarnessBuild.run()`)
  - 构建/验证摘要格式化
- [ ] `validate()` 改为调用 `pluginValidator.validatePlugin()` 和 `pluginValidator.formatValidationSummary()`
- [ ] `_injectContextConfig()` 改为调用 `yamlParser.parseYamlFile()` 和 `yamlParser.serializeConfigValue()`
- [ ] `module.exports = HarnessBuild;`（保持导出接口不变）

### Step 2: 转换 harness-build.js 为 proxy pattern

- [ ] 将 `harness-build.js` 内容替换为:
  ```javascript
  'use strict';

  var BuildOrchestrator = require('./build-orchestrator');
  var settingsMerger = require('./settings-merger');
  var claudeMdInjector = require('./claude-md-injector');

  module.exports = BuildOrchestrator;
  ```
- [ ] 确认所有现有调用方的 `require('./harness-build')` 或 `require('../runtime/harness-build')` 路径仍然有效
- [ ] 确认 `bin/tackle.js` 中的引用不受影响
- [ ] 确认测试文件中的 `require` 路径不受影响

### Step 3: 验证向后兼容

- [ ] 确认 `module.exports` 仍然是 `HarnessBuild` 构造函数
- [ ] 确认 `HarnessBuild.run()` 静态方法可用
- [ ] 确认 `new HarnessBuild(options)` 实例化正常
- [ ] 确认 `instance.validate()` 实例方法正常
- [ ] 确认 `instance.build()` 实例方法正常
- [ ] 确认 `instance.updateSettings()` 代理到 settings-merger 正常
- [ ] 确认 `instance.injectClaudeMdRules()` 代理到 claude-md-injector 正常

### Step 4: 模块依赖检查

- [ ] 确认无循环引用:
  - build-orchestrator.js → yaml-parser.js（单向）
  - build-orchestrator.js → plugin-validator.js（单向）
  - settings-merger.js → 无运行时模块依赖
  - claude-md-injector.js → 无运行时模块依赖
- [ ] 确认 `require()` 路径全部正确（相对路径）

## 关键文件

### 输入（读取）
- `plugins/runtime/harness-build.js` — 源文件（需保留的方法和 CLI 入口）
- `plugins/runtime/yaml-parser.js` — WP-113-1 产出
- `plugins/runtime/plugin-validator.js` — WP-113-2 产出
- `plugins/runtime/settings-merger.js` — WP-113-3 产出
- `plugins/runtime/claude-md-injector.js` — WP-113-3 产出
- `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 5、第 2.3.2 节 — 接口定义

### 输出（新建）
- `plugins/runtime/build-orchestrator.js` — 精简主模块（~400 行）

### 输出（修改）
- `plugins/runtime/harness-build.js` — 转为 proxy pattern（~10 行）

## 验收标准

- [ ] `build-orchestrator.js` 以 `HarnessBuild` 类名导出
- [ ] `harness-build.js` 精简为 proxy pattern，仅 require 和 module.exports
- [ ] 所有现有 `require` 路径无需修改
- [ ] `HarnessBuild.run()` 静态方法正常
- [ ] `new HarnessBuild(options)` 实例化正常
- [ ] 公共 API (`build()`, `validate()`, `validateConfig()`) 正常
- [ ] 代理方法 (`updateSettings()`, `injectClaudeMdRules()`) 正常
- [ ] 模块间无循环引用
