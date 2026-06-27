# WP-076-2-impl: 版本号升级 + CHANGELOG + README 修订

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-076.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-076 |
| **依赖** | WP-076-1-impl |
| **执行角色** | implementer |
| **状态** | ✅ 完成 |

## 职责

将项目版本号从 0.1.1 升级到 0.1.2，更新 CHANGELOG，修复 README.md 和 README.en.md 中的已知问题。

## 任务清单

- [ ] 更新 `package.json`: version "0.1.1" → "0.1.2"
- [ ] 更新 `CHANGELOG.md`: 在文件顶部（## [0.1.1] 之前）新增 [0.1.2] 条目
- [ ] 更新 `README.md`:
  - L6: 版本徽章 0.1.1 → 0.1.2
  - L185: "13 个技能" → "15 个技能"
  - L278-282: 删除重复的交互式模式描述段落
- [ ] 更新 `README.en.md`:
  - 版本徽章 0.1.1 → 0.1.2
  - 检查是否有 "13 skills" → 应为 "15 skills" 的类似问题
  - 检查是否有重复段落

## CHANGELOG 新条目内容

```markdown
## [0.1.2] - 2026-05-25

### Fixed

- README.md 修正本地安装模式技能数量（13 → 15）
- README.md 移除重复的交互式模式描述段落
- installation.md 将过时的 tackle-init 更正为 tackle-sync
- daily-workflow-guide.md Skill 速查表补充 tackle-sync 和 task-archive

### Changed

- 统一 docs/ 目录下所有技术文档的版本号引用至 0.1.2
- best-practices.md、daily-workflow-guide.md、plugin-development.md、ai_workflow.md 版本标识同步更新
```

## 关键文件

- `package.json`
- `CHANGELOG.md`
- `README.md`
- `README.en.md`

## 验收标准

- [ ] package.json version 为 "0.1.2"
- [ ] CHANGELOG.md 包含完整的 [0.1.2] 条目
- [ ] README.md 版本徽章显示 0.1.2
- [ ] README.md 本地安装模式显示 "15 个技能"
- [ ] README.md 无重复的交互式模式段落
- [ ] README.en.md 版本徽章显示 0.1.2
