# WP-055-1-impl: Runtime 层代码分析

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-055.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-055 |
| **依赖** | 无 |
| **执行角色** | 领域专家 |
| **状态** | 📋 待执行 |

## 职责

分析所有 JS 代码中涉及 WP 编号的逻辑，评估 WP-999+ 时的兼容性风险。

## 任务清单

- [ ] 分析 `validator-work-package/index.js` 中的正则匹配和依赖提取
  - `WP_ID_RE = /WP-\d+/gi` 是否匹配 WP-1000
  - `/^(WP-\d+)\.md$/i` 文件名匹配
  - `validate()` 和 `validateAll()` 中的 ID 处理
- [ ] 分析 `validator-doc-sync/index.js` 中的 task.md 解析和文件扫描
  - `WP_TABLE_ROW_RE = /^\|\s*(WP-\d+)\s*\|/` 表格行匹配
  - `scanDocsWp()` 文件扫描和排序行为
  - `parseTaskMd()` 中的 ID 提取
- [ ] 分析 `provider-state-store/index.js` 中的 WP 编号解析
  - `parseTaskMarkdown()` 中的 `wpId.match(/^WP-\d+$/)` 验证
  - tasks 数组的排序和比较逻辑
- [ ] 检查 `bin/tackle.js` 中是否有 WP 编号处理逻辑
- [ ] 检查 `plugins/runtime/` 下的运行时模块
- [ ] 评估字符串排序风险：`'WP-1000' < 'WP-999'`（字典序为 true）
- [ ] 评估文件系统排序：`readdirSync` 返回的文件名顺序
- [ ] 评估数值截断：是否有 `parseInt` 或固定宽度假设

## 验收标准

- [ ] 每个文件的分析结果包含：代码位置、正则/逻辑说明、兼容性风险等级
- [ ] 字符串排序风险已明确量化
- [ ] 文件命名兼容性已验证
- [ ] 数值处理兼容性已验证

## 关键文件

- `plugins/core/validator-work-package/index.js`
- `plugins/core/validator-doc-sync/index.js`
- `plugins/core/provider-state-store/index.js`
- `bin/tackle.js`
- `plugins/runtime/*.js`

---

## 分析结果

### 1. `validator-work-package/index.js` 分析

#### 1.1 正则匹配（兼容性：安全）

| 位置 | 正则 | 用途 | WP-999+ 兼容性 |
|------|------|------|----------------|
| 第 43 行 | `WP_ID_RE = /WP-\d+/gi` | 全局提取 WP ID | **安全** — `\d+` 不限位数 |
| 第 80 行 | `/^(WP-\d+)\.md$/i` | 文件名匹配 | **安全** — `\d+` 不限位数 |
| 第 116 行 | `/WP-\d+/gi` | mermaid 块中提取依赖 | **安全** — `\d+` 不限位数 |
| 第 157 行 | `/^WP-\d+$/i` | WP ID 简写验证 | **安全** — `\d+` 不限位数 |
| 第 234 行 | `/^WP-\d+\.md$/i` | 遍历目录时过滤文件 | **安全** — `\d+` 不限位数 |

**结论**: 所有正则均使用 `\d+`（1位或多位数字），不限制位数。WP-1000 及以上编号均可正确匹配。**无固定宽度假设（如 `\d{3}`），无风险。**

#### 1.2 数值处理（兼容性：安全）

- 未发现 `parseInt`、`Number()` 或任何数值转换操作
- WP ID 始终作为字符串处理（`.toUpperCase()` 转换后存储在 `Set` 中）
- **无截断/溢出风险**

#### 1.3 排序逻辑（兼容性：不适用）

- `_getKnownWpIds()` 返回 `Set<string>`，无排序
- `validateAll()` 遍历 `wpFiles` 数组，无排序操作
- `_readdir()` 返回 `fs.readdirSync()` 的原始顺序（文件系统默认顺序）
- **无显式排序逻辑，但文件系统排序可能导致字典序问题（见下方通用风险分析）**

#### 1.4 风险等级: **低**

---

### 2. `validator-doc-sync/index.js` 分析

#### 2.1 正则匹配（兼容性：安全）

| 位置 | 正则 | 用途 | WP-999+ 兼容性 |
|------|------|------|----------------|
| 第 24 行 | `WP_TABLE_ROW_RE = /^\|\s*(WP-\d+)\s*\|/` | task.md 表格行匹配 | **安全** — `\d+` 不限位数 |
| 第 130 行 | `/^(WP-\d+)\.md$/i` | 文件名匹配 | **安全** — `\d+` 不限位数 |

**结论**: 与 validator-work-package 相同，所有正则均兼容 4+ 位数字。

#### 2.2 `parseTaskMd()` 方法（第 93-119 行）

- 遍历 task.md 每行，使用 `WP_TABLE_ROW_RE` 匹配
- 提取的 ID 直接存入对象数组，保留原始大小写（`match[1]`）
- **无排序、无数值转换，安全**

#### 2.3 `scanDocsWp()` 方法（第 125-137 行）

- 遍历 `docs/wp/` 目录，正则匹配文件名
- 结果数组未排序
- `entries.push(match[1].toUpperCase())` — 转大写后存储
- **无显式排序，但返回顺序依赖文件系统**

#### 2.4 `validate()` 方法（第 144-217 行）

- 使用对象字面量 `{}` 作为索引（`taskMap`、`docSet`）
- 按 ID 查找，无排序或数值比较
- **安全**

#### 2.5 风险等级: **低**

---

### 3. `provider-state-store/index.js` 分析

#### 3.1 正则匹配（兼容性：安全）

