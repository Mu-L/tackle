# WP-069-3-impl: 批量控制逻辑校验

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-069.md`
> - 包含: 背景、依赖关系、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | 校验 (impl) |
| **父工作包** | WP-069 |
| **依赖** | 无 |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

校验 `plugins/core/skill-agent-dispatcher/skill.md` 中批量控制逻辑的完整性和正确性。

## 校验要点

### 1. 批量控制参数
- [ ] max_batch_size 默认值为 5
- [ ] 支持通过配置覆盖：`get_config("agent_dispatcher.concurrency")`
- [ ] 参数在状态文件初始化时写入

### 2. 分批逻辑
- [ ] 收集 unblocked 任务后按 max_batch_size 切分
- [ ] 当前批次有活跃任务时不创建新批次
- [ ] 超出部分正确写入 pending_batches
- [ ] 分批不改变任务的执行顺序

### 3. 自动加载机制
- [ ] 当前批次全部完成后触发自动加载
- [ ] 从 pending_batches 加载下一批任务
- [ ] 加载后更新状态文件保存批次进度
- [ ] pending_batches 为空时正确终止

### 4. 状态管理
- [ ] current_batch 在创建 teamee 后正确更新
- [ ] teamee 销毁后从 current_batch 移除
- [ ] pending_batches 的增删操作正确
- [ ] 状态文件中批次信息与实际一致

## 任务清单

- [ ] 读取 skill.md 中批量控制相关代码段（约 410-423 行分批逻辑、645-668 行自动加载）
- [ ] 校验 max_batch_size 参数定义和配置覆盖
- [ ] 模拟分批场景：5/10/13 个任务，验证切分正确性
- [ ] 校验自动加载的触发条件和加载逻辑
- [ ] 追踪批次状态在状态文件中的读写
- [ ] 生成校验报告

## 验收标准

- [ ] 所有校验要点已检查并标注 PASS/FAIL
- [ ] 校验报告已写入 `docs/reports/wp-069-3-batch-control-verification.md`
- [ ] 报告包含每个检查项的结论和证据

## 关键文件

- `plugins/core/skill-agent-dispatcher/skill.md` — 核心校验对象
- `docs/wp/WP-068.md` — 参考文档
- `docs/wp/WP-068-1-impl.md` — 实现工作包（了解预期交付物）
