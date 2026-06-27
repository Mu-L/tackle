# WP-113-2-impl: Extract plugin-validator.js

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-113.md`
> - 设计文档: `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 4

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-113 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 25min |

## 职责

从 `harness-build.js` 中提取插件验证相关方法和常量，创建独立的 `plugins/runtime/plugin-validator.js` 模块。仅 `validate()` 调用它，接口清晰（输入 entry+dir，输出 errors+warnings）。

## 任务清单

### Step 1: 创建 plugin-validator.js 模块

- [ ] 创建 `plugins/runtime/plugin-validator.js`
- [ ] 提取以下内容（harness-build.js:28-30, 258-386）:
  - 常量 `PLUGIN_REQUIRED_FIELDS` → 模块级常量
  - 常量 `VALID_PLUGIN_TYPES` → 模块级常量
  - `_validatePlugin(entry, pluginDir)` → `validatePlugin(entry, pluginDir)`
  - `_formatValidationSummary(options)` → `formatValidationSummary(options)`
- [ ] 导出公共接口: `{ validatePlugin, formatValidationSummary, PLUGIN_REQUIRED_FIELDS, VALID_PLUGIN_TYPES }`
- [ ] 所有公共函数添加 JSDoc 注释
- [ ] `validatePlugin()` 返回 `{ errors: [], warnings: [] }` 结构

### Step 2: 修改 harness-build.js

- [ ] 添加 `var pluginValidator = require('./plugin-validator');`
- [ ] 将 `validate()` 中的 `this._validatePlugin(entry)` 替换为 `pluginValidator.validatePlugin(entry, pluginDir)`
- [ ] 将 `this._formatValidationSummary()` 替换为 `pluginValidator.formatValidationSummary()`
- [ ] 删除 harness-build.js 中的原始方法定义和常量（约 135 行）
- [ ] 添加 proxy 属性/方法保持向后兼容:
  ```javascript
  // 常量代理
  Object.defineProperty(HarnessBuild, 'PLUGIN_REQUIRED_FIELDS', {
    get: function() { return pluginValidator.PLUGIN_REQUIRED_FIELDS; }
  });
  Object.defineProperty(HarnessBuild, 'VALID_PLUGIN_TYPES', {
    get: function() { return pluginValidator.VALID_PLUGIN_TYPES; }
  });
  ```

### Step 3: 编写独立测试

- [ ] 创建 `test/runtime/test-plugin-validator.js`
- [ ] 测试用例:
  - 必填字段缺失时生成 error
  - type 值不在 VALID_PLUGIN_TYPES 时生成 error
  - skill 类型缺少 skill.md 时生成 error
  - hook/validator/provider 类型缺少 index.js 时生成 error
  - 版本格式校验
  - formatValidationSummary 输出格式
  - 正常插件验证通过（无 error）

## 关键文件

### 输入（读取）
- `plugins/runtime/harness-build.js` — 源文件（第 28-30 行常量，第 258-386 行验证方法）
- `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 4 — 接口定义

### 输出（新建）
- `plugins/runtime/plugin-validator.js` — 插件验证模块（~180 行）
- `test/runtime/test-plugin-validator.js` — 独立测试（~60 行）

### 输出（修改）
- `plugins/runtime/harness-build.js` — 删除约 135 行，添加 proxy 方法

## 验收标准

- [ ] `plugin-validator.js` 导出 `{ validatePlugin, formatValidationSummary, PLUGIN_REQUIRED_FIELDS, VALID_PLUGIN_TYPES }`
- [ ] 所有公共函数有 JSDoc 注释
- [ ] harness-build.js 的 `validate()` 改为调用 plugin-validator
- [ ] 常量通过 Object.defineProperty 代理保持向后兼容
- [ ] 独立测试覆盖所有公共接口
- [ ] 现有 295 测试全部通过
