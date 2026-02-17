# TinyTale Agent Team

## 团队成员

| 角色 | Agent | 职责 | 文件归属权 |
|------|-------|------|-----------|
| 项目负责人 | Lead Agent | 拆任务、调度Agent、做最终决策 | `src/types/`, `src/lib/` |
| 产品经理 | Product Agent | PRD、用户路径、逻辑规则、开发文档 | 不写代码（只输出需求文档） |
| UI/UX设计师 | Design Agent | 视觉、交互、设计系统、共享组件 | `tailwind.config.ts`, `globals.css`, `src/components/ui/` |
| 工程师 | Dev Agent | 写代码、改代码（唯一修改页面文件的Agent） | `src/app/**/page.tsx`, `src/app/**/layout.tsx` |
| 测试工程师 | Audit Agent | 测试页面、发现问题、提供修复建议（不修改任何代码） | 不写代码（只输出测试报告） |

## 工作流（循环模式）

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Lead ──→ Product ──→ Design ──→ Dev ──→ Audit  │
│   ▲                                       │     │
│   └───────────────────────────────────────┘     │
│                                                 │
│  最多循环 5 轮，或无影响使用的 bug 时停止        │
└─────────────────────────────────────────────────┘
```

### 循环流程

1. **Audit** 测试页面 → 输出问题清单 + 修复建议 → 提交给 Lead
2. **Lead** 接收问题 → 按优先级拆解子任务 → 分配给 Product
3. **Product** 编写开发需求文档（功能描述、验收标准） → 提交给 Design
4. **Design** 更新设计 token、共享样式、UI 组件 → 提交给 Dev
5. **Dev** 实现页面代码修改 → 回到 Step 1

### 退出条件

- 无 P0（阻断性）和 P1（功能缺失）bug
- P2（视觉偏差）≤ 3 且不影响核心体验
- 或已达到第 5 轮循环

## 团队规则

- **Communication**: 只有Lead Agent分配时才能发言
- **Responsibility**: 每个Agent必须在自己的职责范围内工作
- **File Ownership**: 每个Agent只能修改自己归属权范围内的文件
- **Audit No-Code**: Audit Agent 严禁修改任何代码文件
- **Output**: 输出必须清楚标记是哪个Agent在说话

## Agent输出格式

- `[Lead Agent] Decision / Task Assignment`
- `[Product Agent] PRD / Feature Logic`
- `[Design Agent] UI / Layout`
- `[Dev Agent] Code Implementation`
- `[Audit Agent] Test Report / Issues / Suggestions`
