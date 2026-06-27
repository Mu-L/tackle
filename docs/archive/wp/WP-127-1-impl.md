# WP-127-1-impl: 代码修复与文档记录

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-127.md`
> - 包含: 用户决策汇总、验收标准、关键文件

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-127 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **预估时间** | 10min |
| **状态** | ✅ 完成 |

## 职责

修复 WP-126 发现的 2 个代码问题，并记录 DECISION-3/4 的用户决策。

## 任务清单

### 1a. 修复 init.js require 路径 (DECISION-2)

- [x] 修改 `commands/init.js:62`
- [x] 将 `require('../../plugins/runtime/manifest-resolver')` 改为 `require('../plugins/runtime/manifest-resolver')`
- [x] 原因：从 `commands/` 出发，`../../` 解析到项目父目录，应为 `../`

### 1b. 修复 plugin_access 键名不一致 (ISSUE-126-3-1)

- [x] 修改 `plugins/runtime/plugin-validator.js:46`
  - KNOWN_CAPABILITIES 添加 `'plugin_access'`
  - `['filesystem', 'network', 'child_process', 'env']` → `['filesystem', 'network', 'child_process', 'env', 'plugin_access']`
- [x] 修改 `plugins/contracts/plugin-schema.json`
  - capabilities.properties 中添加 `plugin_access` 属性定义
  - 参考 `filesystem`/`network`/`child_process`/`env` 的格式
- [x] 背景：`capabilities.js:242` 的 `_capabilityToTopLevelKey` 将 `plugin.access` 映射到 `plugin_access`，但 KNOWN_CAPABILITIES 和 schema 均未包含，导致 validate 阶段产生虚假 warning

### 1c. 文档记录 DECISION-3 和 DECISION-4

- [x] 在 `docs/reports/2026-05-30_WP-126_execution_report.md` 的待决策问题部分补充用户决策
- [x] DECISION-3: 接受 CAPABILITY_RESTRICTIONS @internal 导出为已知文档约定（不修改代码）
- [x] DECISION-4: 维持全局 70% 行覆盖率门槛，不增加单模块门槛

## 验收标准

- [x] init.js require 路径已修正为 `../plugins/runtime/manifest-resolver`
- [x] KNOWN_CAPABILITIES 包含 `'plugin_access'`
- [x] plugin-schema.json 包含 `plugin_access` 属性定义
- [x] 修改后的相关测试全部通过
- [x] DECISION-3/4 已在报告中记录

## 关键文件

- `commands/init.js:62` — require 路径修复
- `plugins/runtime/plugin-validator.js:46` — KNOWN_CAPABILITIES 扩展
- `plugins/contracts/plugin-schema.json` — schema 扩展
- `docs/reports/2026-05-30_WP-126_execution_report.md` — 决策记录
