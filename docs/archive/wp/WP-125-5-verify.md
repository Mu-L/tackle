# WP-125-5-verify: WP-116 跨平台 CI 校验

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

**WP-116: A9 跨平台 CI 矩阵** — 添加 windows-latest 到 CI 矩阵，确保 Tackle Harness 在三大平台上全部通过。

## 职责

验证 CI 配置正确、矩阵覆盖完整、本地 Windows 无路径兼容问题。

## 任务清单

- [ ] 验证 `.github/workflows/ci.yml` 矩阵包含 ubuntu-latest + windows-latest + macos-latest
- [ ] 验证 Node.js 18 + 20 覆盖（3 OS × 2 Node = 6 组合）
- [ ] 验证 `fail-fast: false` 配置正确
- [ ] 本地 Windows 验证：`node --test test/**/*.js`（确认无路径兼容问题）
- [ ] 汇总结果，记录发现的问题

## 验收标准

- [ ] ci.yml 矩阵包含 ubuntu-latest + windows-latest + macos-latest
- [ ] Node.js 18 + 20 覆盖（3 OS × 2 Node）
- [ ] fail-fast: false 配置正确
- [ ] 本地 Windows 全量测试无路径兼容问题

## 关键文件

- `.github/workflows/ci.yml` — CI 配置
