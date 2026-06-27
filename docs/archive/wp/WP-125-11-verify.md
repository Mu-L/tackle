# WP-125-11-verify: WP-123 工程卫生校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-125.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-125 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 10min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-123: A11 工程卫生** — 确保 lock 文件同步、更新 CONTRIBUTING.md、统一测试计数。

## 职责

验证 npm ci 正常、CONTRIBUTING.md 内容完整、lock 文件同步。

## 任务清单

- [ ] 运行 `npm ci`，确认成功执行无错误
- [ ] 验证 `CONTRIBUTING.md` 内容完整：
  - Node.js 版本要求正确
  - 测试框架描述正确
  - 无占位符 URL
- [ ] 验证 `package-lock.json` 与 `package.json` 同步
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] npm ci 成功执行无错误
- [ ] CONTRIBUTING.md 内容完整（Node.js 版本、测试框架、无占位符 URL）
- [ ] package-lock.json 与 package.json 同步

## 关键文件

- `CONTRIBUTING.md` — 贡献指南
- `package-lock.json` — lock 文件
- `package.json` — 包配置
