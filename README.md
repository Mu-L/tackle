# Tackle

> 基于插件的 AI Agent 工作流框架，为 Claude Code 提供任务管理、工作流编排、角色管理等能力

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-org/tackle)

通过 npm 安装后，在任何项目中执行一条命令即可获得全部技能。

## 安装

```bash
npm install tackle
```

## 快速开始

```bash
# 进入你的项目目录
cd your-project

# 一键初始化（构建技能 + 注册钩子 + 创建配置目录）
npx tackle init

# 或者分步执行
npx tackle build      # 构建技能到 .claude/skills/，合并 hooks 到 settings.json
npx tackle validate   # 验证插件完整性
```

## 命令一览

| 命令 | 说明 |
|------|------|
| `npx tackle` | 默认执行 build |
| `npx tackle build` | 构建所有技能，更新 .claude/settings.json |
| `npx tackle validate` | 验证插件格式是否正确 |
| `npx tackle init` | 首次安装：build + 创建 .claude/ 目录 |
| `npx tackle --root <path>` | 指定目标项目路径（默认为当前目录） |
| `npx tackle --help` | 查看帮助信息 |

## 构建后的项目结构

执行 `tackle build` 后，你的项目中会生成以下内容：

```
your-project/
  .claude/
    skills/                          # 12 个技能
      skill-task-creator/skill.md
      skill-batch-task-creator/skill.md
      skill-split-work-package/skill.md
      skill-progress-tracker/skill.md
      skill-team-cleanup/skill.md
      skill-human-checkpoint/skill.md
      skill-role-manager/skill.md
      skill-checklist/skill.md
      skill-completion-report/skill.md
      skill-experience-logger/skill.md
      skill-agent-dispatcher/skill.md
      skill-workflow-orchestrator/skill.md
    settings.json                    # 自动注册的 hooks
```

## 技能清单

| 技能 | 触发方式 | 功能 |
|------|----------|------|
| task-creator | "创建任务"、"新建任务"、"添加任务" | 创建单个任务到任务列表 |
| batch-task-creator | "批量创建任务"、"批量新建任务" | 批量创建多个任务 |
| split-work-package | "拆分工作包"、"创建工作包" | 将需求拆分为可执行的工作包 |
| progress-tracker | "记录进度"、"查看进度" | 追踪和汇报工作进度 |
| team-cleanup | 清理孤立的 agent 团队 | 释放残留的团队资源 |
| human-checkpoint | 到达关键决策点时触发 | 暂停并请求人工确认 |
| role-manager | "查看角色"、"角色管理" | 管理项目角色定义 |
| checklist | "运行检查"、"执行清单" | 执行检查清单 |
| completion-report | 完成工作包时生成 | 生成完成报告 |
| experience-logger | "总结经验"、"记录经验" | 记录项目经验教训 |
| agent-dispatcher | "批量执行"、"并行执行" | 调度多个子代理并行工作 |
| workflow-orchestrator | "开始工作流"、"执行完整流程" | 编排完整工作流 |

## AI 工作流指南

> 详细的架构与工作流文档请参阅 [docs/ai_workflow.md](docs/ai_workflow.md)

### 端到端数据流

