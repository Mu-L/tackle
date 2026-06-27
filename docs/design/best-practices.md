# 最佳实践

> 面向实际使用场景的 Tackle Harness 实践指南
> 版本: 0.1.2 | 更新: 2026-05-31

本文档提供了使用 Tackle Harness 的最佳实践建议，涵盖项目初始化、配置优化、多项目管理等核心场景。

## 目录

- [项目初始化](#项目初始化)
- [配置优化](#配置优化)
- [多项目管理](#多项目管理)
- [工作流使用](#工作流使用)
- [性能调优](#性能调优)
- [安全最佳实践](#安全最佳实践)
- [团队协作](#团队协作)
- [常见陷阱](#常见陷阱)

---

## 项目初始化

### 推荐方式：全局安装

**全局安装**是推荐的方式，一次安装，所有项目共用。

```bash
# 1. 全局安装 Tackle Harness
npm install -g tackle-harness

# 2. 进入项目目录
cd your-project

# 3. 一键初始化（创建配置目录 + 注册钩子）
tackle-harness init
```

全局安装后，你的项目结构非常简洁：

```
your-project/
  .claude/
    config/
      harness-config.yaml            # 可选的配置文件
    settings.json                    # 自动注册的 hooks
```

技能和钩子由全局安装管理，不再需要本地的 `skills/` 和 `hooks/` 目录。

### 旧项目迁移

如果你之前使用的是本地安装模式（项目中有 `.claude/skills/` 和 `.claude/hooks/` 目录），迁移很简单：

```bash
# 1. 全局安装
npm install -g tackle-harness

# 2. 进入项目目录
cd your-project

# 3. 执行迁移命令
tackle-harness migrate
```

迁移命令会自动：
- 删除本地的 `.claude/skills/` 和 `.claude/hooks/` 目录
- 更新 `.claude/settings.json` 指向全局路径
- 保留你的配置文件（`harness-config.yaml`）

### 验证安装

```bash
# 查看全局安装是否成功
npm list -g tackle-harness

# 检查项目配置是否正确
tackle-harness status

# 验证插件格式
tackle-harness validate
```

### 备选方式：本地安装

如果无法使用全局安装，可以使用 `npx` 方式：

```bash
# 本地安装（不推荐，需要在每个项目中重复安装）
npm install tackle-harness

# 使用时需要加 npx 前缀
npx tackle-harness init
npx tackle-harness build
```

---

## 配置优化

### 环境变量使用

敏感信息应该使用环境变量：

```yaml
# harness-config.yaml

# 不好的做法
mcp:
  servers:
    - name: "github"
      token: "ghp_xxxxxxxxx"  # 硬编码的敏感信息

# 好的做法
mcp:
  servers:
    - name: "github"
      env:
        GITHUB_TOKEN: "${GITHUB_TOKEN}"  # 环境变量
```

### 配置分离

将通用配置和项目特定配置分离：

```yaml
# base-config.yaml (通用配置，可复用)
project:
  version: "1.0.0"

# harness-config.yaml (项目特定配置)
extends: "base-config"
project:
  name: "my-project"
```

### 能力声明配置

在插件的 `plugin.json` 中声明运行时能力：

```json
{
  "name": "my-plugin",
  "type": "provider",
  "sourceType": "npm",
  "capabilities": {
    "filesystem": true,
    "network": { "request": true }
  }
}
```

仅 `sourceType` 为 `npm` 或 `local` 的插件需要声明能力。`core` 插件自动获得全部权限。

### 条件配置

根据环境使用不同配置：

```yaml
development:
  debug: true
  log_level: "debug"

production:
  debug: false
  log_level: "warn"
```

---

## 多项目管理

### 一个全局安装，多个项目

全局安装后，所有项目共用同一套技能和钩子。每个项目只需要自己的配置文件：

```
~/
  .npm/
    global/
      node_modules/
        tackle-harness/           # 全局安装位置
          plugins/
            core/                  # 26 个插件（17 Skill / 5 Provider / 2 Hook / 2 Validator）
          ...

project-a/
  .claude/
    config/
      harness-config.yaml          # 项目 A 的配置
    settings.json

project-b/
  .claude/
    config/
      harness-config.yaml          # 项目 B 的配置
    settings.json
```

### 配置差异管理

不同项目间的配置差异通过 `harness-config.yaml` 管理：

```yaml
# project-a/.claude/config/harness-config.yaml
project:
  name: "Project A"
  context_window:
    enabled: true
    chunk_size: 50

# project-b/.claude/config/harness-config.yaml
project:
  name: "Project B"
  context_window:
    enabled: false
```

### 版本升级和兼容性

```bash
# 升级全局安装
npm update -g tackle-harness

# 检查版本
tackle-harness version

# 验证插件兼容性
tackle-harness validate
```

升级后，所有使用全局安装的项目自动获得新版本，无需逐个更新。

### 跨项目路径支持

全局安装支持 Windows 和 Unix 路径：

```bash
# Windows
tackle-harness build --root D:/path/to/project
tackle-harness build --root D:\path\to\project

# Unix/Mac
tackle-harness build --root /path/to/project
```

---

## 工作流使用

### 选择合适的技能

| 场景 | 推荐技能 | 阶段 |
|------|----------|------|
| 单个任务 | task-creator | P0 |
| 批量任务 | batch-task-creator | P0 |
| 大型需求 | split-work-package | P0 |
| 并行执行 | agent-dispatcher | P2 |
| 质量检查 | checklist | P3 |
| 经验记录 | experience-logger | P3 |
| 完成报告 | completion-report | P4 |

> 完整的场景流程图请参阅 [日常工作流指南](daily-workflow-guide.md)

### 检查点使用

在工作流关键阶段，系统会自动暂停等待你确认：

```
P0 规划 → 🔴 P1 人工审核（强制） → P2 执行
```

通过 `human-checkpoint` 技能，AI 会展示方案，等你确认后才继续。

### 自定义配置

根据项目需求自定义 `harness-config.yaml`：

```yaml
context_window:
  enabled: true
  chunk_size: 50
  overlap: 5

workflow:
  stages:
    - id: "custom-stage"
      name: "自定义阶段"
      skills: ["custom-skill"]
```

---

## 性能调优

### 记忆提取优化

```yaml
memory:
  auto_extraction:
    enabled: true
    min_confidence: 0.8  # 提高阈值减少低质量记忆
    batch_size: 10       # 批处理提高效率
```

### 并行执行优化

```yaml
agent_dispatcher:
  max_concurrent: 4      # 限制并发数（建议 ≤ 4）
  timeout: 300           # 设置超时（秒）
```

### MCP 连接池

```yaml
mcp:
  defaults:
    process_pool_size: 5  # 限制进程数量
    timeout: 30           # 设置超时
```

---

## 安全最佳实践

### 最小权限原则

```yaml
mcp:
  security:
    allowed_commands:
      - "npx"           # 只允许必要的命令
    forbidden_args:
      - "--insecure"    # 禁止不安全参数
```

### 沙箱隔离

Tackle Harness 通过 Worker Thread 沙箱机制隔离外部插件的运行时行为：

- **core 插件**：在主进程中运行，拥有全部权限，无需沙箱
- **npm 插件**：在 Worker Thread 沙箱中运行，能力必须声明
- **local 插件**：在 Worker Thread 沙箱中运行，能力必须声明，额外附加路径审计

沙箱系统由 `sandbox-manager.js` 管理生命周期，`sandbox-worker.js` 执行 Worker 线程逻辑，`sandbox-context.js` 提供受限的上下文代理。

建议在引入第三方插件时，优先检查其 `capabilities` 声明，确认仅请求最小必要权限。

### 能力声明（Capabilities）

每个非 core 插件必须在 `plugin.json` 中声明其运行时能力。系统支持 7 种能力：

| 能力 | 标识 | 风险级别 | 说明 |
|------|------|----------|------|
| 文件读取 | `fs.read` | low_risk | 读取文件系统 |
| 文件写入 | `fs.write` | medium | 修改文件系统 |
| 网络请求 | `net.request` | medium | 发起 HTTP 请求 |
| 网络监听 | `net.listen` | high_risk | 监听网络端口 |
| 子进程 | `child_process` | high_risk | 创建子进程（npm/local 插件禁用） |
| 环境变量 | `env.read` | low_risk | 读取环境变量 |
| 插件访问 | `plugin.access` | low_risk | 跨插件 Provider 访问 |

**最小权限实践**：只声明插件实际需要的能力。例如，一个只读取配置文件的插件只需声明 `fs.read`。

```json
{
  "name": "my-config-reader",
  "capabilities": {
    "filesystem": true
  }
}
```

### 审计日志

系统自动记录所有插件安全相关事件到 JSONL 格式的审计日志文件：

- **日志位置**: `.claude/logs/audit-YYYYMMDD.jsonl`
- **记录事件类型**:
  - `sandbox.create` / `sandbox.terminate` — 沙箱生命周期
  - `plugin.load` — 插件加载（含能力审查）
  - `capability.check` — 运行时能力检查（allow/deny）
  - `capability.violation` — 插件尝试使用未声明的能力

审计日志可用于安全审查和问题排查。日志按天轮转，无需手动清理。

### 敏感信息保护

- 使用环境变量存储敏感信息
- 不要在配置文件中硬编码密码
- 使用 `.gitignore` 排除敏感配置

```
# .gitignore 示例
.claude/config/secrets.yaml
.claude/logs/
.env.local
```

---

## 团队协作

### 配置版本控制

- 所有配置文件应该纳入 Git
- 使用 `.gitignore` 排除敏感信息
- 记录配置变更原因

```bash
# 追踪配置变更
git add .claude/config/harness-config.yaml
git commit -m "docs: 更新项目配置以支持新功能"
```

### 文档同步

- 配置变更时更新文档
- 使用 CHANGELOG.md 记录重要变更
- 保持 README.md 的时效性

### 团队配置统一

使用全局安装确保团队使用同一版本：

```bash
# 团队成员统一执行
npm install -g tackle-harness@0.1.2
```

在项目的 README.md 或 CONTRIBUTING.md 中说明推荐的版本。

---

## 常见陷阱

### 避免的配置错误

1. **循环依赖**: 角色或工作包不应该相互依赖
2. **过度配置**: 不必要的配置会增加复杂性
3. **硬编码路径**: 使用相对路径或环境变量

### 示例

```yaml
# 不好的配置
roles:
  - id: "role-a"
    inherits: "role-b"
  - id: "role-b"
    inherits: "role-a"  # 循环依赖

# 好的配置
roles:
  - id: "role-a"
    inherits: "base"
  - id: "role-b"
    inherits: "base"
```

### 调试技巧

启用调试模式：

```yaml
development:
  debug: true
  verbose: true
  log_level: "debug"
```

查看构建状态：

```bash
tackle-harness status
```

验证配置：

```bash
tackle-harness validate
tackle-harness validate-config
```

### CI/CD 集成

在 CI 环境中使用 Tackle Harness：

```yaml
# GitHub Actions 示例
- name: Setup Tackle Harness
  run: |
    npm install -g tackle-harness
    tackle-harness init --root $GITHUB_WORKSPACE
```

---

## 相关文档

- [日常工作流指南](daily-workflow-guide.md) - 按场景的使用手册
- [配置参考](config-reference.md) - 完整的配置文件说明
- [插件开发](plugin-development.md) - 插件架构和开发指南
