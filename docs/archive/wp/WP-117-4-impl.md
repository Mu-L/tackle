# WP-117-4-impl: Audit 日志持久化

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、审计日志设计详情
> - 前置子包: `docs/wp/WP-117-1-impl.md`（SandboxManager 必须先完成）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（实现） |
| **父工作包** | WP-117 |
| **依赖** | WP-117-1-impl |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |
| **预估时间** | 20min |

## 职责

实现审计日志持久化模块。审计日志以 JSON Lines (JSONL) 格式写入 `${targetRoot}/.claude/logs/audit-${date}.jsonl`，每行一条记录。支持 6 种事件类型的记录，集成到 SandboxManager 的 RPC 处理流程中。

## 任务清单

### Step 1: 创建 AuditLogger 类

- [ ] 创建 `plugins/runtime/audit-logger.js`
- [ ] 定义 `AuditLogger` 构造函数，接收 `targetRoot` 路径
- [ ] 计算日志目录路径 `${targetRoot}/.claude/logs/`
- [ ] 计算日志文件路径 `audit-${YYYY-MM-DD}.jsonl`

### Step 2: 实现日志写入

- [ ] 实现 `log(entry)` 方法
- [ ] 自动附加 `timestamp` 字段（ISO 8601 格式）
- [ ] JSON.stringify 序列化条目
- [ ] 以 append 模式写入 JSONL 文件（每行一条记录）
- [ ] 日志目录不存在时自动创建
- [ ] 写入失败时回退到 console.warn（不阻断主流程）

### Step 3: 定义事件类型

支持以下 6 种事件类型：

- [ ] `plugin.install` — tackle install 执行时触发
  - 记录: 插件名、来源、声明的 capabilities
- [ ] `plugin.load` — plugin-loader.js._loadPlugin() 触发
  - 记录: 插件名、sourceType、capability 审查结果
- [ ] `capability.check` — 沙箱内 RPC 请求时触发
  - 记录: 请求的 capability、决策（allow/deny）
- [ ] `capability.violation` — 插件尝试未声明的 capability
  - 记录: 插件名、capability、调用栈（截取）
- [ ] `sandbox.create` — Worker Thread 创建时触发
  - 记录: 插件名、线程 ID
- [ ] `sandbox.terminate` — Worker Thread 终止时触发
  - 记录: 插件名、原因（正常/异常）

### Step 4: 实现便捷方法

- [ ] 实现 `logInstall(pluginName, source, capabilities)` 便捷方法
- [ ] 实现 `logLoad(pluginName, sourceType, capabilityResult)` 便捷方法
- [ ] 实现 `logCapabilityCheck(pluginName, capability, decision, detail)` 便捷方法
- [ ] 实现 `logCapabilityViolation(pluginName, capability, stackTrace)` 便捷方法
- [ ] 实现 `logSandboxCreate(pluginName, threadId)` 便捷方法
- [ ] 实现 `logSandboxTerminate(pluginName, reason)` 便捷方法

### Step 5: 集成到 SandboxManager

- [ ] 在 SandboxManager 构造函数中创建 AuditLogger 实例
- [ ] Worker 创建时调用 `logSandboxCreate`
- [ ] Worker 终止时调用 `logSandboxTerminate`
- [ ] RPC 处理时调用 `logCapabilityCheck`（allow 场景）
- [ ] 能力校验失败时调用 `logCapabilityViolation`

## 关键文件

### 输入（读取）
- `docs/design/harness-universal-platform-final-design.md` 第 3.5 节 — 审计日志设计
- `plugins/runtime/sandbox-manager.js` — WP-117-1 创建的 SandboxManager（集成日志）

### 输出（新建）
- `plugins/runtime/audit-logger.js` — AuditLogger 类

### 输出（修改）
- `plugins/runtime/sandbox-manager.js` — 集成审计日志到 RPC 处理流程

## 验收标准

- [ ] 审计日志写入 `${targetRoot}/.claude/logs/audit-${date}.jsonl`
- [ ] JSON Lines 格式，每行一条 JSON 记录
- [ ] 6 种事件类型均可正确记录
- [ ] 每条记录自动附加 ISO 8601 时间戳
- [ ] 日志目录不存在时自动创建
- [ ] 写入失败时回退到 console.warn，不阻断主流程
- [ ] SandboxManager 中集成审计日志记录
