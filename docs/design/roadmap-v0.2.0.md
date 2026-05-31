# v0.2.0 路线图 — Tackle Harness 通用化升级

**版本**: v0.2.0 Roadmap
**基准版本**: v0.1.2
**创建日期**: 2026-05-25
**数据来源**:
- [差距分析报告](../reports/2026-05-24_generalization-gap-analysis.md)
- [代码级审查报告](../reports/2026-05-25_gap-analysis-review.md)

---

## 1. 概览

### 1.1 当前状态 (v0.1.2)

| 维度 | 现状 |
|------|------|
| 插件数量 | 23 (15 Skills, 4 Providers, 2 Hooks, 2 Validators) |
| 测试覆盖 | 164 tests, 101 项交付校验全 PASS |
| 安装模式 | Global (`npm install -g`) + Local |
| CLI 命令 | build, validate, init, migrate, interactive, status, config, list, version |
| 发布状态 | npm 已发布，CI 覆盖 Node 18/20 |
| 核心文件 | `bin/tackle.js` (1,623 行单文件), `plugins/runtime/` (10 模块) |

### 1.2 v0.2.0 目标

| 目标域 | 具体目标 | 对应差距 |
|--------|----------|----------|
| **外部插件生态** | 支持从 npm/本地路径加载第三方插件 | 缺乏外部插件机制 |
| **质量保证** | 全插件结构测试 + E2E 工作流测试 | 无插件级测试 |
| **开发者体验** | 诊断命令 + 脚手架模板 + 性能监控 | DX 工具缺失 |
| **文档与类型** | API 文档 + TypeScript 类型 + Changelog 自动化 | 文档/类型缺失 |
| **企业级准备** | 权限模型 + 远程 Agent 设计研究 | 长期规划缺失 |

### 1.3 关键指标对比

| 指标 | v0.1.2 | v0.2.0 目标 |
|------|--------|-------------|
| 可加载插件类型 | 仅 core 内置 | core + npm + 本地路径 |
| CLI 子命令数 | 9 | 12+ (新增 install/uninstall/doctor/generate) |
| 测试文件数 | 164 tests (runtime) | runtime + plugin structural + E2E |
| 类型定义 | 无 | 67 公共 API + JSDoc 辅助推断 |
| API 文档 | 仅 CLAUDE.md | 完整 API 参考 |
| CLI 架构 | 1,623 行单文件 | `commands/*.js` 模块化 |

---

## 2. Phase 0: 前置修复

**目标**: 修复已知问题，为 Phase 1 执行扫清障碍
**预估总时间**: ~5 分钟
**里程碑**: **M0**: package-lock.json 修复完成 → CI 全绿

### WP-082-pre: package-lock.json 版本修复

| 属性 | 值 |
|------|-----|
| 优先级 | P0 (前置) |
| 复杂度 | 3 分 (simple) |
| 预估时间 | 5min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 修复 package-lock.json 版本不一致 (0.0.11 vs 0.1.2)。

**实施要点**:
- 执行 `npm install` 同步版本
- 验证 164 测试全通过
- 提交更新后的 package-lock.json

**验收标准**:
- package-lock.json 版本与 package.json 一致
- `node --test test/**/*.js` 全量通过

---

## 3. Phase 1: 外部插件能力 + 质量基线

**目标**: 让 tackle 支持加载外部插件，建立插件质量基线
**预估总时间**: ~250 分钟
**交付里程碑**: v0.2.0-alpha.1

### WP-085: CLI 模块化重构

| 属性 | 值 |
|------|-----|
| 优先级 | P0 (前置) |
| 复杂度 | 15 分 (standard) |
| 预估时间 | 60min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 将 `bin/tackle.js` (1,623 行) 拆分为 `commands/*.js` 子命令模块结构，主入口仅做路由分发。

**实施要点**:
- 创建 `commands/` 目录，每个子命令独立文件 (build.js, validate.js, init.js, ...)
- 主入口 `tackle.js` 仅保留参数解析 + 命令路由
- 保持所有现有命令行为不变
- 迁移后 CLI 膨胀风险降低，新增命令不再加剧单文件问题

