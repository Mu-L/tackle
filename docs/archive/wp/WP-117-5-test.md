# WP-117-5-test: 沙箱系统单元测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、所有核心组件的接口定义
> - 前置子包: WP-117-2-impl, WP-117-3-impl, WP-117-4-impl（所有实现子包必须先完成）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test（测试） |
| **父工作包** | WP-117 |
| **依赖** | WP-117-2-impl, WP-117-3-impl, WP-117-4-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 20min |

## 职责

为沙箱系统的四个核心组件编写单元测试，覆盖正常路径和边界情况。使用 Node.js 内置 `node:test` 框架。

## 任务清单

### Step 1: SandboxManager 测试

- [ ] 创建 `test/runtime/test-sandbox-manager.js`
- [ ] 测试 Worker Thread 创建成功
- [ ] 测试 Worker 激活流程（`activated` 消息接收）
- [ ] 测试 Worker 异常退出时的资源清理
- [ ] 测试 `terminateWorker()` 终止指定 Worker
- [ ] 测试 `terminateAll()` 终止所有活跃 Worker
- [ ] 测试 RPC 请求转发（主线程 → Worker → 主线程）

### Step 2: SandboxContext 测试

- [ ] 创建 `test/runtime/test-sandbox-context.js`
- [ ] 测试 `eventBus.emit` RPC 代理
- [ ] 测试 `stateStore.get/set/delete` RPC 代理
- [ ] 测试 `logger.info/warn/error` RPC 代理
- [ ] 测试 `getProvider` RPC 代理
- [ ] 测试 `_rpc()` 请求-响应 ID 匹配
- [ ] 测试错误响应正确 reject
- [ ] 测试序列化失败时的错误处理

### Step 3: Capabilities 测试

- [ ] 创建 `test/runtime/test-capabilities.js`
- [ ] 测试 Capability 枚举完整性
- [ ] 测试 CapabilityLevel 分级正确性
- [ ] 测试 CAPABILITY_LEVELS 映射完整性
- [ ] 测试 core 插件所有 capability 自动允许
- [ ] 测试 npm 插件需声明非基础 capability
- [ ] 测试 local 插件需声明非基础 capability
- [ ] 测试 child_process 对 npm/local 完全禁止
- [ ] 测试未声明 capability 时的拒绝

### Step 4: AuditLogger 测试

- [ ] 创建 `test/runtime/test-audit-logger.js`
- [ ] 测试 JSONL 文件创建和写入
- [ ] 测试 6 种事件类型的记录格式
- [ ] 测试自动附加 timestamp 字段
- [ ] 测试日志目录自动创建
- [ ] 测试写入失败时的 console.warn 回退
- [ ] 测试文件内容为合法 JSON Lines

### Step 5: 边界情况测试

- [ ] Worker 崩溃时的错误传播和资源清理
- [ ] 序列化不可序列化对象时的错误处理
- [ ] 未声明 capability 时调用被拒绝（不崩溃）
- [ ] Worker 创建超时时的超时处理
- [ ] 并发 RPC 请求的 ID 匹配正确性

## 关键文件

### 输入（读取）
- `plugins/runtime/sandbox-manager.js` — WP-117-1 实现
- `plugins/runtime/sandbox-context.js` — WP-117-2 实现
- `plugins/contracts/capabilities.js` — WP-117-3 实现
- `plugins/runtime/audit-logger.js` — WP-117-4 实现

### 输出（新建）
- `test/runtime/test-sandbox-manager.js` — SandboxManager 测试
- `test/runtime/test-sandbox-context.js` — SandboxContext 测试
- `test/runtime/test-capabilities.js` — Capabilities 测试
- `test/runtime/test-audit-logger.js` — AuditLogger 测试

## 验收标准

- [ ] 4 个测试文件创建完成
- [ ] SandboxManager 生命周期测试通过
- [ ] SandboxContext RPC 通信测试通过
- [ ] Capabilities 校验（allow/deny 场景）测试通过
- [ ] AuditLogger 日志记录测试通过
- [ ] 边界情况（崩溃、序列化失败、未声明 capability）测试通过
- [ ] 所有测试使用 `node:test` 内置框架
