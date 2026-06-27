# WP-113-1-impl: Extract yaml-parser.js

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-113.md`
> - 设计文档: `docs/design/harness-universal-platform-final-design.md` 第 2.1.1 节（代码结构审计）和第 2.2 节模块 1

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-113 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 30min |

## 职责

从 `harness-build.js` 中提取 YAML 解析相关方法，创建独立的 `plugins/runtime/yaml-parser.js` 模块。这是最独立的模块——仅 `_readHarnessConfig` 调用它，无其他内部依赖。

## 任务清单

### Step 1: 创建 yaml-parser.js 模块

- [ ] 创建 `plugins/runtime/yaml-parser.js`
- [ ] 提取以下方法（harness-build.js:870-1131）:
  - `_readHarnessConfig()` → `parseYamlFile(filePath)`
  - `_parseValue()` → 内部函数 `_parseValue()`
  - `_parseNestedBlock()` → 内部函数 `_parseNestedBlock()`
  - `_parseChildLines()` → 内部函数 `_parseChildLines()`
  - `_parseListItems()` → 内部函数 `_parseListItems()`
  - `_collectChildren()` → 内部函数 `_collectChildren()`
  - `_parseLineAsObject()` → 内部函数 `_parseLineAsObject()`
  - `_parseObjectItems()` → 内部函数 `_parseObjectItems()`
  - `_serializeConfigValue()` → `serializeConfigValue(val)`
- [ ] 新增 `parseYamlString(content)` 函数（对 parseYamlFile 的字符串版本封装）
- [ ] 导出公共接口: `{ parseYamlFile, parseYamlString, serializeConfigValue }`
- [ ] 所有公共函数添加 JSDoc 注释

### Step 2: 修改 harness-build.js

- [ ] 添加 `var yamlParser = require('./yaml-parser');`
- [ ] 将 `_injectContextConfig()` 中的 `this._readHarnessConfig(configPath)` 替换为 `yamlParser.parseYamlFile(configPath)`
- [ ] 将 `_injectContextConfig()` 中的 `this._serializeConfigValue(val)` 替换为 `yamlParser.serializeConfigValue(val)`
- [ ] 删除 harness-build.js 中的原始方法定义（约 280 行）
- [ ] 添加 proxy 方法保持向后兼容:
  ```javascript
  HarnessBuild.prototype._readHarnessConfig = function(configPath) {
    return yamlParser.parseYamlFile(configPath);
  };
  HarnessBuild.prototype._serializeConfigValue = function(val) {
    return yamlParser.serializeConfigValue(val);
  };
  ```

### Step 3: 编写独立测试

- [ ] 创建 `test/runtime/test-yaml-parser.js`
- [ ] 测试用例:
  - flat key-value 解析
  - 单层 list 解析
  - 单层 object 解析
  - 不支持特性静默处理
  - 空文件返回空对象
  - 缺失文件返回空对象
  - serializeConfigValue 对数组/对象/标量的序列化

## 关键文件

### 输入（读取）
- `plugins/runtime/harness-build.js` — 源文件（第 870-1131 行的 YAML 解析方法）
- `docs/design/harness-universal-platform-final-design.md` 第 2.2 节模块 1 — 接口定义

### 输出（新建）
- `plugins/runtime/yaml-parser.js` — YAML 解析模块（~150 行）
- `test/runtime/test-yaml-parser.js` — 独立测试（~120 行）

### 输出（修改）
- `plugins/runtime/harness-build.js` — 删除约 280 行，添加 proxy 方法

## 验收标准

- [ ] `yaml-parser.js` 导出 `{ parseYamlFile, parseYamlString, serializeConfigValue }`
- [ ] 所有公共函数有 JSDoc 注释
- [ ] harness-build.js 的 `_injectContextConfig()` 改为调用 yaml-parser
- [ ] 新增 proxy 方法保持向后兼容
- [ ] 独立测试覆盖所有公共接口
- [ ] 现有 295 测试全部通过