**验收标准**:
- 所有现有命令功能不变
- `node bin/tackle.js build` / `validate` / `init` 等行为一致
- 新命令可通过添加 `commands/xxx.js` 文件接入

---

### WP-086: Plugin Loader 路径解析统一

| 属性 | 值 |
|------|-----|
| 优先级 | P0 (前置) |
| 复杂度 | 9 分 (simple) |
| 预估时间 | 20min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 统一 `harness-build.js._resolvePluginDir()` 和 `plugin-loader.js._loadPlugin()` 的路径解析逻辑，提取为共享 resolver 模块。

**实施要点**:
- `harness-build.js` 已支持绝对路径 (`path.isAbsolute`)
- `plugin-loader.js` 硬编码 `core/` 子目录拼接
- 提取为共享 `resolve-plugin-path.js` 工具函数
- 两个调用方统一使用新 resolver

**验收标准**:
- 路径解析逻辑集中在单一模块
- 现有 core 插件加载不受影响
- 为 WP-082 (外部插件) 的 `sourceType` 扩展预留接口

---

### WP-082: 外部插件加载机制

| 属性 | 值 |
|------|-----|
| 优先级 | P0 |
| 复杂度 | 15 分 (standard) |
| 预估时间 | 55min |
| 依赖 | WP-086 |
| 状态 | 📋 |

**目标**: 支持 tackle 从 npm 包和本地路径加载外部插件，扩展插件注册表格式。

**实施要点**:
- Registry entry 增加 `sourceType` 字段: `core` / `npm` / `local` (不依赖字符串前缀推断)
- npm source 使用 `require.resolve(packageName)` 定位入口
- local source 支持绝对路径和相对路径
- `manifest-resolver.js` 增加外部来源的扫描与合并逻辑
- 构建流程 (`harness-build.js`) 对外部插件执行相同验证
- 路径解析单元测试覆盖

**关键文件**:
- `plugins/runtime/plugin-loader.js` — 核心修改
- `plugins/runtime/manifest-resolver.js` — 扩展扫描
- `plugins/runtime/harness-build.js` — 构建适配
- `plugins/plugin-registry.json` — 格式扩展

**验收标准**:
- core 插件正常加载 (回归无影响)
- 可通过 registry 配置加载 npm 插件
- 可通过 registry 配置加载本地路径插件
- 无效 source 给出明确错误信息
- 路径解析有单元测试覆盖
- 产出 `docs/plugin-package-convention.md`，定义 `tackle-plugin-*` 包的目录结构约定

---

### WP-083: 插件发现与安装

| 属性 | 值 |
|------|-----|
| 优先级 | P0 |
| 复杂度 | 16 分 (standard) |
| 预估时间 | 90min |
| 依赖 | WP-082, WP-085 |
| 状态 | 📋 |

**目标**: 为 CLI 添加 `install` / `uninstall` / `search` 命令，支持从 npm 安装外部插件。

**实施要点**:
- 依赖 WP-085 (CLI 模块化) 完成后才能添加新命令
- `install` 命令: npm install + registry 注册 + manifest 更新
- `uninstall` 命令: 依赖检查 (其他插件是否依赖) + npm uninstall + registry 清理
- `search` 命令: 按 `tackle-plugin-*` 前缀搜索 npm registry
- 网络错误重试、进度输出、dry-run 模式
- registry 源切换支持

**关键文件**:
- `commands/install.js` — 新建
- `commands/uninstall.js` — 新建
- `commands/search.js` — 新建
- `plugins/runtime/plugin-loader.js` — 配合安装流程
- `plugins/plugin-registry.json` — 动态更新

**验收标准**:
- `tackle install tackle-plugin-xxx` 成功安装并注册
- `tackle uninstall tackle-plugin-xxx` 成功卸载并清理
- 依赖检查阻止卸载被依赖的插件
- 网络错误有重试机制
- dry-run 模式正确预览操作

**拆分建议**:

