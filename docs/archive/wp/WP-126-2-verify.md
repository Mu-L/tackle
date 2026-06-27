# WP-126-2-verify: WP-117 Worker Threads 沙箱二次校验

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
| **预估时间** | 25min |
| **状态** | 📋 待执行 |

## 职责

对 WP-117 Worker Threads 完整沙箱进行二次校验，重点关注覆盖率最低的 sandbox-manager.js（64.50%），验证沙箱系统全链路功能。

## 任务清单

- [ ] 运行 4 个沙箱测试文件（100 测试）：
  - `node --test test/runtime/test-sandbox-manager.js`
  - `node --test test/runtime/test-sandbox-context.js`
  - `node --test test/runtime/test-capabilities.js`
  - `node --test test/runtime/test-audit-logger.js`
- [ ] 分析 sandbox-manager.js 覆盖率（当前 64.50%，所有模块最低）
  - 未覆盖行集中在 369-465、476-487、499-545、556-585（约 200 行）
  - 评估未覆盖行是否为可接受风险
- [ ] 验证 Worker Thread 生命周期：创建/销毁/超时/错误传播
- [ ] 验证 capabilities.js 三级信任模型（core/npm/local）
- [ ] 验证 audit-logger.js JSONL 日志格式和持久化
- [ ] 验证 sandbox-context.js RPC 代理层的 eventBus/stateStore/logger 通信
- [ ] 标记 DECISION-1：sandbox-manager.js 覆盖率问题

## 验收标准

- [ ] 100/100 测试通过
- [ ] 三级信任模型 core/npm/local 各场景正确
- [ ] audit-logger JSONL 格式合规
- [ ] DECISION-1 已标记并记录详细分析

## 关键文件

- `plugins/runtime/sandbox-manager.js`（614 行，覆盖率 64.50%）
- `plugins/runtime/sandbox-context.js`（233 行）
- `plugins/runtime/sandbox-worker.js`（208 行）
- `plugins/contracts/capabilities.js`（260 行）
- `plugins/runtime/audit-logger.js`（318 行）
- `test/runtime/test-sandbox-manager.js`
- `test/runtime/test-sandbox-context.js`
- `test/runtime/test-capabilities.js`
- `test/runtime/test-audit-logger.js`

## 待决策问题

**DECISION-1**: sandbox-manager.js 覆盖率 64.50% 远低于整体 83.36%，约 200 行未覆盖。是否需要在二次校验中补充测试提升覆盖率，还是标记为已知技术债务推迟到 v0.3.0？