用户需求经五个阶段完成从规划到交付的完整生命周期：

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户需求  │───▶│  P0: 规划    │───▶│  P1: 审核    │───▶│  P2: 执行    │───▶│ P3: 检查交付 │
│  (自然语言) │    │  task-creator│    │  human-      │    │  agent-      │    │  checklist   │
│            │    │  split-wp    │    │  checkpoint  │    │  dispatcher  │    │  exp-logger  │
└──────────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
                       │                   │                   │                   │
                       ▼                   ▼                   ▼                   ▼
               ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
               │ docs/wp/*.md │    │ 用户确认/修改 │    │ Agent Teams  │    │ 完成报告     │
               │ task.md 更新  │    │ (人工介入)    │    │ (多代理并行)  │    │ 经验沉淀     │
               └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                          │
                                                                          ▼
                                                                  ┌──────────────┐
                                                                  │ P4: 汇报询问 │
                                                                  │ completion   │
                                                                  │ -report      │
                                                                  └──────────────┘
```

### 核心流程说明

| 阶段 | 目的 | 说明 |
|------|------|------|
| **P0 规划** | 需求解析与工作包拆分 | AI 解析用户需求，评估复杂度（5 维矩阵），自动拆分为工作包并写入 `docs/wp/` |
| **P1 审核** | 人工确认（强制暂停） | 输出审核清单，等待用户确认或修改，确保规划符合预期后才进入执行 |
| **P2 执行** | 多代理并行实现 | Lead Agent 创建团队，按角色分配任务，Teamee 自主认领并执行，支持依赖图调度 |
| **P3 检查** | 质量验证与经验提炼 | 执行 5 类质量检查（代码/测试/文档/Git/经验），记录经验到角色专属库 |
| **P4 汇报** | 交付报告与决策 | 生成标准化完成报告，询问用户下一步（继续/新任务/结束） |

工作包按 **impl → test → verify → review** 四阶段模式执行。每个阶段完成后状态自动流转，失败时可回退到上一阶段重新处理。

### 核心技能

工作流由以下技能驱动，通过触发词或阶段自动激活：

| 技能 | 阶段 | 核心作用 |
|------|------|----------|
| **workflow-orchestrator** | 全程 | 编排完整工作流，管理阶段转换 |
| **task-creator** | P0 | 解析需求、评估复杂度、创建任务 |
| **split-work-package** | P0 | 将需求拆分为可执行的工作包 |
| **human-checkpoint** | P1 | 强制暂停等待人工确认 |
| **agent-dispatcher** | P2 | 调度多代理并行执行，管理角色分配与记忆注入 |
| **checklist** | P3 | 执行 5 类质量检查 |
| **experience-logger** | P3 | 提炼经验并写入角色专属库，实现角色进化 |
| **completion-report** | P4 | 生成标准化完成报告 |

## 插件架构

Tackle 包含四类插件，共 18 个：

| 类型 | 数量 | 作用 |
|------|------|------|
| Skill | 12 | 可执行技能，Claude Code 直接调用 |
| Provider | 3 | 状态存储、角色注册、记忆存储 |
| Hook | 1 | 技能门控，拦截编辑操作和技能调用 |
| Validator | 2 | 文档同步验证、工作包验证 |

### 依赖关系

```
Skill 层（依赖 Provider）
  skill-task-creator ────→ provider:state-store
  skill-batch-task-creator → provider:state-store
  skill-split-work-package → provider:state-store
  skill-completion-report → provider:state-store
  skill-role-manager ────→ provider:role-registry
  skill-agent-dispatcher → provider:role-registry, provider:memory-store
  skill-experience-logger → provider:memory-store
  其他 skill ────────────→ 无外部依赖

Hook 层（依赖 Provider）
  hook-skill-gate ───────→ provider:state-store

Provider 层（无依赖）
  provider-state-store
  provider-role-registry
  provider-memory-store

Validator 层（无依赖）
  validator-doc-sync
  validator-work-package
```

## 项目源码结构

```
plugins/
├── contracts/               # 插件接口契约
│   └── plugin-interface.js  # Plugin 基类定义
├── core/                    # 核心插件（18 个）
├── external/                # 外部插件（第三方扩展）
├── runtime/                 # 运行时模块（加载器、事件总线、构建工具等）
└── plugin-registry.json     # 插件注册表

docs/
├── wp/                      # 工作包文档 (WP-001 ~ WP-021)
├── plugin-development.md    # 插件开发指南
├── migration-to-v3.md       # v3 迁移指南
├── config-reference.md      # 配置参考
├── best-practices.md        # 最佳实践
└── tools-ecosystem.md       # 工具生态

task.md                      # 任务清单主索引
```

## 常见问题

### 安装后技能没有生效？

确保在项目根目录执行了 `npx tackle build`，并且 `.claude/skills/` 目录下有 12 个技能文件夹。

### 多个项目能否共用？

每个项目独立安装、独立构建。不同项目可以安装不同版本。

### 全局安装

```bash
npm install -g tackle
tackle build
```

全局安装后直接使用 `tackle` 命令，无需 `npx`。

### 如何卸载？

```bash
npm uninstall tackle
```

技能文件会保留在 `.claude/skills/` 中，如需清理请手动删除。

### settings.json 中的 hooks 是什么？

`tackle build` 会自动向 `.claude/settings.json` 注入两个 hook：
- `PreToolUse(Edit|Write)` — 在特定状态下阻止文件编辑
- `PostToolUse(Skill)` — 技能调用后更新状态

这些 hook 指向 `node_modules/tackle/` 中的脚本，不会影响你项目中的其他配置。已有的 settings.json 内容会被保留，仅追加 tackle 相关的 hooks。

## 文档

- [配置参考](docs/config-reference.md) - 完整的配置文件说明
- [最佳实践](docs/best-practices.md) - 使用建议和优化技巧

## 贡献

欢迎贡献！我们接受 Bug 报告、功能建议、代码提交和文档改进。详见 [贡献指南](CONTRIBUTING.md)。

快速上手：Fork → 创建分支 → 修改 → 提交 PR。Commit 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

本项目借鉴了以下开源项目的优秀设计：
- DeerFlow - 记忆提取和中间件架构
- Model Context Protocol - 工具集成标准
