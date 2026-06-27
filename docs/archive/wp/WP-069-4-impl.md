# WP-069-4-impl: Watchdog 超时配置校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-069.md`
> - 包含: 背景、依赖关系、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | 校验 (impl) |
| **父工作包** | WP-069 |
| **依赖** | 无 |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

校验 `plugins/core/provider-watchdog/assets/daemon-config.template.json` 中超时配置的变更正确性。

## 校验要点

### 1. 超时值变更验证
- [ ] `session_stalled_min`: 从 10 变更为 30（分钟）
- [ ] `task_stalled_min`: 从 15 变更为 20（分钟）
- [ ] 变更值与 WP-068 文档描述一致

### 2. 其他配置项不变性
- [ ] 除超时值外，其他配置项未被修改
- [ ] JSON 格式完整，无语法错误
- [ ] 配置层级结构保持正确

### 3. 与诊断报告的一致性
- [ ] 超时调整符合诊断报告 `docs/reports/2026-05-25_batch-execution-stall-diagnosis.md` 的建议
- [ ] 新阈值足以覆盖正常批量执行的运行时间
- [ ] 不会导致误判（正常长时间运行被误判为停滞）

### 4. 构建输出传播
- [ ] 构建后 `.claude/` 目录下的配置文件已更新
- [ ] 模板文件与实际使用配置的一致性

## 任务清单

- [ ] 读取 daemon-config.template.json 当前内容
- [ ] 对比 git diff 确认变更范围
- [ ] 验证超时值变更符合预期
- [ ] 确认其他配置项未被意外修改
- [ ] 对照诊断报告验证变更合理性
- [ ] 生成校验报告

## 验收标准

- [ ] 所有校验要点已检查并标注 PASS/FAIL
- [ ] 校验报告已写入 `docs/reports/wp-069-4-watchdog-config-verification.md`
- [ ] 报告包含配置变更对比表

## 关键文件

- `plugins/core/provider-watchdog/assets/daemon-config.template.json` — 核心校验对象
- `docs/reports/2026-05-25_batch-execution-stall-diagnosis.md` — 诊断报告（变更依据）
- `docs/wp/WP-068.md` — 参考文档
