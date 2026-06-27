# WP-118-2-test: A4 E2E 测试套件 - build + validate 流程测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-118.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-118 |
| **依赖** | WP-118-1-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

编写 build 和 validate 子命令的端到端测试，覆盖 init→build→validate 完整流程和错误路径。

## 任务清单

- [ ] 编写 `tackle build` 正常流程测试（init → build）
- [ ] 编写 `tackle build` 无 init 前置测试（直接 build）
- [ ] 编写 `tackle validate` 正常流程测试（init → build → validate）
- [ ] 编写 `tackle validate` 损坏配置测试
- [ ] 编写 init → build → validate 完整流程测试
- [ ] 编写错误路径测试（缺少 plugin.json、损坏的 skill.md）
- [ ] 验证所有 E2E 测试通过

## 验收标准

- [ ] build 子命令 E2E 测试通过
- [ ] validate 子命令 E2E 测试通过
- [ ] init → build → validate 完整流程测试通过
- [ ] 错误路径测试覆盖主要异常场景

## 关键文件

- `test/e2e/test-init-build-validate.js` — 扩展
- `bin/tackle.js` — 测试对象
