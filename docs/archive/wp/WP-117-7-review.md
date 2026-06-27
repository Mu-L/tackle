# WP-117-7-review: 代码审查

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、威胁模型、验收标准
> - 前置子包: `docs/wp/WP-117-6-verify.md`（测试验证必须先通过）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | review（审查） |
| **父工作包** | WP-117 |
| **依赖** | WP-117-6-verify |
| **执行角色** | reviewer |
| **状态** | 📋 待执行 |
| **预估时间** | 10min |

## 职责

审查 WP-117 沙箱系统的完整实现，确保安全模型的完整性、Worker Thread 的安全性和审计日志的正确性。

## 任务清单

### Step 1: 安全模型完整性审查

- [ ] 审查威胁模型中的 5 项威胁是否均有对应防护措施
- [ ] 审查 T1（外部插件任意代码执行）是否被 Worker Threads 隔离解决
- [ ] 审查 T2（npm 供应链攻击）是否有来源校验
- [ ] 审查 T3（Manifest 篡改注入）是否有签名/hash 保护
- [ ] 审查 T4（PluginContext 权限泄露）是否被 RPC 代理限制
- [ ] 审查 T5（原型污染）是否有 sanitize 处理

### Step 2: Worker Thread 安全性审查

- [ ] 确认 `execArgv: ['--disable-eval']` 限制生效
- [ ] 确认 Worker 内无法使用 eval/Function 构造函数
- [ ] 确认 workerData 仅传递可序列化数据
- [ ] 确认 Worker 异常退出时资源正确清理
- [ ] 确认无内存泄漏（Worker 终止时清理引用）

### Step 3: Capabilities 校验审查

- [ ] 审查能力限制矩阵完整性（core/npm/local 三级）
- [ ] 审查 child_process 对 npm/local 完全禁止的实现
- [ ] 审查未声明 capability 时的拒绝行为（不崩溃）
- [ ] 审查 RPC 方法与 capability 的映射关系

### Step 4: 审计日志审查

- [ ] 审查 6 种事件类型是否完整覆盖
- [ ] 审查 JSONL 格式正确性
- [ ] 审查日志文件路径安全（路径遍历防护）
- [ ] 审查写入失败时的回退行为

### Step 5: 代码质量审查

- [ ] 代码风格符合项目约定（2-space indent, single quotes, semicolons）
- [ ] 所有公共方法有 JSDoc 注释
- [ ] 无 console.log（使用 logger）
- [ ] 错误处理完整（try/catch + 错误传播）
- [ ] 无硬编码路径

## 关键文件

### 输入（读取）
- `plugins/runtime/sandbox-manager.js` — WP-117-1 实现
- `plugins/runtime/sandbox-context.js` — WP-117-2 实现
- `plugins/contracts/capabilities.js` — WP-117-3 实现
- `plugins/runtime/audit-logger.js` — WP-117-4 实现
- `plugins/runtime/sandbox-worker-entry.js` — WP-117-1 Worker 入口

## 验收标准

- [ ] 安全模型 5 项威胁均有对应防护
- [ ] Worker Thread 的 eval 限制正确生效
- [ ] 能力限制矩阵完整且正确
- [ ] 审计日志覆盖所有安全相关事件
- [ ] 代码质量符合项目约定
