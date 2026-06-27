# WP-125-10-verify: WP-122 覆盖率基线校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-125.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-125 |
| **依赖** | 无 |
| **执行角色** | tester |
| **预估时间** | 10min |
| **状态** | 📋 待执行 |

## 校验 WP

**WP-122: A10 覆盖率基线 + CI 门槛** — 配置 Node.js 内置覆盖率工具，设置 70% 行覆盖率门槛。

## 职责

验证覆盖率脚本配置正确、CI 门槛生效、当前覆盖率达标。

## 任务清单

- [ ] 验证 `package.json` 中 `test:coverage` 脚本存在且配置正确
- [ ] 验证 `.github/workflows/ci.yml` coverage job 存在
  - 70% 行覆盖率门槛配置
  - artifact 上传配置
- [ ] 运行 `npm run test:coverage`，确认覆盖率 ≥ 70%
- [ ] 检查覆盖率报告是否可正常生成
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] package.json 中 test:coverage 脚本存在且正确
- [ ] ci.yml coverage job 存在，70% 行覆盖率门槛
- [ ] 当前覆盖率 ≥ 70%
- [ ] 覆盖率报告可正常生成

## 关键文件

- `package.json` — test:coverage 脚本
- `.github/workflows/ci.yml` — coverage job
