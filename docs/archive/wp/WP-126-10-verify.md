# WP-126-10-verify: WP-115 plugin.json Schema 形式化二次校验

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
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 职责

对 WP-115 plugin.json Schema 形式化进行二次校验，确认首次校验修复项（ajv 依赖）未回归，验证 Schema 验证集成正确。

## 任务清单

- [ ] 运行 `node --test test/runtime/test-wp115-schema.js`（14 测试）
- [ ] 确认 WP-125 修复项 1（ajv optionalDependencies 添加）未回归
- [ ] 验证 `plugins/contracts/plugin-schema.json` 存在且格式正确
- [ ] 确认 23 个核心插件全部通过 schema 验证
- [ ] 验证 ajv 不可用时的回退逻辑（内联验证）
- [ ] 检查 optionalDependencies 中 ajv 版本声明（当前 `^8.12.0`）
- [ ] 确认 package-lock.json 与 package.json 同步（WP-125 修复项 2）
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 14/14 测试通过
- [ ] 23 个核心插件全部通过 schema 验证
- [ ] ajv optionalDependencies 存在于 package.json
- [ ] package-lock.json 与 package.json 同步
- [ ] WP-125 修复项 1 和 2 无回归

## 关键文件

- `plugins/contracts/plugin-schema.json`（~3448 字节）
- `plugins/runtime/plugin-validator.js` — schema 验证集成
- `test/runtime/test-wp115-schema.js`（14 测试）
- `package.json` — optionalDependencies
- `package-lock.json` — 依赖同步