建议 WP-083 拆分为 3 个子 WP:
- WP-083-1: install 命令 (40-45min)
- WP-083-2: uninstall 命令 (25-30min)
- WP-083-3: search 命令 (15-20min)

三者可独立实施，install 优先级最高。

---

### WP-084: Skill 插件结构性测试

| 属性 | 值 |
|------|-----|
| 优先级 | P0 |
| 复杂度 | 10 分 (simple) |
| 预估时间 | 25min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 为全部 15 个 Skill 插件编写结构性验证测试，确保插件格式合规。

**实施要点**:
- 每个 Skill 插件验证: `plugin.json` 必填字段 (name, version, type, description)
- `skill.md` 存在且非空
- `skill.md` 包含关键 Section (When to Use, Flow Diagram, Execution Steps)
- `plugin.json` 的 `type` 字段为 `"skill"`
- 可批量验证，无需逐个独立测试文件

**验收标准**:
- 15 个 Skill 插件全部通过结构验证
- 测试可在 CI 中运行
- 未来新增 Skill 插件自动纳入验证

---

### Phase 1 依赖关系

```
WP-085 (CLI 模块化) ──────────────────┐
                                       ├──► WP-083 (插件安装)
WP-086 (路径统一) ──► WP-082 (外部插件) ┘
WP-084 (Skill 测试) [独立]
```

### Phase 1 里程碑

- **M1**: WP-085 + WP-086 完成 → CLI 架构就绪
- **M2**: WP-082 完成 → 外部插件可加载
- **M3**: WP-083 完成 → 外部插件可安装
- **M4**: WP-084 完成 → 全插件质量基线
- **交付**: v0.2.0-alpha.1 发布，收集用户反馈

---

## 4. Phase 2: 开发体验提升

**目标**: 提供诊断、模板等开发者工具
**预估总时间**: ~90 分钟
**前置条件**: Phase 1 完成

### WP-088: 诊断命令

| 属性 | 值 |
|------|-----|
| 优先级 | P1 |
| 复杂度 | 9 分 (simple) |
| 预估时间 | 20min |
| 依赖 | WP-085 |
| 状态 | 📋 |

**目标**: 添加 `tackle doctor` 命令，自动诊断环境配置问题。

**实施要点**:
- 检查: 安装模式 (全局 vs 本地)、Node.js 版本、插件完整性、配置文件有效性
- 独立性能检查项（直接采集插件加载时间，不依赖 WP-087 模块）
- 输出结构化诊断报告
- 支持 JSON 输出 (`--json`) 供外部工具消费

**验收标准**:
- `tackle doctor` 输出完整诊断信息
- 异常配置给出修复建议
- 性能数据通过独立方式获取

---

### WP-089: 插件模板/脚手架

| 属性 | 值 |
|------|-----|
| 优先级 | P1 |
| 复杂度 | 10 分 (simple) |
| 预估时间 | 25min |
| 依赖 | WP-085 |
| 状态 | 📋 |

**目标**: 添加 `tackle generate` 命令，从模板创建新插件项目。

**实施要点**:
- 4 套模板: skill / hook / validator / provider
- 模板文件放入 `templates/` 目录，CLI 仅做交互引导 + 文件复制
- 交互式引导: 插件名、类型、描述
- 生成的插件可通过 `tackle validate` 验证

**验收标准**:
- 可生成 4 种类型的插件骨架
- 生成的插件通过 `tackle validate`
- 交互流程清晰

---

### WP-090: E2E 工作流测试

| 属性 | 值 |
|------|-----|
| 优先级 | P1 |
| 复杂度 | 12 分 (standard) |
| 预估时间 | 45min |
| 依赖 | WP-082 |
| 状态 | 📋 |

**目标**: 编写端到端工作流测试，覆盖完整的插件生命周期。

**实施要点**:
- 使用 `node:test` 的 `test()` + `before()`/`after()` 管理临时目录
- 测试流程: init → add plugin → build → validate → verify output
- 覆盖全局安装模式和本地安装模式
- 环境隔离: 临时目录 + 环境变量清理
- 依赖 WP-082 (外部插件加载) 以测试外部插件工作流

