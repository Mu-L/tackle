# WP-121-2-test: Provider 依赖测试

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-121.md`
> - 前置工作包: `docs/wp/WP-121-1-impl.md`（Provider 依赖图补全实现）

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | test |
| **父工作包** | WP-121 |
| **依赖** | WP-121-1-impl |
| **执行角色** | tester |
| **状态** | 📋 待执行 |
| **预估时间** | 15min |

## 职责

编写 Provider 依赖链的单元测试，覆盖简单依赖、多级依赖链、循环依赖检测和 Provider 缺失错误处理。

## 任务清单

### Step 1: 简单 Provider 依赖测试

- [ ] 测试 A provider 依赖 B provider 的场景
- [ ] 验证加载顺序: B 在 A 之前
- [ ] 测试无依赖的独立 provider 加载顺序

### Step 2: 多级 Provider 依赖链测试

- [ ] 测试 A → B → C 三级依赖链的加载顺序
- [ ] 验证加载顺序: C → B → A
- [ ] 测试菱形依赖（A 依赖 B 和 C，B 和 C 都依赖 D）的加载顺序
- [ ] 测试多个 provider 依赖同一 provider 的场景

### Step 3: 循环依赖检测测试

- [ ] 测试 A → B → A 循环依赖的检测
- [ ] 验证循环依赖抛出明确错误
- [ ] 验证错误信息包含循环链路路径
- [ ] 测试三节点循环（A → B → C → A）的检测

### Step 4: Provider 缺失错误处理测试

- [ ] 测试依赖的 provider 不存在时的错误处理
- [ ] 验证错误信息明确指出缺失的 provider 名称
- [ ] 测试 plugin.json 中 dependencies 字段格式错误时的处理
- [ ] 测试空依赖列表时的正常处理

## 关键文件

### 输入（读取）
- `plugins/runtime/plugin-loader.js` — 被测模块
- `docs/wp/WP-121-1-impl.md` — 实现文档（理解接口定义）

### 输出（新建）
- `test/runtime/test-plugin-loader.js` — 新增测试用例（追加到现有文件）

## 验收标准

- [ ] 所有测试用例通过
- [ ] 覆盖简单依赖、多级链、循环检测、缺失处理四类场景
- [ ] 测试不依赖外部环境（使用 mock/stub）
- [ ] 新增测试不破坏现有测试
