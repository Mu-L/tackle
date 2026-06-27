# WP-128-2-verify: 架构与模块化域校验

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

校验 WP-113（harness-build.js 模块化）、WP-115（plugin.json schema 形式化）、WP-119（API 稳定性分类）的成果。

## 校验范围

### WP-113 harness-build.js 模块化
- `plugins/runtime/yaml-parser.js` — YAML 解析器
- `plugins/runtime/plugin-validator.js` — 插件验证器
- `plugins/runtime/settings-merger.js` — 设置合并器
- `plugins/runtime/claude-md-injector.js` — CLAUDE.md 注入器
- `plugins/runtime/harness-build.js` — 代理模式主模块
- `bin/context.js` — CLI 上下文

### WP-115 plugin.json schema 形式化
- `plugins/contracts/plugin-schema.json` — JSON Schema 定义
- `test/runtime/test-wp115-schema.js`

### WP-119 API 稳定性分类
- 所有 `plugins/runtime/*.js` — @public/@internal/@experimental 标注
- 所有 `plugins/contracts/*.js` — 契约接口标注

## 任务清单

- [ ] 验证 harness-build.js 正确代理到拆分模块
- [ ] 验证 yaml-parser 解析 harness-config.yaml 所有字段
- [ ] 验证 settings-merger 本地/全局路径处理
- [ ] 验证 claude-md-injector 幂等注入和标记更新
- [ ] 验证 plugin-schema.json 覆盖所有 plugin.json 字段
- [ ] 运行 test-wp115-schema.js 全部测试通过
- [ ] 验证 23 个核心插件全部通过 schema 验证
- [ ] 检查 API 稳定性标注完整性（WP-119）
- [ ] 检查 bin/context.js 正确创建执行上下文
- [ ] 记录发现的问题

## 验收标准

- [ ] 所有相关测试通过
- [ ] harness-build.js 代理模式完整
- [ ] Schema 覆盖所有字段
- [ ] 23 个核心插件 schema 验证通过
- [ ] API 稳定性标注覆盖公共方法
- [ ] 发现的问题已记录

## 关键文件

- `plugins/runtime/harness-build.js`
- `plugins/runtime/yaml-parser.js`
- `plugins/runtime/plugin-validator.js`
- `plugins/runtime/settings-merger.js`
- `plugins/runtime/claude-md-injector.js`
- `plugins/contracts/plugin-schema.json`
- `bin/context.js`
- `test/runtime/test-wp115-schema.js`
