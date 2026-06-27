# WP-126-12-verify: WP-116/123/124 CI+工程+迁移二次校验

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
| **预估时间** | 20min |
| **状态** | 📋 待执行 |

## 职责

对 WP-116（跨平台 CI）、WP-123（工程卫生）、WP-124（版本迁移路径）进行二次校验。这三个 WP 属于工程收尾类，合并为一个子包校验。

## 任务清单

### WP-116 跨平台 CI 矩阵
- [ ] 验证 ci.yml 中 3 OS × 2 Node = 6 组合的 matrix 配置
- [ ] 确认 `fail-fast: false` 设置
- [ ] 确认 E2E 测试在 CI 中被运行
- [ ] 验证 coverage job 配置（ubuntu-latest + Node 20）

### WP-123 工程卫生
- [ ] 验证 CONTRIBUTING.md 中 Node.js 版本描述正确
- [ ] 确认无占位符 URL
- [ ] 确认 `npm ci` 成功（package-lock.json 同步）
- [ ] 确认 WP-125 修复项 2（package-lock.json 同步）未回归

### WP-124 版本迁移路径
- [ ] 运行 `node --test test/runtime/test-migrate.js`（20 测试）
- [ ] 验证 `docs/migration-guide.md` 存在且内容完整
- [ ] 确认 migrate 命令的 v0.1.x → v0.2.0 升级路径正确
- [ ] 验证 `commands/migrate.js` 功能

## 验收标准

- [ ] CI 矩阵 3×2 配置完整
- [ ] CONTRIBUTING.md 无占位符 URL
- [ ] npm ci 成功
- [ ] package-lock.json 与 package.json 同步
- [ ] 20/20 迁移测试通过
- [ ] migration-guide.md 存在且内容完整

## 关键文件

- `.github/workflows/ci.yml` — CI 矩阵配置
- `CONTRIBUTING.md` — 工程卫生
- `package.json` / `package-lock.json` — 依赖同步
- `commands/migrate.js` — 迁移命令
- `docs/migration-guide.md` — 迁移文档
- `test/runtime/test-migrate.js` — 20 个迁移测试
