# WP-128-4-verify: 测试与质量域校验

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

校验 WP-114（3 模块测试补全）、WP-118（E2E 测试套件）、WP-122（覆盖率基线 + CI 门槛）的成果。

## 校验范围

### WP-114 测试补全
- `test/runtime/test-validator-pipeline.js`
- `test/runtime/test-hook-dispatcher.js`
- `test/runtime/test-manifest-resolver.js`
- `test/runtime/test-skill-structure.js`

### WP-118 E2E 测试
- `test/e2e/test-init-build-validate.js`

### WP-122 覆盖率基线
- `package.json` — test:coverage 脚本
- `.github/workflows/ci.yml` — coverage job

## 任务清单

- [ ] 运行 test-validator-pipeline.js 全部测试通过
- [ ] 运行 test-hook-dispatcher.js 全部测试通过
- [ ] 运行 test-manifest-resolver.js 全部测试通过
- [ ] 运行 test-skill-structure.js 全部测试通过
- [ ] 运行 test/e2e/test-init-build-validate.js 全部测试通过
- [ ] 验证 E2E 覆盖 init→build→validate 完整流程
- [ ] 验证 E2E 覆盖 global/local 两种模式
- [ ] 验证 package.json test:coverage 脚本存在且正确
- [ ] 验证 CI coverage 70% 门槛配置
- [ ] 运行 npm run test:coverage 确认覆盖率 ≥70%
- [ ] 记录发现的问题

## 验收标准

- [ ] 所有相关测试通过
- [ ] E2E 覆盖两种安装模式
- [ ] 覆盖率 ≥70%
- [ ] CI 覆盖率门槛配置正确
- [ ] 发现的问题已记录

## 关键文件

- `test/runtime/test-validator-pipeline.js`
- `test/runtime/test-hook-dispatcher.js`
- `test/runtime/test-manifest-resolver.js`
- `test/runtime/test-skill-structure.js`
- `test/e2e/test-init-build-validate.js`
- `package.json`
- `.github/workflows/ci.yml`
