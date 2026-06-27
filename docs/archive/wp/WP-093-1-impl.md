# WP-093-1-impl: TypeScript 类型定义 - 核心类型实现

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-093.md`

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl |
| **父工作包** | WP-093 |
| **依赖** | 无 |
| **执行角色** | implementer |
| **状态** | 📋 待执行 |

## 职责

创建 TypeScript 类型声明文件，覆盖 67 个公共 API。

## 任务清单

- [ ] 创建 `types/` 目录
- [ ] 编写 `types/plugin-interface.d.ts`
- [ ] 编写 `types/event-bus.d.ts`
- [ ] 编写 `types/state-store.d.ts`
- [ ] 编写 `types/config-manager.d.ts`
- [ ] 编写 `types/plugin-loader.d.ts`
- [ ] 编写 `types/logger.d.ts`
- [ ] 编写 `types/harness-build.d.ts`
- [ ] 编写 `types/manifest-resolver.d.ts`
- [ ] 编写 `types/validator-pipeline.d.ts`
- [ ] 编写 `types/hook-dispatcher.d.ts`
- [ ] 编写 `types/index.d.ts` 统一导出
- [ ] 更新 `package.json` 增加 types 字段

## 验收标准

- [ ] 67 公共 API 有类型声明
- [ ] 类型文件结构清晰
- [ ] package.json 包含 types 字段

## 关键文件

- `types/*.d.ts` — 新建 11 个文件
- `package.json` — 更新
