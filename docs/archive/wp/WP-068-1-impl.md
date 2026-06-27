# WP-068-1-impl: 状态持久化 + 恢复协议 + 批量控制

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-068.md`
> - 包含: 问题分析、3 个方案详解、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-068 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |

## 职责

修改 `plugins/core/skill-agent-dispatcher/skill.md` 实施诊断报告的 3 个方案，以及调整 watchdog 超时配置。

## 任务清单

### Step 1：状态文件初始化

- [ ] 在监控循环开始前（约第 285 行），增加 `dispatcher-state.json` 初始化逻辑
- [ ] 初始状态包含：team_name, teamee_map, wp_assignments, start_time, loop_iteration, processed_action_ids, total_tasks, status, max_batch_size, current_batch, pending_batches

### Step 2：每轮循环恢复状态

- [ ] 在 Phase A 之前，增加 Read(state_file) + 解析 JSON 恢复所有变量
- [ ] 处理边界情况：文件不存在时使用默认值，status == "completed" 时正常退出

### Step 3：状态变更后写回文件

- [ ] Phase B（销毁 teamee 后）：更新 teamee_map 并写回
- [ ] Phase C（创建 teamee 后）：更新 teamee_map 并写回
- [ ] Phase D（处理 daemon 指令后）：更新 processed_action_ids 并写回
- [ ] 每轮循环末尾：更新 loop_iteration、status 并写回

### Step 4：上下文恢复协议章节

- [ ] 在 skill.md 新增"上下文恢复协议"章节
- [ ] 包含 5 步恢复流程：读取状态 → 恢复变量 → 验证 team → 恢复 teamee → 继续循环

### Step 5：Watchdog 超时调整

- [ ] 修改 `.claude/watchdog/daemon-config.template.json`
- [ ] session_stalled_min: 10 → 30
- [ ] task_stalled_min: 15 → 20

### Step 6：批量大小控制

- [ ] 新增 max_batch_size 参数（默认 5），支持用户配置覆盖
- [ ] Phase C 之前检查任务数，超过 max_batch_size 时分批
- [ ] 剩余任务写入 pending_batches
- [ ] 当前批完成后自动加载下一批（不退出循环）
- [ ] 每批完成更新状态文件

## 验收标准

- [ ] skill.md 包含完整的 6 步修改
- [ ] dispatcher-state.json 格式正确（JSON 可解析）
- [ ] 恢复协议处理文件不存在和格式错误等边界情况
- [ ] 批量控制逻辑正确：分批 → 执行 → 自动加载下一批
- [ ] daemon-config.template.json 超时值已调整
- [ ] 修改后的 skill.md 逻辑自洽，无矛盾

## 关键文件

- `plugins/core/skill-agent-dispatcher/skill.md` — 核心修改
- `.claude/watchdog/daemon-config.template.json` — 超时调整
- `docs/reports/2026-05-25_batch-execution-stall-diagnosis.md` — 参考诊断报告