**验收标准**:
- 完整的 init→build→validate 工作流测试通过
- 全局和本地模式均覆盖
- 测试可重复运行 (无状态泄漏)

---

### WP-100: 插件权限与安全模型 (设计研究)

| 属性 | 值 |
|------|-----|
| 优先级 | P2+ |
| 复杂度 | 20 分 (fine-grained, 仅设计) |
| 预估时间 | 30min (设计文档) |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 产出插件权限与安全模型的设计文档。

**研究要点**:
- 插件运行在 Claude Code 进程中，需研究如何与 Claude Code 自身的工具权限控制交互
- 设计: 插件能力声明 (capabilities)、权限沙箱、审计日志
- 评估: 实际实现需 90-120 分钟，当前过早
- 输出: 设计文档 (含用例、方案对比、推荐方案)

**说明**: 从 Phase 4 提前至 Phase 2 并行执行，无需等待 Phase 3。

---

### WP-101: EventBus 远程化可行性评估

| 属性 | 值 |
|------|-----|
| 优先级 | P2+ |
| 复杂度 | 5 分 (simple) |
| 预估时间 | 15min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 评估 EventBus pub/sub 模式远程化可行性。

**研究要点**:
- EventBus pub/sub → WebSocket/IPC 传输可行性
- Agent 注册、发现、通信协议方向性评估
- 输出: 1 页方向性文档（如不可行记录否定结论）

**说明**: 从 Phase 4 提前至 Phase 2 并行执行。

---

### Phase 2 依赖关系

```
WP-088 (诊断命令) [独立, 移除对 WP-087 依赖]
WP-089 (模板) ◄── WP-085
WP-090 (E2E 测试) ◄── WP-082
WP-100 (权限设计研究) [独立, 从 Phase 4 提前]
WP-101 (EventBus 远程化评估) [独立, 从 Phase 4 提前]
```

### Phase 2 里程碑

- **M5**: WP-088 完成 → `tackle doctor` 可用
- **M6**: WP-089 完成 → `tackle generate` 可用
- **M7**: WP-090 完成 → E2E 工作流有保障
- **M8**: WP-100/101 完成 → 企业级设计文档

---

## 5. Phase 3: 工具链完善

**目标**: 完善文档、类型、发布工具链
**预估总时间**: ~180-200 分钟 (含可选 WP)
**前置条件**: Phase 2 完成 (部分 WP 可提前)

### WP-091: API 参考文档

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 10 分 (simple) |
| 预估时间 | 25-35min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 为 10 个 runtime 模块编写 API 参考文档。

**实施要点**:
- 先评估现有 JSDoc 覆盖率，确定需补全的部分
- 可选手动编写 (确保准确性) 或从 JSDoc 生成
- 覆盖: Plugin Interface, EventBus, StateStore, ConfigManager, PluginLoader, Logger 等

---

### WP-092: 插件版本兼容性检查

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 10 分 (simple) |
| 预估时间 | 25-30min |
| 依赖 | WP-082 |
| 状态 | 📋 |

**目标**: 在加载插件时检查版本兼容性。

**实施要点**:
- plugin.json 增加 `minHarnessVersion` 字段
- 版本比较支持 semver range (如 `>=0.2.0`)
- 不兼容时输出 warning (插件名 + 原因)
- 集成到 `tackle validate` 和 `tackle doctor`

---

### WP-093: TypeScript 类型定义

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 11 分 (standard) |
| 预估时间 | 40-50min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 创建 `types/` 目录，为核心模块提供 TypeScript 类型声明。

**实施要点**:
- 优先: Plugin Interface, EventBus, StateStore, ConfigManager
- 运行时 API 约 67 公共 API 需声明 (JSDoc 94.6% 覆盖率辅助推断)
- 类型文件与 JSDoc 同步
- `package.json` 增加 `types` 字段

---

### WP-094: Changelog 自动生成

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 7 分 (simple) |
| 预估时间 | 15-20min |
| 依赖 | 无 |
| 状态 | 📋 |

**目标**: 基于 conventional commits 自动生成 Changelog。

