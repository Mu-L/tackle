# WP-120-3-verify: 测试验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-120.md`
> - 前置工作包: `docs/wp/WP-120-1-impl.md`（实现）、`docs/wp/WP-120-2-test.md`（测试）
> - 本工作包在 WP-120-2-test 完成后执行

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-120 |
| **依赖** | WP-120-2-test |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 5min |

## 职责

运行全部测试套件，确认 Manifest 扩展相关测试全部通过，且现有测试无回归。

## 任务清单

### Step 1: 运行 Manifest 扩展相关测试

- [ ] 运行 `node --test test/runtime/test-manifest-resolver.js`，确认全部通过
- [ ] 检查测试输出无 skip 或 todo 项

### Step 2: 运行全量测试确认无回归

- [ ] 运行 `node --test test/**/*.js`，确认全部通过
- [ ] 对比测试总数与基线，确认无遗漏

### Step 3: 验收确认

- [ ] 记录测试通过数量和总数量
- [ ] 确认无回归问题
- [ ] 给出通过/不通过判定

## 关键文件

### 输入（读取）
- `test/runtime/test-manifest-resolver.js` — Manifest 扩展测试
- `test/runtime/` — 其他运行时测试（回归检查）

## 验收标准

- [ ] Manifest 扩展测试全部通过
- [ ] 全量测试无回归（现有测试全部通过）
- [ ] 测试覆盖率达到预期
