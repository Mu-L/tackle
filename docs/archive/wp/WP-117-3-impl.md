# WP-117-3-impl: Capabilities 运行时校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、能力校验流程、权限分级策略
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

创建 capabilities.js 契约文件，定义 Capability 枚举、CapabilityLevel 分级和 CAPABILITY_LEVELS 映射。实现运行时能力校验逻辑，集成到 SandboxManager 的 RPC 处理流程中，支持 core/npm/local 三级信任模型。

## 任务清单

### Step 1: 定义 Capability 枚举

- [ ] 创建 `plugins/contracts/capabilities.js`
- [ ] 定义 `Capability` 常量对象（Object.freeze）:
  - `FS_READ: 'fs.read'`
  - `FS_WRITE: 'fs.write'`
  - `NET_REQUEST: 'net.request'`
  - `NET_LISTEN: 'net.listen'`
  - `CHILD_PROCESS: 'child_process'`
  - `ENV_READ: 'env.read'`
  - `PLUGIN_ACCESS: 'plugin.access'`
  - `_DEFAULTS: ['eventbus', 'statestore', 'logger', 'config']`

### Step 2: 定义能力等级和映射

- [ ] 定义 `CapabilityLevel` 常量对象:
  - `SAFE: 'safe'`
  - `LOW_RISK: 'low_risk'`
  - `MEDIUM: 'medium'`
  - `HIGH_RISK: 'high_risk'`
- [ ] 定义 `CAPABILITY_LEVELS` 映射（Capability → CapabilityLevel）
- [ ] 全部 Object.freeze

### Step 3: 实现能力校验函数

- [ ] 实现 `checkCapability(capabilities, capability, sourceType)` 函数
- [ ] `sourceType === 'core'` → 所有 capability 自动通过
- [ ] `sourceType === 'npm' | 'local'` → 检查 capabilities 声明
- [ ] `child_process` 对 npm/local 完全禁止（即使声明也不允许）
- [ ] 返回 `{ allowed: boolean, reason: string }`

### Step 4: 实现能力限制矩阵

- [ ] 定义能力限制矩阵:
  | Capability | core | npm | local |
  |-----------|------|-----|-------|
  | eventBus.emit | 自动 | 自动 | 自动 |
  | stateStore.get/set | 自动 | 自动 | 自动 |
  | logger.info/warn/error | 自动 | 自动 | 自动 |
  | config.get | 自动 | 自动 | 自动 |
  | fs.read | 自动 | 需声明 | 需声明 |
  | fs.write | 自动 | 需声明 | 需声明 |
  | net.request | 自动 | 需声明 | 需声明 |
  | child_process | 自动 | 禁止 | 禁止 |
  | plugin.access | 自动 | 需声明 | 需声明 |

### Step 5: 集成到 SandboxManager

- [ ] 在 SandboxManager._handleRpcRequest 中调用 checkCapability
- [ ] 能力未声明时返回 `{ type: 'rpc-response', id, error: 'Capability xxx not declared' }`
- [ ] 能力违规时记录审计日志（capability.violation 事件）
- [ ] child_process 禁止时返回 `{ type: 'rpc-response', id, error: 'Capability child_process is prohibited for npm/local plugins' }`

## 关键文件

### 输入（读取）
- `docs/design/harness-universal-platform-final-design.md` 第 3.2 节 — Capabilities 声明系统
- `docs/design/harness-universal-platform-final-design.md` 第 3.4 节 — 权限分级策略
- `plugins/runtime/sandbox-manager.js` — WP-117-1 创建的 SandboxManager（集成校验）

### 输出（新建）
- `plugins/contracts/capabilities.js` — Capability 枚举 + CapabilityLevel + CAPABILITY_LEVELS

### 输出（修改）
- `plugins/runtime/sandbox-manager.js` — 集成能力校验到 _handleRpcRequest

## 验收标准

- [ ] Capability 枚举覆盖所有定义的能力类型
- [ ] CapabilityLevel 分级正确（SAFE → LOW_RISK → MEDIUM → HIGH_RISK）
- [ ] CAPABILITY_LEVELS 映射完整
- [ ] core 插件所有 capability 自动通过
- [ ] npm/local 插件需声明 fs.read, fs.write, net.request, plugin.access
- [ ] child_process 对 npm/local 完全禁止
- [ ] SandboxManager._handleRpcRequest 中集成校验
- [ ] 校验失败时返回错误消息（非崩溃）
