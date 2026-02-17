# TinyTale (ReelShort Web端) 开发指导

---

## 1. 项目概述

| 属性 | 值 |
|------|-----|
| **项目名称** | TinyTale / ReelShort |
| **类型** | Netflix风格海外竖屏短剧流媒体平台（Web端） |
| **目标用户** | 北美18-35岁年轻用户（主要为女性） |
| **核心价值** | 高品质UI体验 + 专注竖屏短剧品类 + 金币付费模式 |
| **设计风格** | 深色主题，参考Netflix/Disney+ |
| **响应式** | PC(1440px) + Mobile(375px) |

---

## 2. 技术栈

| 层级 | 选型 | 端口 |
|------|------|------|
| **前端** | Next.js 14 + TypeScript + Tailwind CSS | 7001 |
| **后端** | Node.js + Express | 7002 |
| **后台** | Next.js 14 + TypeScript + Tailwind CSS | 7003 |
| **数据库** | MongoDB (Docker) | 27017 |
| **缓存** | Redis | 6379 |
| **视频托管** | 第三方CDN（Mux / Cloudflare Stream） | - |
| **支付** | Stripe | - |
| **部署** | Vercel(前端/后台) + Railway/AWS(后端) | - |

---

## 3. Agent Team

### 团队成员

| 角色 | Agent | 职责 | 文件归属权 |
|------|-------|------|-----------|
| 项目负责人 | Lead Agent | 拆任务、调度Agent、做最终决策 | `src/types/`, `src/lib/` |
| 产品经理 | Product Agent | PRD、用户路径、逻辑规则、开发文档 | 不写代码文件（只输出需求文档） |
| UI/UX设计师 | Design Agent | 视觉、交互、设计系统、共享组件 | `tailwind.config.ts`, `globals.css`, `src/components/ui/` |
| 工程师 | Dev Agent | 写代码、改代码（唯一修改页面文件的Agent） | `src/app/**/page.tsx`, `src/app/**/layout.tsx` |
| 测试工程师 | Audit Agent | 测试页面、发现问题、提供修复建议（不修改任何代码） | 不写代码文件（只输出测试报告） |

### 团队规则

- **Communication**: 只有Lead Agent分配时才能发言
- **Responsibility**: 每个Agent必须在自己的职责范围内工作
- **Tools**: 每个Agent必须遵守工具权限
- **Output**: 输出必须清楚标记是哪个Agent在说话
- **File Ownership**: 每个Agent只能修改自己归属权范围内的文件，严禁跨界
- **Audit No-Code**: Audit Agent 严禁修改任何代码文件，只负责测试和报告

### Agent输出格式

- `[Lead Agent] Decision / Task Assignment`
- `[Product Agent] PRD / Feature Logic`
- `[Design Agent] UI / Layout`
- `[Dev Agent] Code Implementation`
- `[Audit Agent] Test Report / Issues / Suggestions`

---

## 4. 开发流程

### 工作流（循环模式）

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

### 循环流程详解

**Step 1 — Audit 测试**
- Audit Agent 测试所有页面，检查功能、视觉、交互、类型安全、可访问性
- 输出：问题清单 + 每个问题的修复建议
- 提交给 Lead Agent

**Step 2 — Lead 拆解**
- Lead Agent 接收 Audit 的问题清单
- 按优先级分类（P0 阻断性 / P1 功能缺失 / P2 视觉偏差 / P3 优化建议）
- 拆解为具体子任务，分配给 Product

**Step 3 — Product 出文档**
- Product Agent 根据 Lead 的任务拆解，结合设计方案文档
- 输出每个子任务的详细开发需求（功能描述、验收标准、参考设计文档编号）
- 提交给 Design

**Step 4 — Design 设计**
- Design Agent 根据 Product 的需求文档
- 更新设计 token、共享样式、UI 组件
- 确保视觉规范一致性
- 提交给 Dev

**Step 5 — Dev 开发**
- Dev Agent 根据 Product 需求 + Design 输出
- 实现页面代码修改
- 只修改自己归属权范围内的文件

**Step 6 — 回到 Step 1**
- Audit Agent 再次测试
- 如果无影响使用的 bug → 流程结束
- 如果仍有问题 → 继续下一轮循环
- 最多执行 5 轮

### 退出条件

- ✅ 无 P0（阻断性）bug
- ✅ 无 P1（功能缺失）bug
- ✅ P2（视觉偏差）数量 ≤ 3 且不影响核心体验
- ✅ 或已达到第 5 轮循环

### 开发阶段

**第一阶段：前台核心功能**
1. 浏览（首页、分类、搜索）
2. 播放（竖屏视频播放器）
3. 用户（注册、登录、收藏、历史）
4. 付费（金币充值、剧集解锁）

**第二阶段：后台管理系统**
1. 剧集管理（短剧CRUD、上传、分类）
2. 用户管理（列表、封禁、金币调整）
3. 支付管理（Stripe对接、订单查询）
4. 财务系统（收入统计、结算报表）
5. BI系统（用户数据、播放数据、付费转化）

**后期迭代**
- 评论/评分
- 推荐优化
- 多语言
- VIP订阅

---

## 5. 项目结构

