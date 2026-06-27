# WP-111-1-impl: 可行性综合分析与架构设计

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-111.md`
> - 包含: 背景分析、两报告结论对比、目标说明

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（分析+设计） |
| **父工作包** | WP-111 |
| **依赖** | 无 |
| **执行角色** | architect |
| **状态** | 📋 待执行 |
| **预估时间** | 25min |

## 职责

综合两份可行性报告（WP-109、WP-110）的发现，交叉验证结论，设计通用化架构方案。

## 任务清单

### Step 1: 读取并综合两份报告

- [ ] 读取 `docs/reports/report-2026-05-29-harness-roadmap-feasibility.md`（WP-109）
- [ ] 读取 `docs/reports/report-2026-05-29-roadmap-feasibility-analysis.md`（WP-110）
- [ ] 读取原始 roadmap `docs/reports/report-2026-05-29-harness-roadmap.md`
- [ ] 识别共识点（两报告结论一致的发现）
- [ ] 识别分歧点（两报告结论不同的发现）
- [ ] 对分歧点给出裁决理由

### Step 2: 架构解耦方案设计

基于两报告的架构障碍发现（harness-build.js 单体、Provider 依赖链断裂、Manifest 注册缺失），设计通用化架构：

- [ ] **harness-build.js 模块化方案** — 拆分为 5 个内聚模块的具体方案
  - `yaml-parser.js` — 无状态 YAML 解析工具
  - `settings-merger.js` — Settings 合并逻辑
  - `claude-md-injector.js` — Claude Code 特有的 CLAUDE.md 注入
  - `build-orchestrator.js` — 构建编排（host-agnostic）
  - `plugin-validator.js` — 插件格式验证
- [ ] **Host 适配层设计** — 抽象 `.claude/` 相关输出为可替换适配器
- [ ] **Provider 依赖链修复** — `_buildDependencyGraph` 扩展方案
- [ ] **Manifest 外部注册扩展** — 合并逻辑扩展方案

### Step 3: 安全模型设计

基于 WP-110 的 Worker Threads 推荐，设计安全模型：

- [ ] **Capabilities 声明系统** — `plugin.json` 新增 capabilities 字段设计
- [ ] **Worker Threads 沙箱** — 插件运行隔离方案
- [ ] **权限分级** — 最小权限默认策略
- [ ] **审计日志** — 插件行为记录机制

### Step 4: 质量体系建设

- [ ] **五层质量金字塔** — L1-L5 各层的具体实施内容
- [ ] **覆盖率目标** — 各模块的覆盖率基线和提升路径
- [ ] **CI 关卡设计** — PR 关卡和发布关卡的具体规则

### Step 5: 生态演进路径修正

- [ ] 综合两报告的生态建议
- [ ] L0→L4 路径修正（含 L2a/L2b 拆分）
- [ ] 退出标准修正（"工程能力就绪" vs "生态数量达标"）

### Step 6: 写入设计文档

- [ ] 将 Step 1-5 的成果写入 `docs/design/harness-universal-platform-final-design.md` 的对应章节
- [ ] 确保内容完整、结构清晰

## 关键文件

### 输入（读取）
- `docs/reports/report-2026-05-29-harness-roadmap-feasibility.md` — WP-109 可行性报告
- `docs/reports/report-2026-05-29-roadmap-feasibility-analysis.md` — WP-110 可行性报告
- `docs/reports/report-2026-05-29-harness-roadmap.md` — 原始 roadmap
- `plugins/runtime/harness-build.js` — 架构解耦参考
- `plugins/runtime/plugin-loader.js` — Provider 依赖链参考
- `plugins/runtime/manifest-resolver.js` — Manifest 注册参考
- `plugins/contracts/plugin-interface.js` — 插件契约参考

### 输出（写入）
- `docs/design/harness-universal-platform-final-design.md` — 综合最终方案（前半部分）

## 验收标准

- [ ] 两份报告的所有核心发现被覆盖（无遗漏）
- [ ] 分歧点有明确的裁决和理由
- [ ] 架构解耦方案有具体的模块划分和接口定义
- [ ] 安全模型包含 capabilities 声明 + 沙箱 + 审计三层设计
- [ ] 质量体系有可执行的分层方案
