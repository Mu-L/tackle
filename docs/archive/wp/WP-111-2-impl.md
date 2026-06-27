# WP-111-2-impl: 实施路线图与风险治理设计

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-111.md`
> - 前置工作包: `docs/wp/WP-111-1-impl.md`（可行性综合分析与架构设计）
> - 本工作包在 WP-111-1-impl 完成后执行，需读取其产出的设计文档

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（设计文档） |
| **父工作包** | WP-111 |
| **依赖** | WP-111-1-impl |
| **执行角色** | architect |
| **状态** | 📋 待执行 |
| **预估时间** | 25min |

## 职责

基于 WP-111-1-impl 的综合分析结果，设计修正后的分阶段实施路线图和风险治理方案，补充到最终设计文档中。

## 任务清单

### Step 1: v0.2.0 修正行动项设计

基于两报告建议，设计 v0.2.0 修正后的行动项清单：

- [ ] 合并 WP-109 的 10 项行动建议和 WP-110 的 6 项建议
- [ ] 去重并按优先级排序
- [ ] 修正时间估算（WP-109 建议 700min，WP-110 未给总量）
- [ ] 明确阻塞项和高风险项的具体交付物

**必须覆盖的行动项**（两报告共识）：
1. 安全最小集（用户确认提示 + 来源警告）~30min
2. harness-build.js 模块化 ~105min
3. E2E 测试套件 ~45min
4. API 稳定性分类 ~60min
5. plugin.json schema 形式化 ~30min
6. 3 模块测试补充（validator-pipeline, hook-dispatcher, manifest-resolver）~90min
7. 跨平台 CI 矩阵 ~15min
8. 覆盖率基线 ~15min

### Step 2: v0.3.0 生态使能路线设计

- [ ] 安全模型完整实现路线（基于 WP-111-1-impl 的安全设计）
- [ ] Provider 依赖链补全方案
- [ ] Manifest 外部注册扩展
- [ ] tackle install/uninstall/search 命令
- [ ] npm registry 集成
- [ ] 插件质量标准执行器
- [ ] 时间估算

### Step 3: v0.4.0-v1.0.0 规划

- [ ] v0.4.0 平台治理路线（轻量 RFC + 弃用策略 + 结构化日志）
- [ ] v1.0.0 目标修正（"工程能力就绪"而非"生态数量达标"）
- [ ] 各阶段成熟度演进目标

### Step 4: 综合风险矩阵

合并两报告的风险发现：

- [ ] WP-109 的 8 项风险（R1-R8）
- [ ] WP-110 的 10 项风险（1-10）
- [ ] 去重合并，按 概率×影响 重新分级
- [ ] 为每项风险设计具体缓解措施
- [ ] 标注风险所属阶段

**两报告共有的高风险项**（必须覆盖）：
- 外部插件任意代码执行 → 安全模型
- harness-build.js 模块化复杂度 → 渐进式拆分
- Provider 依赖链断裂 → 拓扑排序扩展
- 时间估算低估 → 缓冲机制
- API 破坏性变更 → API 变更记录

### Step 5: 治理机制设计

- [ ] 轻量 RFC 流程（限定适用场景）
- [ ] API 变更记录习惯
- [ ] 弃用策略（2 版本弃期）
- [ ] 成熟度评分卡机制

### Step 6: 写入设计文档

- [ ] 将 Step 1-5 成果追加到 `docs/design/harness-universal-platform-final-design.md`
- [ ] 确保与前半部分（WP-111-1-impl 产出）连贯一致

## 关键文件

### 输入（读取）
- `docs/design/harness-universal-platform-final-design.md` — WP-111-1-impl 产出的前半部分
- `docs/reports/report-2026-05-29-harness-roadmap-feasibility.md` — WP-109 风险矩阵和行动项
- `docs/reports/report-2026-05-29-roadmap-feasibility-analysis.md` — WP-110 风险和建议
- `docs/design/roadmap-v0.2.0.md` — 现有战术路线图

### 输出（追加写入）
- `docs/design/harness-universal-platform-final-design.md` — 综合最终方案（后半部分）

## 验收标准

- [ ] v0.2.0 修正行动项涵盖两报告的所有阻塞/高风险项
- [ ] v0.3.0-v1.0.0 路线图有合理的时间估算
- [ ] 风险矩阵合并去重，无遗漏
- [ ] 治理机制设计适合当前团队规模（不过度）
- [ ] 整体文档连贯一致，可独立阅读
