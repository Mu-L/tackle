# WP-069-5-verify: 构建与测试回归验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-069.md`
> - 包含: 背景、依赖关系、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | 验证 (verify) |
| **父工作包** | WP-069 |
| **依赖** | WP-069-1, WP-069-2, WP-069-3, WP-069-4 |
| **执行角色** | tester |
| **状态** | 📋 待执行 |

## 职责

实际运行构建和测试命令，验证 WP-068 的修改未引入回归。

## 校验要点

### 1. 构建验证
- [ ] `node bin/tackle.js build` 成功，无错误
- [ ] 构建输出 23 个插件，0 error
- [ ] 构建输出包含 WP-068 新增的状态持久化内容

### 2. 格式验证
- [ ] `node bin/tackle.js validate` 通过
- [ ] 0 错误 0 警告

### 3. 测试回归
- [ ] `node --test test/**/*.js` 全部通过
- [ ] 测试数量与基线一致（164 个测试）
- [ ] 无新增失败或跳过的测试

### 4. 构建输出完整性
- [ ] `.claude/skills/skill-agent-dispatcher.md` 包含状态持久化逻辑
- [ ] `.claude/skills/skill-agent-dispatcher.md` 包含恢复协议章节
- [ ] `.claude/skills/skill-agent-dispatcher.md` 包含批量控制参数
- [ ] Watchdog 配置文件已正确传播

## 任务清单

- [ ] 运行 `node bin/tackle.js build`，记录输出
- [ ] 运行 `node bin/tackle.js validate`，记录结果
- [ ] 运行 `node --test test/**/*.js`，记录测试结果
- [ ] 检查构建输出文件中 WP-068 新增内容的存在性
- [ ] 生成校验报告

## 验收标准

- [ ] 构建成功，无错误
- [ ] 验证通过，0 错误 0 警告
- [ ] 全部测试通过，数量与基线一致
- [ ] 校验报告已写入 `docs/reports/wp-069-5-build-test-verification.md`

## 关键文件

- `bin/tackle.js` — CLI 入口
- `plugins/core/skill-agent-dispatcher/skill.md` — 源文件
- `plugins/core/provider-watchdog/assets/daemon-config.template.json` — 配置模板
- `.claude/skills/` — 构建输出目录
