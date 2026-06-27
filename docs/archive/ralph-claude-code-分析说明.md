# Ralph for Claude Code — 多轮自动迭代控制机制分析

> 仓库：https://github.com/frankbria/ralph-claude-code (v0.11.4)
> 核心问题：如何让 Claude Code CLI 在无人值守下反复调用自身，直到任务真正完成，且不陷入死循环 / 不烧光 API 额度？

---

## 一、一句话概括

Ralph 本身**不实现任何 AI**，它是一个 Bash 编写的**外层调度器（orchestrator）**。它把"用户的一次需求"拆成一个**永续循环**，每轮循环干一件事：**用 `claude` CLI 跑一轮，读输出，判断是否该停**。所有"智能"都体现在三点：

1. **如何让 Claude 自己产出可被机器解析的退出信号**（Prompt 约束 + 响应解析）
2. **如何用双重条件保证"说完成 ≠ 真完成"**（双门退出闸门）
3. **如何用熔断器 / 限流 / 会话续接把失控成本封顶**（安全护栏）

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────┐
│  ralph  (bin/ralph, Bash 入口)                            │
│    └─ ralph_loop.sh   ← 核心：while-true 主循环           │
│         │                                                  │
│         ├─ lib/circuit_breaker.sh    熔断器（停滞检测）     │
│         ├─ lib/response_analyzer.sh  解析 Claude 输出       │
│         ├─ lib/date_utils.sh         时间/窗口计算          │
│         ├─ lib/session_manager.sh    --resume 会话续接      │
│         └─ lib/rate_limiter.sh       限流（100次/小时）     │
│                                                            │
│  每个项目本地生成 .ralph/ 工作区：                          │
│    .ralph/PROMPT.md     → 指令模板（含退出信号契约）        │
│    .ralph/fix_plan.md   → 任务拆解清单                      │
│    .ralph/AGENT.md      → 当前 Agent 上下文                 │
│    .ralph/specs/        → 规格文档                          │
│  .ralphrc               → 项目级配置（限流/超时等）         │
└─────────────────────────────────────────────────────────┘
```

工具链依赖：Bash 4.0+ / `jq`（JSON 解析）/ `tmux`（后台会话）/ GNU `timeout`（超时控制）。

---

## 三、主循环（核心算法）

`ralph_loop.sh` 的本质是一段带状态的 `while true`：

```
loop_index = 0
while true:
    1. 熔断器状态检查（CLOSED 放行 / OPEN 拒绝 / HALF_OPEN 试探）
    2. 限流检查（滑动窗口是否超 100 次/小时？超了就 sleep 到下个窗口）
    3. 5 小时 API 上限检查（接近则提示用户 wait/exit）
    4. loop_index += 1
    5. 构造本轮 prompt（注入 .ralph/PROMPT.md + fix_plan + AGENT 上下文）
    6. 调用 claude CLI：
         claude --print --resume <session_id> --output-format json "<prompt>"
       （首屏不 --resume，避免会话劫持；之后续接同一会话）
    7. 把 stdout 存成 JSON，提取 text 字段
    8. response_analyzer 解析这段 text：
         - 统计 completion_indicators（完成指标计数）
         - 检测是否出现 EXIT_SIGNAL: true
         - 计算是否"有进展"（diff/code 变更/测试运行等）
    9. circuit_breaker 根据本轮结果更新状态
    10. 双门退出判断：
          if completion_indicators >= 2  AND  EXIT_SIGNAL == true:
              break   ← 真正退出循环
```

**关键点：单条件不退出。** 只看到"任务完成"的措辞，或只看到 `EXIT_SIGNAL: true`，都不够——必须两者同时满足。这是防 Claude"嘴上说完、手上没干"的核心设计。

---

## 四、如何"指挥"Claude 输出结构化信号

Ralph 的精髓在于：**它把对机器的契约写进 Prompt，让 Claude 的自由文本里携带可解析的标记**。

### 4.1 PROMPT.md 的契约
`.ralph/PROMPT.md`（从 `templates/PROMPT.md` 拷贝）里明确要求 Claude：

- 完成时必须输出 `EXIT_SIGNAL: true`
- 同时陈述完成理由（这些理由会被计为 `completion_indicators`）
- 不得只在测试循环里空转（防 test-only loop）

### 4.2 response_analyzer.sh 做什么
它对 Claude 的 `text` 输出做**多维度打分**（不是简单 grep 一个词）：

| 检测维度 | 作用 |
|---|---|
| `completion_indicators` | 统计"任务完成"类措辞/标记的数量，需 ≥2 才算一个退出门通过 |
| `EXIT_SIGNAL` | 精确匹配显式标记 `true/false` |
| 进展检测 | 是否有代码变更、命令执行、文件操作 → 喂给熔断器判"是否有进展" |
| test-only loop | 只跑测试不改代码的死循环特征 → 触发熔断 |

> 这种"Prompt 契约 + 输出解析"的模式，本质是给 LLM 的自由文本加了一层**轻量协议**，比纯靠语义判断稳得多。

---

## 五、安全护栏：三层防失控

### 5.1 熔断器 `circuit_breaker.sh`
借鉴 Michael Nygard《Release It!》的经典模式，三态状态机：

```
    CLOSED ──(3次无进展 / 5次重复错误)──► OPEN
                                         │ 冷却时间到
                                         ▼
               CLOSED ◄──(试探成功)── HALF_OPEN ──(试探失败)──► OPEN
