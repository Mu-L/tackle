# WP-117-6-verify: 测试验证 + 全量回归

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-117.md`
> - 包含: 安全模型设计背景、验收标准
> - 前置子包: `docs/wp/WP-117-5-test.md`（所有单元测试必须先完成）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify（验证） |
| **父工作包** | WP-117 |
| **依赖** | WP-117-5-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 10min |

## 职责

运行全量测试套件，确认沙箱系统的所有测试通过且不干扰其他现有测试。

## 任务清单

### Step 1: 运行沙箱系统测试

- [ ] 执行 `node --test test/runtime/test-sandbox-manager.js`
- [ ] 执行 `node --test test/runtime/test-sandbox-context.js`
- [ ] 执行 `node --test test/runtime/test-capabilities.js`
- [ ] 执行 `node --test test/runtime/test-audit-logger.js`
- [ ] 确认所有沙箱测试通过

### Step 2: 运行全量回归测试

- [ ] 执行 `node --test test/**/*.js`
- [ ] 确认全部测试通过（无回归）
- [ ] 确认沙箱测试不干扰其他模块的测试
- [ ] 检查测试总数与预期一致

### Step 3: 覆盖率检查

- [ ] 执行 `node --test --experimental-test-coverage test/**/*.js`
- [ ] 确认新增模块有测试覆盖
- [ ] 确认整体覆盖率不低于沙箱实现前

## 关键文件

### 输入（读取）
- `test/runtime/test-sandbox-manager.js` — WP-117-5 创建
- `test/runtime/test-sandbox-context.js` — WP-117-5 创建
- `test/runtime/test-capabilities.js` — WP-117-5 创建
- `test/runtime/test-audit-logger.js` — WP-117-5 创建

## 验收标准

- [ ] 沙箱系统 4 个测试文件全部通过
- [ ] 全量 `node --test test/**/*.js` 通过
- [ ] 沙箱测试不影响其他模块测试结果
- [ ] 测试总数与预期一致
