# WP-128-5-verify: 工程标准域校验

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

校验 WP-116（跨平台 CI 矩阵）、WP-123（工程卫生）、WP-124（版本迁移路径）、WP-125/126（前序校验成果）的成果。

## 校验范围

### WP-116 CI 矩阵
- `.github/workflows/ci.yml` — 跨平台矩阵配置

### WP-123 工程卫生
- `CONTRIBUTING.md` — 贡献指南
- `package-lock.json` — 锁文件同步

### WP-124 迁移路径
- `commands/migrate.js` — 迁移命令
- `test/runtime/test-migrate.js`

### WP-125/126 前序校验成果
- WP-125 修复项（ajv 依赖、lock 同步、schema 类型）无回归
- WP-126 修复项无回归
- WP-119 状态标记一致性

## 任务清单

- [ ] 验证 CI 矩阵包含 ubuntu/windows/macos + Node 18/20
- [ ] 验证 CI fail-fast: false 配置
- [ ] 验证 CONTRIBUTING.md 内容完整（Node 版本、测试框架、命令）
- [ ] 验证 package-lock.json 与 package.json 同步（npm ci --dry-run）
- [ ] 运行 test-migrate.js 全部测试通过
- [ ] 验证 tackle migrate 升级路径正确
- [ ] 验证 WP-125 修复项无回归（ajv、lock、schema）
- [ ] 验证 WP-126 修复项无回归（plugin_access 键名）
- [ ] 检查 WP-119 状态标记一致性（task.md vs WP 文档）
- [ ] 记录发现的问题

## 验收标准

- [ ] CI 矩阵配置正确
- [ ] CONTRIBUTING.md 完整准确
- [ ] package-lock.json 同步
- [ ] 迁移测试通过
- [ ] 前序修复无回归
- [ ] 发现的问题已记录

## 关键文件

- `.github/workflows/ci.yml`
- `CONTRIBUTING.md`
- `package-lock.json`
- `commands/migrate.js`
- `test/runtime/test-migrate.js`