```

- **CLOSED**：正常每轮调用 Claude
- **OPEN**：拒绝继续调用，等待冷却（避免在烂摊子上烧 token）
- **HALF_OPEN**：冷却后放行**一轮**试探，成功才回 CLOSED，否则重回 OPEN

触发条件：
- 连续 **3 轮无进展**（progress detection 失败）
- 连续 **5 次重复错误**

### 5.2 限流 `rate_limiter.sh`
- 默认 **100 次调用/小时**，按小时窗口重置
- 超限则 sleep 到下个窗口，而不是硬退出

### 5.3 会话续接 `session_manager.sh`
- 首轮**不用** `--resume`（防止 session hijacking）
- 之后每轮用 `claude --resume <session_id>` 续接**同一个会话**，让 Claude 记得前文
- 会话 ID 有 **24 小时过期**检查，过期则开新会话

### 5.4 API 5 小时上限
接近 Anthropic 的 5 小时用量窗口时，提示用户选择 **wait（等恢复）/ exit（退出）**。

---

## 六、双门退出闸门（最关键的一张图）

```
                  Claude 本轮输出
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
   completion_indicators       EXIT_SIGNAL
       >= 2 ?                  == true ?
            │                       │
            └───────────┬───────────┘
                        ▼
                 两者都 true? ──Yes──► 退出循环（任务完成）
                        │
                        No
                        ▼
                 继续下一轮（受熔断器/限流约束）
```

**为什么是 AND 而不是 OR？**
- 只看 completion_indicators：Claude 容易"自夸完成"，假阳性高
- 只看 EXIT_SIGNAL：单个标记易被误触发或漏写
- 双门 AND：要求 Claude **既说出多条完成理由，又显式按下退出键**，大幅降低误退出

---

## 七、运行形态

| 命令 | 作用 |
|---|---|
| `ralph` | 启动主循环 |
| `ralph-monitor` | 实时查看在跑的循环状态 |
| `ralph-setup` | 交互式向导，生成 `.ralph/` + `.ralphrc` |
| `ralph-enable` | 把 Ralph 集成进已有项目 |
| `ralph-import` / `ralph-migrate` | 导入/迁移旧配置 |

主循环跑在 **tmux** 会话里，所以可以断开终端、后台常驻，用 `ralph-monitor` 随时回看。

---

## 八、设计要点小结（可借鉴清单）

1. **协议化 Prompt**：把退出条件写死在给 LLM 的指令里，要求它输出机器可解析的标记。
2. **双门退出（AND）**：单一信号不可信，用多维度同时满足来确认"真完成"。
3. **进展检测驱动熔断**：不只是"出错才停"，**"没进展"也该停**——这是 Ralph 区别于朴素 while 循环的关键。
4. **状态机式熔断**（CLOSED/OPEN/HALF_OPEN）：带冷却和试探恢复，比"出错就死"更鲁棒。
5. **会话续接 + 防劫持**：首轮不复用、24h 过期，兼顾记忆与安全。
6. **限流封顶**：硬性调用次数上限，把最坏情况下的 API 成本锁死。
7. **tmux 后台化 + monitor 工具**：长任务可脱离终端、可观测。
8. **Bash + jq 实现**：零运行时依赖（除几个标准工具），易审计、易移植。

---

## 九、与本项目 `tackle` 的对照提示

`tackle` 当前也在做 agentic loop / watchdog（见近期 commit：`agent-dispatcher idle death-spiral`、`watchdog-multi-window` 等），可直接对照 Ralph 的几个关键点评估：

| Ralph 机制 | tackle 是否已有 / 可借鉴处 |
|---|---|
| 双门退出闸门 | —— |
| 进展检测（progress detection） | `idle death-spiral` 修复方向与此一致，可参考其判据 |
| 三态熔断器（含 HALF_OPEN 试探） | —— |
| Prompt 协议化（要求 LLM 输出结构化标记） | —— |
| 会话续接 + 24h 过期 + 首轮不 resume | —— |
| 硬性调用次数限流 | —— |

（如需要，我可以进一步把 Ralph 的某个具体机制逐行对照到 tackle 的实现代码，给出移植建议。）
