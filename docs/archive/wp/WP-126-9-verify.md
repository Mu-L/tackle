# WP-126-9-verify: WP-122 覆盖率基线与 CI 门槛二次校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-126.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-126 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 10min |
| **状态** | 📋 待执行 |

## 职责

对 WP-122 覆盖率基线与 CI 门槛进行二次校验，验证覆盖率数据趋势和 CI 配置正确性。

## 任务清单

- [ ] 运行 `npm run test:coverage` 确认覆盖率 ≥ 70%
- [ ] 对比 WP-125 的 74.99% 与当前值，确认覆盖率趋势
- [ ] 验证 CI 配置中 coverage job 的 awk 门槛逻辑
- [ ] 确认 CI 覆盖率报告上传和 30 天保留策略
- [ ] 确认 test:coverage 脚本在 package.json 中正确定义
- [ ] 标记 DECISION-4：是否增加单模块覆盖率 CI 门槛

## 验收标准

- [ ] `npm run test:coverage` 执行成功
- [ ] 行覆盖率 ≥ 70%
- [ ] CI coverage job 配置完整
- [ ] DECISION-4 已标记

## 关键文件

- `package.json` — test:coverage 脚本
- `.github/workflows/ci.yml` — coverage job

## 待决策问题

**DECISION-4**: 覆盖率从 WP-125 的 74.99% 提升到当前的 83.36%。但 sandbox-manager.js 仅 64.50% 是明确的短板。是否需要将最低模块覆盖率门槛加入 CI（例如单模块 ≥ 60%）？还是维持全局 70% 门槛即可？
