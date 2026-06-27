# WP-125-6-verify: WP-117 Worker Threads 沙箱校验

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
| **预估时间** | 25min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-117: A1-2 Worker Threads 完整沙箱** — 实现外部插件的 Worker Threads 沙箱隔离 + Capabilities 运行时校验 + RPC 代理层 + Audit 日志。

## 职责

验证沙箱系统 5 个新文件的完整功能：Worker Thread 生命周期、RPC 代理、三级信任模型、审计日志。

## 任务清单

- [ ] 验证 `sandbox-manager.js` Worker Thread 生命周期管理
  - 创建和销毁 Worker 正确
  - 超时处理
  - 错误传播
- [ ] 验证 `sandbox-context.js` RPC 代理层
  - 支持 eventBus / stateStore / logger 通信
  - 方法调用代理正确
- [ ] 验证 `sandbox-worker.js` Worker 内执行脚本
  - 插件代码在 Worker 内执行
  - 通信通道正确
- [ ] 验证 `capabilities.js` 三级信任模型
  - core / npm / local 信任级别正确
  - child_process 对 npm/local 插件禁止
  - Capabilities 声明与运行时校验一致
- [ ] 验证 `audit-logger.js` JSONL 审计日志
  - 日志写入 JSONL 文件
  - 日志格式正确
- [ ] 运行全部 4 个测试文件
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] sandbox-manager.js Worker Thread 生命周期管理正确
- [ ] sandbox-context.js RPC 代理层支持 eventBus/stateStore/logger
- [ ] sandbox-worker.js Worker 内执行脚本正确
- [ ] capabilities.js 三级信任模型 (core/npm/local) 生效
- [ ] child_process 对 npm/local 插件禁止
- [ ] audit-logger.js JSONL 审计日志写入正确
- [ ] 4 个测试文件全部通过，0 失败

## 关键文件

- `plugins/runtime/sandbox-manager.js` — Worker Thread 管理
- `plugins/runtime/sandbox-context.js` — RPC 代理层
- `plugins/runtime/sandbox-worker.js` — Worker 执行脚本
- `plugins/contracts/capabilities.js` — Capability 枚举
- `plugins/runtime/audit-logger.js` — 审计日志
- `test/runtime/test-sandbox-manager.js` — 对应测试
- `test/runtime/test-sandbox-context.js` — 对应测试
- `test/runtime/test-capabilities.js` — 对应测试
- `test/runtime/test-audit-logger.js` — 对应测试