**实施要点**:
- 项目已采用 conventional commits 格式
- 集成到 `publish.yml` 的 tag push 触发器
- 可用工具: conventional-changelog-cli 或 git-cliff
- 保持现有 CHANGELOG.md 格式一致

---

### WP-095: 发布检查清单

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 7 分 (simple) |
| 预估时间 | 15-20min |
| 依赖 | WP-083 |
| 状态 | 📋 |

**目标**: 提供插件发布前的检查清单。

**实施要点**:
- 发布检查清单: plugin.json 格式、npm 发布配置、README 存在
- 可选: GitHub Actions 模板

---

### WP-096: 性能基准测试

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 8 分 (simple) |
| 预估时间 | 20-25min |
| 依赖 | WP-087 |
| 状态 | 📋 |

**目标**: 建立性能基准测试，跟踪版本间性能变化。

**实施要点**:
- 依赖 WP-087 的性能度量基础设施
- 基准: 插件加载时间、构建时间、验证时间
- 输出基准报告 (JSON 格式)
- 可在 CI 中运行，跟踪性能回归

---

### WP-097: 完整示例项目

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 7 分 (simple) |
| 预估时间 | 15-20min |
| 依赖 | WP-082, WP-089 |
| 状态 | 📋 |

**目标**: 创建完整的示例插件项目，演示从创建到发布的全流程。

**实施要点**:
- `examples/minimal/` 已存在，需扩展
- 与 WP-089 (模板生成) 协同，示例可用 `generate` 命令生成
- 包含完整的 `tackle build` + `tackle validate` 验证流程
- README 包含分步教程

---

### WP-098: 贡献指南更新

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 5 分 (simple) |
| 预估时间 | 15min |
| 依赖 | WP-095 |
| 状态 | 📋 |

**目标**: 更新 CONTRIBUTING.md，反映当前项目状态和外部插件贡献流程。

**实施要点**:
- 修正过时内容 (L89: "暂未配置自动化测试框架")
- 补充: 164 个测试使用 `node:test`、外部插件贡献流程
- 在外部插件 API 稳定后更新 (依赖 WP-095)

---

### WP-087: 性能监控与诊断模块 (可选)

| 属性 | 值 |
|------|-----|
| 优先级 | P3 (可选) |
| 复杂度 | 13 分 (standard) |
| 预估时间 | 25min |
| 依赖 | 无 |
| 状态 | 📋 可选 |

**目标**: 新建 `performance-monitor.js`，非侵入式监控插件加载/激活耗时。

**说明**: CLI 非常驻进程，性能数据 ROI 极低。仅在多个用户明确有需求时实施。

**实施要点** (如实施):
- 事件驱动: 监听 EventBus `plugin.activated` / `plugin.deactivated` 事件
- 记录每次插件操作的 duration (当前 logger.js 仅记录 timestamp)
- 提供 API 查询性能数据 (平均耗时、最慢插件、历史趋势)
- 不侵入 PluginLoader 代码，通过中间件/事件模式集成
- 性能数据可序列化导出 (JSON)

**关键文件**:
- `plugins/runtime/performance-monitor.js` — 新建
- `plugins/runtime/event-bus.js` — 事件消费
- `plugins/runtime/logger.js` — 集成日志

**验收标准**:
- 插件激活/停用自动记录耗时
- 可查询各插件性能数据
- 不影响现有插件加载流程

---

### WP-XXX: harness-build.js 模块化评估

| 属性 | 值 |
|------|-----|
| 优先级 | P2 |
| 复杂度 | 3 分 (simple) |
| 预估时间 | 15min |
| 依赖 | WP-085 |
| 状态 | 📋 |

**目标**: 评估 `harness-build.js` (1,548 行单文件) 的拆分可行性。

**实施要点**:
- 评估文件内部模块边界
- 参考 WP-085 (CLI 模块化) 的拆分经验
- 产出评估报告（含拆分建议或否定结论）

---

### Phase 3 依赖关系

