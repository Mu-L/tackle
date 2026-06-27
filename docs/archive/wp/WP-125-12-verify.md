# WP-125-12-verify: WP-124 版本迁移校验

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

**WP-124: A12 版本迁移路径** — 测试 tackle migrate 升级路径 + 编写回滚策略 + 验证 schema 向后兼容。

## 职责

验证 migrate 命令功能正确、升级路径测试通过、schema 向后兼容。

## 任务清单

- [ ] 验证 `commands/migrate.js` 存在且功能正确
- [ ] 运行 `node --test test/runtime/test-migrate.js`
- [ ] 验证 v0.1.x → v0.2.0 升级路径测试通过
- [ ] 验证 migrate 命令处理所有边界情况
- [ ] 验证 plugin.json schema 向后兼容
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] v0.1.x → v0.2.0 升级路径测试通过
- [ ] migrate 命令处理所有边界情况
- [ ] plugin.json schema 向后兼容
- [ ] test-migrate.js 全部通过，0 失败

## 关键文件

- `commands/migrate.js` — 迁移命令
- `test/runtime/test-migrate.js` — 对应测试