| 位置 | 正则 | 用途 | WP-999+ 兼容性 |
|------|------|------|----------------|
| 第 41 行 | `line.indexOf('| WP ') === 0 \|\| line.indexOf('| WP\t') === 0` | 检测表格头 | **安全** — 不涉及编号 |
| 第 71 行 | `wpId.match(/^WP-\d+$/)` | 验证 WP ID 格式 | **安全** — `\d+` 不限位数 |

**注意**: 第 41 行使用 `indexOf('| WP ')` 检测表头，这匹配的是 `| WP ` 字面量（表头行），不涉及具体编号，安全。

#### 3.2 `parseTaskMarkdown()` 函数（第 27-106 行）

- 逐行解析 task.md，提取表格行
- 第 71 行: `wpId.match(/^WP-\d+$/)` — 验证 ID 格式后直接作为字符串使用
- 无排序逻辑（tasks 数组按出现顺序存储）
- 无 `parseInt` 或数值操作
- **安全**

#### 3.3 排序和比较（兼容性：安全）

- `tasks` 数组按 task.md 中的出现顺序存储，无排序
- `dependencies` 字段使用 `deps.split(',').map(...)` 处理，纯字符串操作
- **无排序/比较风险**

#### 3.4 风险等级: **低**

---

### 4. `bin/tackle.js` 分析

- **全文搜索 `WP-\d` 无匹配**
- **全文搜索 `work.?package` 无匹配**
- CLI 入口文件不包含任何 WP 编号处理逻辑
- **不适用（无风险）**

---

### 5. `plugins/runtime/` 分析

#### 5.1 `validator-pipeline.js`（第 314 行附近）

- 仅在注释和参数名中引用 WP ID（如 `wpId - Work package ID (e.g., 'WP-001')`）
- `runWPValidators()` 方法将 `wpId` 作为纯字符串传递，用于构建路径 `path.join(..., wpId + '.md')`
- **无正则匹配、无数值处理、无排序**
- **不适用（无风险）**

#### 5.2 其他 runtime 模块

- `state-store.js` — 无 WP 相关逻辑
- `harness-build.js` — 无 WP 相关逻辑
- `config-manager.js` / `config-validator.js` — 无 WP 相关逻辑
- `event-bus.js` — 无 WP 相关逻辑
- `hook-dispatcher.js` — 排序逻辑（第 105 行）按 hook 优先级排序，不涉及 WP 编号
- `manifest-resolver.js` — 无 WP 相关逻辑
- `plugin-loader.js` — 无 WP 相关逻辑
- **不适用（无风险）**

---

### 6. 通用风险分析

#### 6.1 字符串排序风险

**问题**: `'WP-1000' < 'WP-999'` 在字典序中为 `true`（因为 `'1' < '9'`），导致：
- WP-1000 排在 WP-999 之前
- WP-1001 排在 WP-101 之前

**当前影响**:
- `_readdir()` 返回 `fs.readdirSync()` 的原始结果
- 在大多数文件系统上，`readdirSync` 按文件名字典序返回
- 当存在 WP-1000+ 时，文件列表顺序变为: `WP-001, WP-1000, WP-002, ...`（字典序错乱）

**受影响的代码路径**:
1. `validator-work-package/index.js` 第 231-236 行: `validateAll()` 中遍历 `wpFiles`（字典序文件名数组），但此方法仅做验证不依赖顺序，**实际影响极低**
2. `validator-doc-sync/index.js` 第 127-136 行: `scanDocsWp()` 返回字典序数组，但仅用于集合比较，**无实际影响**
3. `provider-state-store/index.js`: `parseTaskMarkdown()` 按 task.md 行序解析，**不受文件系统排序影响**

**风险等级: 低** — 当前代码中没有依赖 WP 编号顺序的业务逻辑。但若未来需要按编号排序显示或处理，需要使用数值排序。

#### 6.2 数值截断/溢出风险

- **未发现任何 `parseInt`、`Number()` 或固定宽度假设**
- 所有 WP ID 均作为字符串处理
- JavaScript 的安全整数范围为 `2^53 - 1`（约 9 千万亿），即使使用数值操作也不会溢出
- **无风险**

#### 6.3 文件命名兼容性

- WP-1000.md 作为文件名完全合法（无长度限制、无特殊字符）
- 正则 `/^(WP-\d+)\.md$/i` 可正确匹配
- **无风险**

#### 6.4 UI 显示（Markdown 表格）

- task.md 中的表格对齐依赖 Markdown 渲染
- WP-1000 占 7 个字符（vs WP-001 的 6 个字符），可能导致轻微对齐偏移
- 这是 Markdown 渲染的通用问题，不影响功能
- **风险等级: 极低**（美观问题，不影响功能）

---

### 7. 总结

| 文件 | 正则兼容 | 数值处理 | 排序风险 | 总体风险 |
|------|----------|----------|----------|----------|
| `validator-work-package/index.js` | 安全 | 无 | 低（文件系统字典序） | **低** |
| `validator-doc-sync/index.js` | 安全 | 无 | 低（文件系统字典序） | **低** |
| `provider-state-store/index.js` | 安全 | 无 | 无 | **低** |
| `bin/tackle.js` | 不涉及 | 不涉及 | 不涉及 | **无** |
| `plugins/runtime/*` | 不涉及 | 不涉及 | 不涉及 | **无** |

**核心结论**: Runtime 层（JS 代码）对 WP-999+ 的兼容性**整体良好**。所有正则均使用 `\d+`（不限位数），无固定宽度假设，无 `parseInt` 数值截断。唯一潜在风险是文件系统字典序排列（WP-1000 排在 WP-999 之前），但当前代码中没有依赖编号排序的关键业务逻辑。
