# WP-082-pre: package-lock.json 版本修复

## 🤖 Subagent 读取指令

> **重要**: 此文档包含完整的任务上下文。执行前请阅读以下内容：
> - **问题分析**: 理解任务的背景和问题点
> - **实施计划**: 按 Step 顺序执行
> - **验收标准**: 任务完成的检查清单

## 基本信息

| 属性 | 值 |
|------|-----|
| **优先级** | P0 (前置) |
| **预估AI时间** | 5min |
| **拆分模式** | simple |
| **状态** | 📋 待执行 |

## 复杂度评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 文件影响范围 | 1 | 仅 package-lock.json |
| 模块数量 | 1 | 无模块变更 |
| 接口变更程度 | 1 | 无接口变更 |
| 测试用例预估 | 1 | 验证现有测试通过 |
| 预估AI时间 | 1 | 5min |
| **总分** | 3 | 模式: simple |

## 目标

修复 package-lock.json 版本不一致 (0.0.11 vs 0.1.2)，确保与 package.json 同步。

## 实施计划

### Step 1: 同步版本

```bash
npm install
```

### Step 2: 验证测试

```bash
node --test test/**/*.js
```

### Step 3: 提交

提交更新后的 package-lock.json。

## 验收标准

- [ ] package-lock.json 版本与 package.json 一致 (0.1.2)
- [ ] `node --test test/**/*.js` 全量通过 (164 tests)
