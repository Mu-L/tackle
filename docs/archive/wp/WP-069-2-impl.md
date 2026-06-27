# WP-069-2-impl: 恢复协议完整性校验

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

校验 `plugins/core/skill-agent-dispatcher/skill.md` 中上下文恢复协议的完整性和正确性。

## 校验要点

### 1. 恢复协议章节完整性
- [ ] skill.md 包含独立的「上下文恢复协议」章节
- [ ] 协议涵盖完整的恢复流程：读取 → 恢复 → 验证 → 继续
- [ ] 协议步骤清晰，无歧义

### 2. 边界情况处理
- [ ] 文件不存在：首次运行场景，正确处理
- [ ] status == "completed"：执行已完成，跳过恢复
- [ ] status == "monitoring"：进入恢复流程
- [ ] 文件格式错误/损坏：有容错处理

### 3. Phase 0 恢复逻辑
- [ ] 每轮循环开始时从文件恢复状态变量
- [ ] 恢复的字段与持久化的字段完全匹配
- [ ] loop_iteration 恢复后从正确位置继续（iteration + 1）
- [ ] 恢复后不重复执行已完成的操作

### 4. 状态一致性保证
- [ ] 恢复后 teamee_map 与实际 teamee 状态一致
- [ ] 恢复后 wp_assignments 与实际分配状态一致
- [ ] 恢复后 processed_action_ids 不包含重复项
- [ ] current_batch 恢复后不遗漏正在执行的任务

## 任务清单

- [ ] 读取 skill.md 中「上下文恢复协议」章节
- [ ] 读取 Phase 0 恢复逻辑代码段
- [ ] 校验 4 种边界情况的处理逻辑
- [ ] 追踪恢复流程，验证 loop_iteration 正确递增
- [ ] 检查恢复后状态变量的一致性
- [ ] 生成校验报告

## 验收标准

- [ ] 所有校验要点已检查并标注 PASS/FAIL
- [ ] 校验报告已写入 `docs/reports/wp-069-2-recovery-protocol-verification.md`
- [ ] 报告包含每个检查项的结论和证据

## 关键文件

- `plugins/core/skill-agent-dispatcher/skill.md` — 核心校验对象
- `docs/wp/WP-068.md` — 参考文档
- `docs/wp/WP-068-1-impl.md` — 实现工作包（了解预期交付物）
