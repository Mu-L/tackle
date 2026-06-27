# WP-127-3-verify: 全量测试与覆盖率验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-127.md`
> - 包含: 验收标准、用户决策汇总

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-127 |
| **依赖** | WP-127-1-impl, WP-127-2-impl |
| **执行角色** | tester |
| **预估时间** | 5min |
| **状态** | ✅ 完成 |

## 职责

在 127-1（代码修复）和 127-2（覆盖率补充）完成后，执行全量测试和覆盖率验证，确认所有修复和新增测试正确。

## 任务清单

- [x] 运行 `node --test test/**/*.js` 全量测试，确认 0 失败
- [x] 运行 `npm run test:coverage` 确认覆盖率 ≥70%
- [x] 确认 sandbox-manager.js 覆盖率 ≥75%（从 64.50% 提升）
- [x] 运行 `node bin/tackle.js build && node bin/tackle.js validate` 确认构建通过
- [x] 运行 `node test/smoke-test.js` smoke test（6/6）
- [x] 验证 init.js require 路径修复后 init 命令正常工作
- [x] 验证 plugin_access 加入 KNOWN_CAPABILITIES 后无虚假 warning

## 验收标准

- [x] 全量测试 0 失败
- [x] 行覆盖率 ≥70%
- [x] sandbox-manager.js 覆盖率 ≥75%
- [x] build + validate 通过
- [x] smoke test 6/6 通过
- [x] init 命令无路径解析错误
- [x] plugin_access 无虚假 warning

## 关键文件

- 全部测试文件（test/**/*.js）
- `bin/tackle.js` — CLI 入口
- `test/smoke-test.js` — smoke test
- `commands/init.js` — init 命令（验证路径修复）
