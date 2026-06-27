# WP-125-1-verify: WP-112 安全最小集校验

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
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-112: A1-1 安全最小集** — 在外部插件首次加载时让用户意识到安全风险并做出知情决策，实现"安装时确认 + 构建时警告"双重防护。

## 职责

逐项验证 WP-112 的所有验收标准，确认功能正确，修复发现的问题。

## 任务清单

- [ ] 验证 `commands/install.js` 中 `confirmInstall()` 函数存在且逻辑正确
  - capabilities 非空时触发用户确认
  - core 插件不触发安全提示
  - TACKLE_ASSUME_YES 环境变量跳过确认
- [ ] 验证 `plugins/runtime/harness-build.js` 中 `_buildPlugin()` 外部插件来源警告
- [ ] 验证 `plugins/runtime/plugin-validator.js` 中 `validateCapabilities()` 结构验证
  - capabilities 字段有结构验证逻辑
  - 无效 capabilities 被拒绝
- [ ] 运行测试: `node --test test/runtime/test-wp112-security.js`
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] 外部插件安装时有 confirmInstall() 用户确认（capabilities 非空时）
- [ ] build 时外部插件输出来源警告
- [ ] plugin-validator.js 中 validateCapabilities() 结构验证可用
- [ ] TACKLE_ASSUME_YES 环境变量跳过确认
- [ ] core 插件不触发安全提示
- [ ] test-wp112-security.js 全部通过，0 失败

## 关键文件

- `commands/install.js` — confirmInstall()
- `plugins/runtime/harness-build.js` — _buildPlugin() 来源警告
- `plugins/runtime/plugin-validator.js` — validateCapabilities()
- `test/runtime/test-wp112-security.js` — 对应测试
