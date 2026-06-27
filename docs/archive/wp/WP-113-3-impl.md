# WP-113-3-impl: Extract settings-merger.js + claude-md-injector.js

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-113.md`
> - 设计文档: `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 2 和模块 3

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-113 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 20min |

## 职责

从 `harness-build.js` 中提取 Settings 合并和 CLAUDE.md 注入相关方法，创建两个独立模块：

1. **settings-merger.js** — 将 tackle-harness 的 hook 配置合并到目标项目的 `.claude/settings.json`
2. **claude-md-injector.js** — 扫描 skill 插件的 `plan_mode_required` 声明，注入 CLAUDE.md

这两个模块被 `commands/init.js` 通过 HarnessBuild 代理调用，提取后可独立测试。

## 任务清单

### Step 1: 创建 settings-merger.js 模块

- [ ] 创建 `plugins/runtime/settings-merger.js`
- [ ] 提取以下方法（harness-build.js:1302-1388, 1476-1487）:
  - `updateSettings()` → `mergeSettings(options)`
  - `_isLocalInstall()` → `isLocalInstall(packageRoot, targetRoot)`
  - `_upsertHookEntry()` → 内部函数 `_upsertHookEntry()`
- [ ] 导出公共接口: `{ mergeSettings, isLocalInstall }`
- [ ] `mergeSettings` 接受 options 对象: `{ targetRoot, packageRoot, ensureDir }`
- [ ] `ensureDir` 参数注入化（便于测试时 mock）
- [ ] 所有公共函数添加 JSDoc 注释

### Step 2: 创建 claude-md-injector.js 模块

- [ ] 创建 `plugins/runtime/claude-md-injector.js`
- [ ] 提取以下内容（harness-build.js:1398-1535）:
  - `CLAUDE_MD_MARKER` 常量 → 模块级常量
  - `injectClaudeMdRules()` → `injectClaudeMdRules(options)`
  - `_buildClaudeMdRuleBlock()` → `buildRuleBlock(pluginEntries, resolvePluginDir)`
- [ ] 导出公共接口: `{ buildRuleBlock, injectClaudeMdRules }`
- [ ] `injectClaudeMdRules` 接受 options 对象: `{ targetRoot, pluginEntries, resolvePluginDir, log }`
- [ ] `resolvePluginDir` 和 `log` 参数注入化（便于测试时 mock）
- [ ] 所有公共函数添加 JSDoc 注释

### Step 3: 修改 harness-build.js

- [ ] 添加 `var settingsMerger = require('./settings-merger');`
- [ ] 添加 `var claudeMdInjector = require('./claude-md-injector');`
- [ ] 将 `updateSettings()` 改为代理:
  ```javascript
  HarnessBuild.prototype.updateSettings = function(targetRoot, packageRoot) {
    return settingsMerger.mergeSettings({
      targetRoot: targetRoot,
      packageRoot: packageRoot,
      ensureDir: this._ensureDir.bind(this)
    });
  };
  ```
- [ ] 将 `injectClaudeMdRules()` 改为代理:
  ```javascript
  HarnessBuild.prototype.injectClaudeMdRules = function(targetRoot) {
    var registry = this._readRegistry();
    var entries = this._getPluginEntries(registry);
    return claudeMdInjector.injectClaudeMdRules({
      targetRoot: targetRoot,
      pluginEntries: entries,
      resolvePluginDir: this._resolvePluginDir.bind(this),
      log: this._log.bind(this)
    });
  };
  ```
- [ ] 删除 harness-build.js 中的原始方法定义（settings-merger ~90 行 + claude-md-injector ~140 行）

### Step 4: 编写独立测试

- [ ] 创建 `test/runtime/test-settings-merger.js`
- [ ] 测试用例:
  - 幂等合并（重复调用不产生重复 hook）
  - 全局安装路径正确
  - 本地安装路径正确
  - 空 settings.json 创建新文件
- [ ] 创建 `test/runtime/test-claude-md-injector.js`
- [ ] 测试用例:
  - 首次注入（CLAUDE.md 不存在或无 marker）
  - 幂等替换（已有 marker 时替换内容）
  - 无 plan_mode_required 技能时跳过注入
  - buildRuleBlock 返回正确格式

## 关键文件

### 输入（读取）
- `plugins/runtime/harness-build.js` — 源文件（settings-merger: 第 1302-1388, 1476-1487 行；claude-md-injector: 第 1398-1535 行）
- `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 2 和模块 3 — 接口定义

### 输出（新建）
- `plugins/runtime/settings-merger.js` — Settings 合并模块（~100 行）
- `plugins/runtime/claude-md-injector.js` — CLAUDE.md 注入模块（~150 行）
- `test/runtime/test-settings-merger.js` — 独立测试（~80 行）
- `test/runtime/test-claude-md-injector.js` — 独立测试（~80 行）

### 输出（修改）
- `plugins/runtime/harness-build.js` — 删除约 230 行，添加 proxy 方法

## 验收标准

- [ ] `settings-merger.js` 导出 `{ mergeSettings, isLocalInstall }`，有 JSDoc
- [ ] `claude-md-injector.js` 导出 `{ buildRuleBlock, injectClaudeMdRules }`，有 JSDoc
- [ ] harness-build.js 的 `updateSettings()` 和 `injectClaudeMdRules()` 改为 proxy
- [ ] 两个模块的独立测试覆盖核心场景
- [ ] 现有 295 测试全部通过
