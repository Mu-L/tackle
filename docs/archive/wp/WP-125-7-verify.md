# WP-125-7-verify: WP-118 E2E 测试校验

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

**WP-118: A4 E2E 测试套件** — 建立 CLI 子进程级端到端测试套件，覆盖 init → build → validate 标准工作流。

## 职责

验证 E2E 测试覆盖全流程、支持 global/local 模式、错误路径覆盖完整。

## 任务清单

- [ ] 验证 `test/e2e/test-init-build-validate.js` 存在
- [ ] 运行 `node --test test/e2e/test-init-build-validate.js`
- [ ] 检查覆盖范围：
  - init → build → validate 全流程
  - global 和 local 安装模式
  - 错误路径（无效 registry、缺失 plugin.json）
- [ ] 确认测试在 Windows 本地通过
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] init → build → validate 全流程测试通过
- [ ] 覆盖 global 和 local 安装模式
- [ ] 覆盖错误路径（无效 registry、缺失 plugin.json）
- [ ] 测试在 Windows 本地通过
- [ ] test-init-build-validate.js 全部通过，0 失败

## 关键文件

- `test/e2e/test-init-build-validate.js` — E2E 测试
- `bin/tackle.js` — CLI 入口
