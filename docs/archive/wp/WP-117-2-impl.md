# WP-117-2-impl: SandboxContext RPC 代理层

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、RPC 通信架构说明
> - 前置子包: `docs/wp/WP-117-1-impl.md`（SandboxManager 必须先完成）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-117 |
| **依赖** | WP-117-1-impl |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 30min |

## 职责

创建 SandboxContext 类，在 Worker Thread 内部代理 PluginContext。所有方法调用通过 `postMessage` 传递到主线程执行，实现跨线程边界的透明 RPC 通信。

## 任务清单

### Step 1: 创建 SandboxContext 类

- [ ] 创建 `plugins/runtime/sandbox-context.js`
- [ ] 定义 `SandboxContext` 构造函数，接收 `pluginName` 和 `mainPort`（MessagePort）
- [ ] 存储 `_port` 引用和 `pluginName`

### Step 2: 代理 eventBus

- [ ] 实现 `eventBus.emit(event, data)` 代理
- [ ] 仅支持 emit（publish），不支持 on（subscribe 需主线程协调）
- [ ] 通过 `_rpc('eventBus.emit', [event, data])` 调用

### Step 3: 代理 stateStore

- [ ] 实现 `stateStore.get(key)` 代理 — `_rpc('stateStore.get', [key])`
- [ ] 实现 `stateStore.set(key, value)` 代理 — `_rpc('stateStore.set', [key, value])`
- [ ] 实现 `stateStore.delete(key)` 代理 — `_rpc('stateStore.delete', [key])`

### Step 4: 代理 logger

- [ ] 实现 `logger.info(msg)` 代理 — `_rpc('logger.info', [msg])`
- [ ] 实现 `logger.warn(msg)` 代理 — `_rpc('logger.warn', [msg])`
- [ ] 实现 `logger.error(msg)` 代理 — `_rpc('logger.error', [msg])`
- [ ] 日志在主线程输出，Worker 内不直接写文件

### Step 5: 代理 getProvider

- [ ] 实现 `async getProvider(name)` — `_rpc('getProvider', [name])`
- [ ] Provider 对象需可序列化（仅返回 JSON-safe 数据）

### Step 6: 实现 _rpc() 核心方法

- [ ] 生成唯一消息 ID（`Date.now() + Math.random()`）
- [ ] 通过 `port.postMessage()` 发送 `{ type: 'rpc-request', id, method, args }`
- [ ] 注册一次性 `message` 事件监听器等待响应
- [ ] 匹配 `{ type: 'rpc-response', id }` 响应
- [ ] `msg.error` 存在时 reject，否则 resolve `msg.result`
- [ ] 参数必须可序列化（结构化克隆算法限制）

## 关键文件

### 输入（读取）
- `docs/design/harness-universal-platform-final-design.md` 第 3.3.2 节 — SandboxContext 设计
- `plugins/contracts/plugin-interface.js` — PluginContext 接口定义（需代理的方法列表）
- `plugins/runtime/sandbox-manager.js` — WP-117-1 创建的 SandboxManager（RPC 服务端）

### 输出（新建）
- `plugins/runtime/sandbox-context.js` — SandboxContext 类

## 验收标准

- [ ] SandboxContext 代理 PluginContext 的所有核心方法
- [ ] eventBus.emit, stateStore.get/set/delete, logger.info/warn/error, getProvider 全部可用
- [ ] _rpc() 方法正确处理请求-响应匹配
- [ ] 错误响应正确 reject
- [ ] 所有传递参数可序列化（无函数/循环引用）
