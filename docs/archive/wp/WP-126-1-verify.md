# WP-126-1-verify: WP-112 安全最小集二次校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-126.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-126 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 职责

对 WP-112 安全最小集进行二次校验，确认首次校验（WP-125）修复项未回归，验证安全机制的完整性。

## 任务清单

- [ ] 运行 `node --test test/runtime/test-wp112-security.js`（20 测试）
- [ ] 确认 WP-125 修复项 3（test-wp112-security.js:390 schema 类型修正）未回归
- [ ] 验证 `commands/install.js` 中 `confirmInstall()` 的 4 个分支逻辑：
  - capabilities 非空时提示确认
  - core 插件跳过确认
  - TACKLE_ASSUME_YES 环境变量自动确认
  - 默认行为（无 capabilities 的非 core 插件）
- [ ] 验证 `plugin-validator.js` 中 `validateCapabilities()` 对无效结构的拒绝能力
- [ ] 验证 `harness-build.js` 中外部插件来源警告功能
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 20/20 测试通过
- [ ] WP-125 修复项 3 无回归
- [ ] confirmInstall 四个分支均正确
- [ ] validateCapabilities 正确拒绝无效结构

## 关键文件

- `commands/install.js` — confirmInstall()
- `plugins/runtime/plugin-validator.js` — validateCapabilities()
- `plugins/runtime/harness-build.js` — 外部插件来源警告
- `test/runtime/test-wp112-security.js` — 20 个测试
