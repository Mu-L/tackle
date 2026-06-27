# WP-117-1-impl: SandboxManager + Worker Thread 生命周期

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、威胁分析、核心组件说明

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-117 |
| **依赖** | WP-113（模块化完成后才能做 DI 重构） |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 40min |

## 职责

创建 SandboxManager 类，使用 Node.js `worker_threads` 模块管理插件隔离运行环境。负责 Worker Thread 的完整生命周期：创建 → 激活 → 运行 → 终止。

## 任务清单

### Step 1: 创建 SandboxManager 类骨架

- [ ] 创建 `plugins/runtime/sandbox-manager.js`
- [ ] 引入 `worker_threads` 模块
- [ ] 定义 `SandboxManager` 构造函数，初始化 workers Map（pluginName → Worker）
- [ ] 定义 `_getSandboxScriptPath()` 方法，返回 Worker 入口脚本路径
- [ ] 定义 `_getPluginPath(plugin)` 方法，解析插件路径

### Step 2: 实现 Worker 创建与激活

- [ ] 实现 `activateInSandbox(plugin, capabilities, context)` 异步方法
- [ ] 序列化约束: 只传递可序列化的数据到 worker（pluginName, pluginPath, capabilities）
- [ ] 创建 Worker 时设置 `execArgv: ['--disable-eval']` 限制 eval/Function
- [ ] 设置 `workerData` 传递插件信息和 capabilities
- [ ] 返回 Promise，等待 Worker 发送 `activated` 消息

### Step 3: 实现 RPC 请求处理

- [ ] 实现 `_handleRpcRequest(worker, msg, context, capabilities)` 方法
- [ ] 监听 Worker 的 `rpc-request` 类型消息
- [ ] 在主线程侧执行 context 方法调用
- [ ] 将结果序列化后通过 `postMessage` 返回 Worker
- [ ] 错误处理: 捕获异常并返回 `rpc-response` 消息

### Step 4: 实现 Worker 终止与清理

- [ ] 实现 `terminateWorker(pluginName)` 方法
- [ ] 调用 `worker.terminate()` 终止线程
- [ ] 清理 workers Map 中的条目
- [ ] 实现 `terminateAll()` 方法，终止所有活跃 Worker

### Step 5: 错误处理

- [ ] Worker `error` 事件监听：记录错误日志
- [ ] Worker `exit` 事件监听：非预期退出时清理资源
- [ ] Worker 异常退出时从 workers Map 移除
- [ ] Worker 创建失败时的错误传播

### Step 6: 编写 Worker 入口脚本

- [ ] 创建 `plugins/runtime/sandbox-worker-entry.js`
- [ ] 从 `workerData` 获取 pluginName, pluginPath, capabilities
- [ ] `require()` 加载插件模块（在 Worker 内执行）
- [ ] 创建 SandboxContext（代理 PluginContext）
- [ ] 调用插件的 `onActivate(context)` 方法
- [ ] 激活成功后发送 `{ type: 'activated' }` 消息
- [ ] 激活失败时发送 `{ type: 'activation-error', error: message }` 消息

## 关键文件

### 输入（读取）
- `docs/design/harness-universal-platform-final-design.md` 第 3.3 节 — Worker Threads 沙箱架构
- `plugins/contracts/plugin-interface.js` — Plugin 基类和 PluginContext 接口
- `plugins/runtime/plugin-loader.js` — 当前插件加载流程（需理解集成点）

### 输出（新建）
- `plugins/runtime/sandbox-manager.js` — SandboxManager 类
- `plugins/runtime/sandbox-worker-entry.js` — Worker 入口脚本

## 验收标准

- [ ] SandboxManager 可创建 Worker Thread 并加载外部插件
- [ ] Worker 创建时 `--disable-eval` 限制生效
- [ ] Worker 生命周期管理完整（创建 → 激活 → 运行 → 终止）
- [ ] Worker 异常退出时资源正确清理
- [ ] RPC 请求/响应消息传递正常工作
- [ ] Worker 入口脚本可加载插件并调用 onActivate()
