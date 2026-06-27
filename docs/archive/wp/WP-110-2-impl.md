# WP-110-2-impl: 质量体系与 CI/CD 可行性分析

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-110.md`
> - 包含: 背景、目标、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | impl（分析） |
| **父工作包** | WP-110 |
| **依赖** | 无 |
| **执行角色** | tester |
| **状态** | ✅ 完成 |

## 职责

评估 roadmap 提出的质量体系建设路径和 CI/CD 改进方案的可行性。

## 分析维度

### 1. 现有测试覆盖盲区

- 检查 `test/` 目录结构，评估当前 295 个测试的覆盖范围
- 识别哪些运行时模块缺少测试
- 评估测试计数不一致问题（不同报告引用 164/215/295）的根因

### 2. E2E 测试建立难度

- 评估在零外部依赖策略下建立 E2E 测试的技术路径
- Node.js 内置 test runner 对 E2E 的支持程度
- 需要模拟哪些外部依赖（Claude Code CLI、文件系统、进程间通信）

### 3. 覆盖率测量实现

- 零依赖策略下如何实现覆盖率测量（Node.js 内置？自建工具？）
- 关键模块 80%+ 覆盖率目标的可达性
- 覆盖率与 CI 集成的实现方式

### 4. CI 质量关卡落地

- 评估 L1-L5 质量金字塔在当前 CI 中的实现差距
- CI 关卡（schema 验证、测试通过、覆盖率门槛）的技术实现难度
- 质量关卡对开发流程的影响评估

### 5. 跨平台 CI 矩阵

- 当前 Windows 开发 + Linux CI 的兼容性风险
- 扩展到 Windows + Linux、Node 18 + 20 矩阵的成本
- GitHub Actions 的能力和限制

### 6. 测试基础设施健康度

- 测试框架选型（Node.js 内置 test）是否满足长期需求
- 测试工具链（assert、mock）是否完备
- 测试运行性能和可靠性

## 任务清单

- [ ] 读取 `test/` 目录结构，评估测试覆盖范围
- [ ] 读取 `.github/workflows/ci.yml`，评估 CI 配置
- [ ] 读取 `package.json` scripts，评估测试命令
- [ ] 检查关键运行时模块的测试对应关系
- [ ] 对照 roadmap 质量金字塔逐层评估可行性
- [ ] 输出质量体系可行性分析结论

## 验收标准

- [ ] 每个质量维度有明确的可行性判断
- [ ] 识别出测试覆盖的关键盲区
- [ ] 评估 E2E 测试的实现路径和难度
- [ ] 给出质量体系建设的风险等级评估

## 关键文件

- `test/` 目录（所有测试文件）
- `.github/workflows/ci.yml`
- `package.json`（scripts 和依赖配置）
- `plugins/runtime/*.js`（需验证测试覆盖的运行时模块）
- `docs/reports/report-2026-05-29-harness-roadmap.md`

---

## 分析结论

> 分析基于代码事实，验证时间 2026-05-29。Node.js v24.15.0，295 个测试全部通过，CI 运行于 ubuntu-latest + Node 18/20 矩阵。

### 1. 现有测试覆盖盲区 — 判断: 关键盲区存在

**测试计数确认**: 实际运行 `node --test test/**/*.js` 结果为 295 个测试、52 个 suite、0 失败，验证了 roadmap 引用的 295 数字。roadmap 附录声称"295 个, 3,985 行"，实际 `wc -l` 显示测试文件总行数 5,400 行（包含 `test-global-install.js` 499 行和 `wp-046-global-refactor-test.js` 761 行两个 roadmap 附录未统计的文件）。

**运行时模块 vs 测试对应关系**:

| 运行时模块 | 行数 | 专属测试文件 | 行覆盖率 | 函数覆盖率 | 分支覆盖率 |
|------------|------|------------|---------|-----------|-----------|
| `harness-build.js` | 1,546 | `test-harness-build.js` | 62.61% | 58.54% | 57.55% |
| `config-validator.js` | 582 | **无** | 73.88% | 77.78% | 42.11% |
| `plugin-loader.js` | 533 | `test-plugin-loader.js` | 88.37% | 77.27% | 65.52% |
| `validator-pipeline.js` | 467 | **无** | 33.83% | 0.00% | 100.00%* |
| `config-manager.js` | 306 | `test-config-manager.js` | 96.41% | 100.00% | 88.46% |
| `hook-dispatcher.js` | 309 | **无**（有手动脚本） | 38.19% | 0.00% | 100.00%* |
| `manifest-resolver.js` | 270 | **无**（间接覆盖） | 47.41% | 50.00% | 33.33% |
| `state-store.js` | 375 | `test-state-store.js` | 89.60% | 95.45% | 84.91% |
| `event-bus.js` | 195 | `test-event-bus.js` | 98.97% | 93.75% | 100.00% |
| `logger.js` | 174 | `test-logger.js` | 98.85% | 82.35% | 92.68% |
| `resolve-plugin-path.js` | 161 | `test-resolve-plugin-path.js` | 96.89% | 100.00% | 87.50% |

> *注: `validator-pipeline.js` 和 `hook-dispatcher.js` 分支 100% 是因为没有通过任何测试触达分支代码，统计的是被覆盖代码中的分支。

**关键盲区**（按严重程度排序）:

1. **`validator-pipeline.js` (467 行, 行覆盖 33.83%, 函数覆盖 0%)** — 最严重的盲区。此模块负责验证器编排，是 `tackle validate` 命令的核心，但没有任何测试直接导入或测试它。仅有 `test-harness-build.js` 通过构建流程间接覆盖了部分代码。

2. **`hook-dispatcher.js` (309 行, 行覆盖 38.19%, 函数覆盖 0%)** — Hook 事件分发器。`test/test-hook-dispatcher.js` 存在但它是一个手动执行脚本（不使用 `node:test`，使用 `console.log` 输出），不在 `test/**/*.js` glob 中被 CI 收集。

3. **`manifest-resolver.js` (270 行, 行覆盖 47.41%, 函数覆盖 50%)** — 项目级覆盖、启用/禁用逻辑。`test-global-install.js` 和 `wp-046-global-refactor-test.js` 间接测试了部分功能，但无专门测试文件。

4. **`harness-build.js` (1,546 行, 行覆盖 62.61%)** — 最大单体模块。虽有专门测试文件，但 1,546 行中近 600 行未被覆盖，大量构建路径（YAML 解析、Settings 合并、CLAUDE.md 注入）缺少测试。

5. **`config-validator.js` (582 行, 行覆盖 73.88%, 分支覆盖 42.11%)** — 无专属测试文件，分支覆盖率极低，意味着大量校验规则路径从未被验证。

### 2. E2E 测试建立难度 — 判断: 有条件可行

**技术路径**: 基于 `node:test` + `child_process.execSync` + `os.tmpdir()` 建立 E2E 测试。每个测试用例创建独立临时目录，执行完整的 `tackle` CLI 命令链，验证文件系统输出。

**难度评估**: 中等偏低

**理由**:
- **CLI 是纯文件系统操作** — `tackle build` 的输出是 `.claude/skills/` 和 `.claude/hooks/` 目录中的文件，无需启动服务器或网络交互，E2E 测试的隔离成本很低
- **已有模式可复用** — `test/integration/test-build-pipeline.js` (341 行) 已使用 `createTestProject()` + `os.tmpdir()` 模式，E2E 只需扩展此模式到 CLI 子进程调用
- **Node.js 内置 `child_process`** — 可直接 `execSync('node bin/tackle.js build')` 执行命令并检查退出码和 stdout

**主要挑战**:
1. **全局安装模式测试** — `tackle` 在全局安装时路径解析不同（依赖 `npm root -g`），E2E 测试需要模拟全局安装环境，复杂度较高
2. **外部插件 E2E** — 需要从本地路径加载外部插件（`sourceType: 'local'`），涉及 `npm link` 或目录引用，跨平台行为可能不一致
3. **测试隔离** — `tackle init` 会修改项目目录（创建 `.claude/` 结构），测试间必须完全隔离，每个用例需 `before()` 创建 + `after()` 清理

**建议实现路径**: 先实现本地模式的 `init → build → validate` 标准工作流 E2E（约 6-8 个用例，预估 45min），暂不覆盖全局安装模式。

### 3. 覆盖率测量实现 — 判断: 可行（零额外依赖）

**关键发现**: Node.js 内置 `--experimental-test-coverage` 标志已提供行/分支/函数覆盖率报告。实测结果（运行时测试 280 个用例，不含集成测试）:

```
all files | line 70.48% | branch 71.74% | funcs 67.93%
```

**具体数据**:
- 超过 80% 行覆盖率的模块: `config-manager` (96.41%), `resolve-plugin-path` (96.89%), `event-bus` (98.97%), `logger` (98.85%), `plugin-loader` (88.37%), `state-store` (89.60%)
- 低于 80% 行覆盖率的模块: `harness-build` (62.61%), `config-validator` (73.88%), `manifest-resolver` (47.41%), `validator-pipeline` (33.83%), `hook-dispatcher` (38.19%)

**实现路径**:
1. `package.json` 新增 `"test:coverage": "node --experimental-test-coverage --test test/**/*.js"` 脚本 — 零依赖
2. CI 中添加覆盖率报告步骤 — 在 `npm test` 后运行 `npm run test:coverage`
3. 设置增量门槛 — 使用 `--test-coverage-lines=70`（当前基线 70.48%）作为 CI 门槛

**限制**:
- `--experimental-test-coverage` 不输出 HTML 报告或 LCOV 格式，只有终端表格输出
- 无法集成到 GitHub Actions 的 Coverage 摘要（无 badge 能力）
- 标志名含 `experimental`，虽从 Node 18 起已稳定可用，但语义上可能引起顾虑

**替代方案**: 如需 HTML/LCOV 报告，可引入 `c8`（约 40 个依赖）或 Node.js 原生的 `NODE_V8_COVERAGE` 环境变量 + 自建报告解析器。但在零依赖策略下，内置 `--experimental-test-coverage` 已足够满足"建立覆盖率基线"的目标。

### 4. CI 质量关卡落地（L1-L5 金字塔）— 判断: 有条件可行

**当前 CI 状态** (`ci.yml`):

| 步骤 | 命令 | 对应层级 | 状态 |
|------|------|---------|------|
| Install | `npm install` | — | 已有 |
| Validate | `npm run validate` | L1 契约验证 | 已有 |
| Build | `npm run build` | L3 集成 | 已有 |
| Test | `npm test` | L2 单元 | 已有 |

**各层级差距**:

- **L1 契约验证** — 当前 `tackle validate` 已覆盖 `plugin.json` 格式校验。Roadmap 提出的 JSON Schema 形式化是加强方向。**差距小，可快速落地**。

- **L2 单元测试** — 295 个测试已有。差距在覆盖率门槛（当前未设置）和增量保护。**需新增覆盖率报告步骤和门槛配置**。

- **L3 集成测试** — 2 个集成测试文件存在（`test-build-pipeline.js` 341 行 + `test-plugin-lifecycle.js` 478 行）。差距在外部插件生命周期和跨平台路径。**中等差距**。

- **L4 E2E 测试** — 完全缺失。需从零建立。**大差距，但难度中等偏低**（见维度 2 分析）。

- **L5 质量关卡** — 当前 CI 无发布门控。需添加: (a) PR 须通过 validate + build + test（已有，只需确保 branch protection 启用）; (b) 发布须通过 E2E + lock 同步 + CHANGELOG 检查（需新建 `release.yml` 工作流）。**中等差距**。

**落地优先级建议**:
1. **P0**: 启用 GitHub branch protection，要求 PR 通过 CI — 成本 5min，零代码
2. **P1**: 添加覆盖率报告到 CI — 成本 15min，新增一个 CI 步骤
3. **P2**: 建立首批 E2E 测试 — 成本 45min，新建 `test/e2e/` 目录
4. **P3**: 发布工作流自动化 — 成本 30min，新建 `.github/workflows/release.yml`

### 5. 跨平台 CI 矩阵 — 判断: 可行，但需注意测试兼容性

**当前状态**: CI 仅 `ubuntu-latest`。开发者使用 Windows。这构成系统性风险: 路径差异（`\` vs `/`）、`os.tmpdir()` 返回值不同、`npm install` 行为差异。

**Roadmap 目标**: `ubuntu-latest` + `windows-latest`，Node 18 + 20。

**可行性评估**:

1. **路径处理已部分统一** — `resolve-plugin-path.js` 已使用 `path.join()` 而非硬编码分隔符，这是正确的跨平台实践
2. **GitHub Actions 支持 Windows 矩阵** — 只需在 `ci.yml` 的 `strategy.matrix` 添加 `os: [ubuntu-latest, windows-latest]`
3. **潜在风险点**:
   - `test-global-install.js` 中有 "Cross-platform path compatibility (Windows backslash handling)" 测试，说明路径差异已被关注
   - `wp-046-global-refactor-test.js` 涉及 `packageRoot` 推导，在不同平台可能有不同结果
   - `harness-build.js` 中的 CLAUDE.md 注入涉及文件路径拼接，需验证 Windows 兼容性

**实施成本**: ~15min 修改 CI 配置，但需额外 ~30min 排查和修复 Windows 特有的测试失败（如有）。

**风险等级**: 低。大部分代码已使用 Node.js `path` 模块，且 `resolve-plugin-path.js` 专门处理了跨平台路径问题。主要风险在 CLI 命令调用和 `npm` 子进程交互。

### 6. 测试基础设施健康度 — 判断: 健康，满足当前需求

**测试框架**: Node.js 内置 `node:test` + `node:assert`

**优势**:
- 零外部依赖，与项目"零依赖"策略一致
- 支持 `test.describe`、`test.skip`、`test.todo` 等标准功能
- 支持 `before`/`after`/`beforeEach`/`afterEach` 生命周期钩子
- 内置覆盖率报告（`--experimental-test-coverage`）
- 测试发现支持 glob 模式（`node --test test/**/*.js`）

**不足**:
- **无 mock/spy 框架** — 测试中使用手动 Mock 类（如 `test-plugin-loader.js` 中的 `MockEventBus`、`MockLogger`），增加了测试样板代码。但 Node.js 20+ 已有 `test.mock` 功能
- **无 snapshot 测试** — Skill 输出的 markdown 无法使用 snapshot 对比，需手动断言
- **无并行测试控制** — `node --test` 默认并行执行，某些文件系统测试可能存在竞争（当前测试用 `os.tmpdir()` + 唯一目录名隔离，实际未观察到问题）

**长期评估**: `node:test` 可满足项目到 v1.0 的测试需求。当项目引入 TypeScript 后（roadmap 阶段 II），`node:test` 仍可工作（通过 `--import tsx` 或编译后测试）。无需迁移到 Jest/Vitest。

### 总体风险等级评估

| 质量维度 | 可行性 | 风险等级 | 关键风险 |
|---------|--------|---------|---------|
| 测试覆盖盲区 | 已识别，需补充 | **中** — 3 个模块零专属测试，1 个模块行覆盖低于 40% |
| E2E 测试 | 有条件可行 | **低** — CLI 纯文件系统操作，隔离成本低 |
| 覆盖率测量 | 可行 | **低** — Node.js 内置支持，零额外依赖 |
| CI 质量关卡 | 有条件可行 | **中** — L4 E2E 缺失是最大差距，L1-L3 基础已存在 |
| 跨平台 CI | 可行 | **低** — 路径处理已部分统一，GitHub Actions 原生支持 |
| 测试基础设施 | 健康 | **低** — node:test 满足需求，无需迁移 |

**整体判断**: Roadmap 质量体系建设路径**整体可行**。最大的差距不是技术障碍，而是工程优先级: 3 个运行时模块（`validator-pipeline`、`hook-dispatcher`、`manifest-resolver`）完全没有专属测试，1,358 行代码仅靠间接覆盖。建议在阶段 I 优先为这三个模块补充单元测试（预估 90min），将整体行覆盖率从 70.48% 提升到 80%+ 的 roadmap 目标。
