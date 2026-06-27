# WP-127-2-impl: sandbox-manager.js 覆盖率补充

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-127.md`
> - 包含: 用户决策汇总、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-127 |
| **依赖** | 无（可与 127-1 并行） |
| **执行角色** | tester |
| **预估时间** | 15min |
| **状态** | ✅ 完成 |

## 职责

补充 sandbox-manager.js 的测试覆盖率，目标从 64.50% 提升至 ≥75%。聚焦 4 个未覆盖区块。

## 未覆盖区域分析

| 行范围 | 方法 | 未覆盖原因 | 预估测试数 |
|--------|------|------------|------------|
| 369-465 | `_handleRpcRequest` | RPC 错误处理路径，需 Worker 端到端场景 | 5-6 |
| 476-487 | `_methodToCapability` | 方法到 capability 映射，需覆盖更多方法名 | 2-3 |
| 499-545 | `_callMainThreadService` | 主线程服务路由，需覆盖 eventBus/stateStore/logger 路径 | 4-5 |
| 556-585 | `_sanitizeForTransfer` | 跨线程数据清洗，需覆盖各种数据类型 | 3-4 |

## 任务清单

- [ ] 阅读现有 `test/runtime/test-sandbox-manager.js`（426 行，12 个测试）了解已有测试模式
- [ ] 阅读 `plugins/runtime/sandbox-manager.js` 369-585 行理解未覆盖逻辑
- [ ] 为 `_handleRpcRequest` 错误路径编写测试：
  - 无效 RPC action 处理
  - capability 检查失败时的拒绝
  - 方法不存在时的错误返回
  - RPC 结果传输异常处理
  - Worker 通信超时处理
- [ ] 为 `_methodToCapability` 编写测试：
  - 各种方法名到 capability 的映射
  - 未映射方法的处理
- [ ] 为 `_callMainThreadService` 编写测试：
  - eventBus 服务路由
  - stateStore 服务路由
  - logger 服务路由
  - 未知服务的错误处理
- [ ] 为 `_sanitizeForTransfer` 编写测试：
  - 各种数据类型清洗（对象、数组、基本类型）
  - 循环引用处理
  - 函数/符号过滤
- [ ] 运行 `node --test test/runtime/test-sandbox-manager.js` 确认所有测试通过
- [ ] 确认覆盖率从 64.50% 提升至 ≥75%

## 验收标准

- [ ] 新增 ~15 个测试用例
- [ ] 所有新增测试通过
- [ ] sandbox-manager.js 覆盖率 ≥75%
- [ ] 现有测试无回归

## 关键文件

- `plugins/runtime/sandbox-manager.js`（614 行，覆盖率 64.50%）
- `test/runtime/test-sandbox-manager.js`（426 行，12 个现有测试）
- `plugins/contracts/capabilities.js` — capability 定义参考
- `plugins/runtime/sandbox-context.js` — RPC 代理层参考
