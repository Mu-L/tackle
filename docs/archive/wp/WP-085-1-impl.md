# WP-085-1-impl: CLI 模块化重构 - 代码实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-085.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-085 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |

## 职责

将 `bin/tackle.js` (1,623 行) 拆分为 `commands/*.js` 子命令模块结构。

## 任务清单

- [ ] 设计命令模块统一接口 (name, description, execute(context))
- [ ] 创建 `bin/context.js` 命令执行上下文
- [ ] 拆分 build 命令到 `commands/build.js`
- [ ] 拆分 validate 命令到 `commands/validate.js`
- [ ] 拆分 init 命令到 `commands/init.js`
- [ ] 拆分 migrate 命令到 `commands/migrate.js`
- [ ] 拆分 interactive 命令到 `commands/interactive.js`
- [ ] 拆分 status 命令到 `commands/status.js`
- [ ] 拆分 config 命令到 `commands/config.js`
- [ ] 拆分 list 命令到 `commands/list.js`
- [ ] 拆分 version 命令到 `commands/version.js`
- [ ] 重构 `bin/tackle.js` 为轻量路由入口
- [ ] 验证所有命令可执行

## 验收标准

- [ ] `commands/` 目录包含 9 个命令模块文件
- [ ] `bin/tackle.js` 主入口 ≤ 200 行
- [ ] 所有现有命令功能不变
- [ ] 代码可编译运行无报错

## 关键文件

- `bin/tackle.js` — 重构为轻量路由入口
- `bin/context.js` — 新建
- `commands/build.js` — 新建
- `commands/validate.js` — 新建
- `commands/init.js` — 新建
- `commands/migrate.js` — 新建
- `commands/interactive.js` — 新建
- `commands/status.js` — 新建
- `commands/config.js` — 新建
- `commands/list.js` — 新建
- `commands/version.js` — 新建
