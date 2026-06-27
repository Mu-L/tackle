# WP-128-1-verify: 安全与沙箱域校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-128.md`

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-128 |
| **依赖** | 无 |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

校验 WP-112（安全最小集）、WP-117（Worker Threads 完整沙箱）、WP-127（修复确认）的成果。

## 校验范围

### WP-112 安全最小集
- `commands/install.js` — confirmInstall() 函数
- `plugins/runtime/harness-build.js` — 外部插件来源警告
- `plugins/runtime/plugin-validator.js` — validateCapabilities()
- `test/runtime/test-wp112-security.js`

### WP-117 Worker Threads 沙箱
- `plugins/runtime/sandbox-manager.js` — SandboxManager 类
- `plugins/runtime/sandbox-context.js` — createSandboxProxy/createMainThreadBridge
- `plugins/runtime/sandbox-worker.js` — Worker 内执行脚本
- `plugins/contracts/capabilities.js` — Capability 枚举 + 三级信任
- `plugins/runtime/audit-logger.js` — AuditLogger 类
- `test/runtime/test-sandbox-manager.js`
- `test/runtime/test-sandbox-context.js`
- `test/runtime/test-capabilities.js`
- `test/runtime/test-audit-logger.js`

### WP-127 修复确认
- init.js require 路径修复无回归
- plugin_access 键名统一无回归
- sandbox-manager 覆盖率 ≥75%

## 任务清单

- [ ] 运行 test-wp112-security.js 全部测试通过
- [ ] 运行 test-sandbox-manager.js 全部测试通过
- [ ] 运行 test-sandbox-context.js 全部测试通过
- [ ] 运行 test-capabilities.js 全部测试通过
- [ ] 运行 test-audit-logger.js 全部测试通过
- [ ] 验证 confirmInstall() 交互/非交互模式逻辑
- [ ] 验证 SandboxManager Worker 创建/终止生命周期
- [ ] 验证 RPC 代理通信正确性
- [ ] 验证三级信任模型（core/npm/local）规则
- [ ] 验证 AuditLogger JSONL 写入格式
- [ ] 验证 WP-127 修复项无回归
- [ ] 记录发现的问题

## 验收标准

- [ ] 所有相关测试通过
- [ ] 代码审查无严重问题
- [ ] 发现的问题已记录（按严重程度分类：HIGH/MEDIUM/LOW/DECISION）

## 关键文件

- `commands/install.js`
- `plugins/runtime/sandbox-manager.js`
- `plugins/runtime/sandbox-context.js`
- `plugins/runtime/sandbox-worker.js`
- `plugins/contracts/capabilities.js`
- `plugins/runtime/audit-logger.js`
- `plugins/runtime/plugin-validator.js`
- `plugins/runtime/harness-build.js`
- `test/runtime/test-wp112-security.js`
- `test/runtime/test-sandbox-manager.js`
- `test/runtime/test-sandbox-context.js`
- `test/runtime/test-capabilities.js`
- `test/runtime/test-audit-logger.js`
