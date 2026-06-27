# WP-068-3-verify: 构建验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-068.md`
> - 包含: 问题分析、实施方案详解、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-068 |
| **依赖** | WP-068-2-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

运行构建和验证命令，确保修改后的代码能正确通过构建流程。

## 任务清单

- [ ] 运行 `node bin/tackle.js build` — 确保构建无错误
- [ ] 运行 `node bin/tackle.js validate` — 确保插件格式验证通过
- [ ] 检查构建输出 `.claude/skills/skill-agent-dispatcher.md` 包含新增内容（状态持久化、恢复协议、批量控制）
- [ ] 运行 `node --test test/**/*.js` — 最终回归验证

## 验收标准

- [ ] build 命令无错误退出
- [ ] validate 命令通过
- [ ] 构建输出包含新增章节
- [ ] 全部测试通过

## 关键文件

- `bin/tackle.js` — 构建入口
- `.claude/skills/skill-agent-dispatcher.md` — 构建输出
