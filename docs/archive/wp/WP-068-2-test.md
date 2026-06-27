# WP-068-2-test: 测试验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-068.md`
> - 包含: 问题分析、实施方案详解、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-068 |
| **依赖** | WP-068-1-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

验证 WP-068-1-impl 的修改是否正确：状态持久化逻辑、恢复协议、批量控制、watchdog 配置。

## 任务清单

- [ ] 验证 skill.md 中状态文件初始化逻辑存在且格式正确
- [ ] 验证 skill.md 中每轮循环恢复状态逻辑存在
- [ ] 验证 skill.md 中状态变更写回逻辑（Phase B/C/D + 循环末尾）
- [ ] 验证 skill.md 中上下文恢复协议章节存在且包含 5 步流程
- [ ] 验证 skill.md 中 max_batch_size 参数和分批逻辑存在
- [ ] 验证 daemon-config.template.json 超时值已调整（session_stalled_min: 30, task_stalled_min: 20）
- [ ] 运行 `node --test test/**/*.js` 确保无回归

## 验收标准

- [ ] 所有 6 个验证点通过
- [ ] 全部现有测试通过（0 failures）
- [ ] 发现的问题已记录并反馈给 impl 阶段

## 关键文件

- `plugins/core/skill-agent-dispatcher/skill.md` — 被测文件
- `.claude/watchdog/daemon-config.template.json` — 被测配置
