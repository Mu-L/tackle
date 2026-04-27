# Tackle Harness 常用工作流演示

本文档展示使用 tackle-harness 进行 AI Agent 工作流编排的常见场景。

## 工作流 1: 需求到实现（标准流程）

```
用户需求 → task-creator → human-checkpoint → agent-dispatcher → checklist → completion-report
```

### 步骤

1. **创建工作包**：使用 `task-creator` 将需求拆分为结构化工作包
   ```
   /skill-task-creator
   ```
   输入需求描述，技能会生成包含任务列表、验收标准、测试用例的工作包文档。

2. **人工审核**：使用 `human-checkpoint` 在关键决策点暂停等待确认
   ```
   /skill-human-checkpoint
   ```
   审核工作包定义，确认或调整方案。

3. **批量执行**：使用 `agent-dispatcher` 并行调度子代理执行各子任务
   ```
   /skill-agent-dispatcher
   ```
   每个工作包对应一个独立子代理，1:1 绑定。

4. **质量检查**：使用 `checklist` 验证实现结果
   ```
   /skill-checklist
   ```
   对照验收标准逐项检查。

5. **完成汇报**：使用 `completion-report` 生成工作总结
   ```
   /skill-completion-report
   ```

## 工作流 2: 大型任务拆分

```
大需求 → split-work-package → 多个工作包 → agent-dispatcher → completion-report
```

### 步骤

1. **拆分工作包**：使用 `split-work-package` 将大型任务分解
   ```
   /skill-split-work-package
   ```
   自动生成多个独立工作包文档，每个可独立分配执行。

2. **调度执行**：使用 `agent-dispatcher` 并行处理多个工作包

3. **汇总报告**：使用 `completion-report` 合并所有工作包的结果

## 工作流 3: 快速修复

```
Bug 描述 → task-creator (quick mode) → 实现 → checklist
```

适用于小范围修复，跳过完整审核流程。

## 工作包目录约定

```
docs/wp/
├── WP-001.md          # 工作包定义文档
├── WP-002.md
└── ...
```

每个工作包文件包含：
- **状态节**：代码状态、测试状态、依赖关系
- **任务列表表**：任务 ID、名称、预估时间、测试数、状态
- **任务详情**：实现内容（checkbox）、验收标准、测试用例