```
/tinytale-frontend/     # 前端项目 (Port 7001)
  /src
    /app              # Next.js页面
    /components       # 组件
    /lib              # 工具/API
    /types            # 类型定义

/tinytale-admin/       # 后台管理项目 (Port 7002)
  /src
    /app/admin       # 管理后台页面
    /components       # 组件
    /lib              # 工具/API

/tinytale-api/        # 后端API项目 (Port 7003)
  /src
    /config          # 配置
    /models          # MongoDB模型
    /routes          # API路由
    /middleware      # 中间件
```

---

## 6. 代码规范

### 前端 (Next.js 14 + TypeScript + Tailwind)

```
/src
  /app              # Next.js App Router
    /page.tsx      # 页面入口
    /layout.tsx    # 布局
    /globals.css   # 全局样式
  /components      # 组件
    /ui            # 基础UI组件
    /features      # 功能组件
  /lib             # 工具函数
  /hooks           # 自定义Hooks
  /types           # TypeScript类型
  /services        # API调用
```

### 后端 (Node.js + Express + TypeScript)

```
/src
  /routes          # 路由
  /controllers    # 控制器
  /models         # 数据模型
  /services       # 业务逻辑
  /middleware     # 中间件
  /utils          # 工具函数
  /config         # 配置
```

### 命名规范

- **组件**: PascalCase (e.g., `VideoPlayer.tsx`)
- **函数/变量**: camelCase (e.g., `getVideoList`)
- **常量**: UPPER_SNAKE_CASE (e.g., `MAX_VIDEO_COUNT`)
- **文件**: kebab-case (e.g., `user-service.ts`)

### Tailwind CSS

- 使用深色主题 (Netflix风格)
- 色彩系统：主色、强调色、背景色、文字色
- 响应式断点：`sm:`, `md:`, `lg:`, `xlg:`

---

## 7. API接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 短剧接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dramas | 获取短剧列表 |
| GET | /api/dramas/:id | 获取短剧详情 |

### 用户接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | /api/user/favorites | 收藏管理 |
| GET/POST/DELETE | /api/user/history | 观看历史 |

### 金币接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coins/balance | 获取余额 |
| POST | /api/coins/recharge | 金币充值 |
| POST | /api/coins/unlock | 解锁剧集 |

### 管理后台接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | 统计数据 |
| GET | /api/admin/users | 用户管理 |
| GET | /api/admin/dramas | 短剧管理 |
| GET | /api/admin/transactions | 交易记录 |

---

## 8. API设计规范

### RESTful风格

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 获取资源 | GET /api/videos |
| POST | 创建资源 | POST /api/users/login |
| PUT | 更新资源 | PUT /api/videos/:id |
| DELETE | 删除资源 | DELETE /api/videos/:id |

### 响应格式

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

### 错误处理

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 9. 数据库设计 (MongoDB)

### 核心 Collections

| Collection | 说明 |
|------------|------|
| **users** | 用户信息 |
| **dramas** | 短剧元数据 |
| **episodes** | 剧集信息 |
| **favorites** | 用户收藏 |
| **watch_history** | 观看历史 |
| **unlocked_episodes** | 用户解锁记录 |
| **transactions** | 交易记录 |
| **categories** | 分类 |

### Redis 缓存

- 用户Session
- 视频播放Token
- 热门数据缓存

### 数据库连接

```
MongoDB: mongodb://localhost:27017/tinytale (Docker)
```

---

## 10. 支付流程

### 金币模式

1. 用户充值金币 → Stripe Checkout
2. 金币到账 → 更新用户余额
3. 解锁剧集 → 扣除金币 → 记录解锁记录

### Stripe集成

- Checkout Session (充值)
- Webhook (支付回调)
- Refund (退款)

---

## 11. 视频播放

### 第三方CDN

- Mux / Cloudflare Stream
- 播放器组件封装
- 防下载处理
- 清晰度切换（可选）

### 播放规则

- 前几集免费
- 后续集数需金币解锁

---

## 12. 验收标准

### 功能验收

- [ ] 首页展示短剧列表
- [ ] 分类筛选正常
- [ ] 搜索功能正常
- [ ] 视频播放流畅
- [ ] 用户注册/登录正常
- [ ] 收藏功能正常
- [ ] 金币充值流程通
- [ ] 剧集解锁正常

### 视觉验收

- [ ] 深色主题风格统一
- [ ] 响应式布局正常（PC + Mobile）
- [ ] 交互反馈清晰
- [ ] 加载状态友好

### 性能验收

- [ ] 首屏加载 < 3s
- [ ] 视频缓冲 < 2s
- [ ] API响应 < 500ms

---

## 13. 开发原则

1. **MVP优先**: 先完成核心功能，不追求完美
2. **组件化**: 复用组件，减少重复代码
3. **类型安全**: TypeScript严格模式
4. **代码审查**: Dev完成后由Audit检查
5. **渐进式**: 功能逐步迭代，不一次性堆砌

---

## 14. 禁止事项

- **禁止** Lead Agent之外直接分配任务
- **禁止** 跳过Product Agent直接写代码
- **禁止** Dev Agent自行决定UI设计
- **禁止** 未经Audit Agent检查直接合并
- **禁止** 改变产品范围（需Lead Agent审批）
- **禁止** Audit Agent修改任何代码文件（只能测试和报告）
- **禁止** Agent修改自己文件归属权范围之外的文件
- **禁止** 跳过循环流程中的任何步骤

---

*本文档为TinyTale项目开发行为的基础规则，所有开发活动必须遵循此文档。*