```
WP-082 ──► WP-092 (版本检查)
WP-083 ──► WP-095 (发布清单) ──► WP-098 (贡献指南)
WP-087 (性能监控) ──► WP-096 (性能基准) [可选]
WP-082 + WP-089 ──► WP-097 (示例项目)
WP-091, WP-093, WP-094 [独立]
WP-XXX (harness-build.js 评估) ◄── WP-085
```

---

## 6. 全局依赖关系图

```
Phase 0 (前置):
  WP-082-pre (package-lock 修复) [独立]

Phase 1 (前置 + 核心):
  WP-085 (CLI 模块化) ─────────────────────────────┐
  WP-086 (路径统一) ──► WP-082 (外部插件) ──────────┤
                                  ├──► WP-083 (插件安装) ┘
  WP-084 (Skill 测试) [独立]

Phase 2 (开发体验):
  WP-088 (诊断命令) [独立, 移除对 WP-087 依赖]
  WP-089 (模板) ◄── WP-085
  WP-090 (E2E 测试) ◄── WP-082
  WP-100 (权限设计研究) [独立, 从 Phase 4 提前]
  WP-101 (EventBus 远程化评估) [独立, 从 Phase 4 提前]

Phase 3 (工具链):
  WP-082 ──► WP-092 (版本检查)
  WP-083 ──► WP-095 (发布清单) ──► WP-098 (贡献指南)
  WP-087 (性能监控) ──► WP-096 (性能基准) [可选]
  WP-082 + WP-089 ──► WP-097 (示例项目)
  WP-091, WP-093, WP-094 [独立]
  WP-XXX (harness-build.js 评估) ◄── WP-085
```

---

## 8. 风险与缓解策略

| # | 风险 | 影响 | 概率 | 缓解策略 |
|---|------|------|------|----------|
| R1 | 外部插件加载破坏现有 core 插件 | 高 | 中 | WP-082 严格回归测试，WP-084 建立质量基线 |
| R2 | CLI 模块化重构引入回归 | 高 | 中 | WP-085 保持所有命令行为不变，增量拆分 |
| R3 | npm 操作网络不稳定 | 中 | 中 | WP-083 install 命令增加重试机制 |
| R4 | 外部插件 API 不稳定导致返工 | 中 | 高 | Phase 1 后发 alpha 版收集反馈 |
| R5 | 1,623 行单文件重构遗漏 | 中 | 中 | WP-085 后补充 CLI 集成测试 |
| R6 | Phase 3 文档与实际代码不同步 | 低 | 中 | WP-091/087 在功能冻结后编写 |
| R7 | TypeScript 工作量低估 | 中 | 确定 | 67 公共 API 可一次完成，40-50min |
| R8 | API 文档工作量低估 | 低 | 确定 | JSDoc 94.6%，仅需补充 8 个方法注释 |
| R9 | 外部插件安全风险 | 高 | 低 | WP-100 权限模型设计研究 |
| R10 | CLI 单文件膨胀 | 高 | 确定 | WP-085 模块化重构 |
| R11 | 外部插件质量不可控 | 中 | 高 | WP-084 结构性测试 + alpha 反馈 |
| R12 | EventBus 扩展性不足 | 中 | 低 | WP-101 可行性评估 |
| R13 | 并发写入无锁 | 低 | 极低 | CLI 单进程 |
| R14 | 外部插件格式不一致 | 中 | 中 | 生态未建立，初期概率低 |
| R15 | 测试数量错误 | 低 | 确定 | 164 正确，属数据时效性 |
| R16 | harness-build.js 未模块化 | 中 | 低 | 39 函数远好于声称的 148 |
| R17 | 评估报告数据准确性 | 高 | 确定 | 已修正：463 方法基于宽泛正则 |
| R18 | CI 平台差异 | 中 | 高 | Windows 开发 + Linux CI，增加测试矩阵 |
| R19 | CLI context 接口稳定性 | 中 | 中 | WP-085 拆分后命令接口设计需稳定 |

---

## 9. 决策点清单

以下决策已在 WP-102 独立审查中全部确认：

