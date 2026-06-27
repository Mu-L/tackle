# WP-124-3-verify: 迁移验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-124.md`
> - 前置工作包: `docs/wp/WP-124-1-impl.md`（实现）、`docs/wp/WP-124-2-test.md`（测试）
> - 本工作包在 WP-124-2-test 完成后执行

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-124 |
| **依赖** | WP-124-2-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 5min |

## 职责

执行端到端迁移验证，确认迁移路径在实际项目场景下可正常工作。

## 任务清单

### Step 1: 运行迁移相关测试

- [ ] 运行 `node --test test/runtime/test-migrate.js`，确认全部通过
- [ ] 检查测试输出无 skip 或 todo 项

### Step 2: 端到端迁移验证

- [ ] 模拟 v0.1.x 项目配置，执行迁移命令
- [ ] 验证迁移后 `node bin/tackle.js build` 可正常执行
- [ ] 验证迁移后 `node bin/tackle.js validate` 可正常执行
- [ ] 验证回滚后恢复到迁移前状态

### Step 3: 运行全量测试确认无回归

- [ ] 运行 `node --test test/**/*.js`，确认全部通过
- [ ] 对比测试总数与基线，确认无遗漏

### Step 4: 验收确认

- [ ] 记录测试通过数量和总数量
- [ ] 确认端到端迁移流程完整可用
- [ ] 给出通过/不通过判定

## 关键文件

### 输入（读取）
- `test/runtime/test-migrate.js` — 迁移测试
- `commands/migrate.js` — 迁移命令
- `bin/tackle.js` — CLI 入口

## 验收标准

- [ ] 迁移测试全部通过
- [ ] 端到端迁移流程完整可用（migrate → build → validate → rollback）
- [ ] 全量测试无回归
