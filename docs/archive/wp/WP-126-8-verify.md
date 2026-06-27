# WP-126-8-verify: WP-118 E2E 测试二次校验

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

对 WP-118 E2E 测试套件进行二次校验，验证 CLI 子进程级测试的完整性和幂等性。

## 任务清单

- [ ] 运行 `node --test test/e2e/test-init-build-validate.js`（18 测试）
- [ ] 验证 8 个覆盖域：
  - 核心工作流（init → build → validate）
  - 幂等性（重复执行结果一致）
  - verbose 模式
  - 本地模式
  - 错误路径
  - 边界场景
  - 全局模式
  - CLI 基础
- [ ] 确认所有 E2E 测试在当前代码库上通过（不依赖特定环境状态）
- [ ] 检查 E2E 测试的清理逻辑（不残留临时文件/目录）
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 18/18 E2E 测试通过
- [ ] 测试执行后无残留临时文件/目录
- [ ] 幂等性确认（重复执行结果一致）

## 关键文件

- `test/e2e/test-init-build-validate.js`（18 E2E 测试）
- `bin/tackle.js` — CLI 入口
- `commands/init.js` — init 命令
- `commands/build.js` — build 命令
- `commands/validate.js` — validate 命令