| # | 决策点 | 影响 WP | 建议 | 状态 |
|---|--------|---------|------|------|
| D1 | Registry `sourceType` 字段命名和枚举值 | WP-082 | `core` / `npm` / `local` | ✅ 已确认 |
| D2 | CLI 子命令模块的 API 设计 (入参/出参格式) | WP-085 | 轻量对象映射+文件约定。补充: `context.exit()` 替代 `process.exit()` | ✅ 已确认 |
| D3 | `tackle generate` 的交互方式 (inquirer vs 纯参数) | WP-089 | 纯参数 + 交互式 fallback | ✅ 已确认 |
| D4 | API 文档生成方式 (JSDoc 提取 vs 手动编写) | WP-091 | 手动补充 JSDoc + 自动提取混合。JSDoc 94.6%，不需大规模补充 | ✅ 已确认 |
| D5 | Changelog 工具选型 | WP-094 | 手写简易版 (约 80 行 Node.js)。项目零外部依赖是重要设计约束 | ✅ 已确认 |
| D6 | Phase 1 后是否发布 v0.2.0-alpha.1 | 全局 | 确认发布 v0.2.0-alpha.1 | ✅ 已确认 |
| D7 | WP-099 多环境配置是否纳入 Phase 3 | WP-099 | 已移除 | ✅ 已确认 |
| D8 | WP-100 权限模型范围 (设计研究 vs 完整实现) | WP-100 | 仅设计研究。提前到 Phase 2 | ✅ 已确认 |
| D9 | WP-077 配置热重载是否保留 | WP-077 | 移除 | ✅ 已确认 |
| D10 | WP-087 性能监控优先级 | WP-087 | 降级为 P3 可选 | ✅ 已确认 |
| D11 | WP-095 发布工具范围 | WP-095 | 缩减为发布检查清单 | ✅ 已确认 |
| D12 | WP-101 范围 | WP-101 | 缩减为 EventBus 远程化评估 | ✅ 已确认 |

---

## 10. 时间估算汇总

### 按 Phase 汇总

| Phase | WP 数 | 预估时间 | 交付物 |
|-------|-------|----------|--------|
| Phase 0 | 1 | ~5min | 版本一致性 |
| Phase 1 | 5 | ~250min | v0.2.0-alpha.1 |
| Phase 2 | 5 | ~135min | DX 工具集 + 设计研究 |
| Phase 3 | 9+1opt | ~185-205min | 完整工具链 |
| **总计** | **20+1opt** | **~575-600min** | **v0.2.0** |

### 按优先级汇总

| 优先级 | WP 数 | 预估时间 |
|--------|-------|----------|
| P0 (前置+核心) | 5 | ~250min |
| P1 (DX) | 3 | ~90min |
| P2 (工具链) | 9 | ~185-205min |
| P2+ (设计研究) | 2 | ~45min |
| P3 (可选) | 1 | ~25min |

### 关键路径

```
WP-086 → WP-082 → WP-083 → WP-095 → WP-098
                    ↘ WP-090
                    ↘ WP-092
                    ↘ WP-097 (with WP-089)

关键路径总时长: 20 + 55 + 90 + 20 + 15 = 200min
```

---

## 11. 执行建议

1. **Phase 0 前置修复** — `npm install` 同步 package-lock.json，验证 164 测试
2. **WP-084/094/100/101 可与 Phase 1 并行** — Skill 测试、Changelog、权限设计、EventBus 评估均无依赖
3. **WP-083 拆分为 3 子 WP** — install/uninstall/search 独立执行，降低风险
4. **WP-088 不依赖 WP-087** — 诊断命令独立实现性能检查
5. **WP-093/091 不分批** — 67 公共 API + JSDoc 94.6%，可一次完成
6. **WP-099 已移除** — 无实际场景
7. **WP-087 降级为 P3 可选** — 仅在有明确用户需求时实施
8. **WP-100/101 提前至 Phase 2** — 设计研究无依赖，可并行执行
9. **每个 Phase 完成后回归测试** — 164 测试全通过为验收标准

---

*本路线图基于 WP-077 差距分析审查报告生成，经 WP-103/104/105/106 审查修订后更新。*
