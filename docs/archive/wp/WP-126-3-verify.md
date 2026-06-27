# WP-126-3-verify: WP-112 × WP-117 安全+沙箱集成交叉验证

## 🤖 Subagent 读取指令

> **重要**: 执行此任务前，请先阅读父工作包文档获取完整上下文：
> - 父工作包: `docs/wp/WP-126.md`
> - 包含: 问题分析、实施计划、关键文件、验收标准

## 基本信息

| 属性 | 值 |
|------|-----|
| **类型** | verify |
| **父工作包** | WP-126 |
| **依赖** | WP-126-1-verify, WP-126-2-verify |
| **执行角色** | tester |
| **预估时间** | 15min |
| **状态** | 📋 待执行 |

## 职责

验证 WP-112 安全机制与 WP-117 沙箱系统的集成点，确认安全链路在跨 WP 交叉场景下正确工作。这是二次校验的新增项，WP-125 未覆盖。

## 任务清单

- [ ] 验证安全完整链路：install confirm → capabilities validate → sandbox enforce
- [ ] 确认外部插件安装时 confirmInstall() 与 capabilities 校验的联动
- [ ] 确认 sandbox-manager 是否正确读取 capabilities 声明
- [ ] 检查 WP-125 未覆盖的交叉路径
- [ ] 验证以下集成场景：
  - core 插件 → 跳过 confirm → 高信任沙箱
  - npm 插件 → confirm 确认 → 中信任沙箱
  - local 插件 → confirm 确认 → 低信任沙箱
- [ ] 记录发现的任何问题

## 验收标准

- [ ] 安全链路完整：install confirm → capabilities validate → sandbox enforce
- [ ] 三种信任级别的集成路径均正确
- [ ] 无集成断裂点

## 关键文件

- `commands/install.js` — confirmInstall()
- `plugins/runtime/plugin-validator.js` — capabilities 验证
- `plugins/contracts/capabilities.js` — 运行时校验
- `plugins/runtime/sandbox-manager.js` — 沙箱执行
