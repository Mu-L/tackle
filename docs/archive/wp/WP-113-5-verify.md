# WP-113-5-verify: 全量测试回归

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-113.md`
> - **前置条件**: WP-113-1~4 必须全部完成

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify（验证） |
| **父工作包** | WP-113 |
| **依赖** | WP-113-4-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 10min |

## 职责

在 WP-113-1~4 完成模块拆分和 proxy pattern 转换后，运行全量测试确认无回归。

## 任务清单

### Step 1: 运行全量测试

- [ ] 执行 `node --test test/**/*.js`，确认全部 295+ 测试通过
- [ ] 记录测试输出中的总测试数量和结果

### Step 2: 检查模块 require() 路径

- [ ] 验证 `build-orchestrator.js` 的 require 路径正确
- [ ] 验证 `yaml-parser.js` 的 require 路径正确
- [ ] 验证 `plugin-validator.js` 的 require 路径正确
- [ ] 验证 `settings-merger.js` 的 require 路径正确
- [ ] 验证 `claude-md-injector.js` 的 require 路径正确
- [ ] 验证 `harness-build.js` proxy 的 require 路径正确

### Step 3: 运行 smoke test

- [ ] 执行 `node test/smoke-test.js`（如存在）
- [ ] 或手动执行 `node bin/tackle.js build` + `node bin/tackle.js validate`

### Step 4: 记录测试结果

- [ ] 记录全量测试通过数/总数
- [ ] 记录是否有新增测试（来自 WP-113-1~3 的独立测试文件）
- [ ] 确认无破坏性变更

## 关键文件

### 输入（读取）
- `test/runtime/*.js` — 所有测试文件
- `test/integration/*.js` — 集成测试文件
- `test/smoke-test.js` — 冒烟测试（如存在）

### 无输出文件

## 验收标准

- [ ] 全部 295+ 测试通过，无失败
- [ ] 所有模块 require() 路径正确，无加载错误
- [ ] `node bin/tackle.js build` 执行成功
- [ ] `node bin/tackle.js validate` 执行成功
- [ ] 无破坏性变更
