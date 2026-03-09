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

### 服务地址（生产环境端口不可修改）

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端 (Frontend)** | `http://localhost:7001` | 用户端 Web 应用 |
| **后端 (Backend API)** | `http://localhost:7002` | Express API 服务，前端和后台共用 |
| **后台 (Admin)** | `http://localhost:7003` | 管理后台 Web 应用 |
| **MongoDB** | `mongodb://localhost:27017/tinytale` | Docker 容器 |
| **Redis** | `localhost:6379` | 缓存服务 |

> **禁止事项**：生产环境下严禁修改以上端口号（7001 / 7002 / 7003 / 27017 / 6379）。所有涉及服务器地址的开发（API 调用、环境变量、部署配置等）必须使用上述固定端口。

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

**第三阶段：扩展功能（已完成）**
1. VIP订阅（Stripe Subscription 模式、套餐管理、自动续费）
2. 推广员/Affiliate系统（申请、佣金、提现、素材）
3. 密码重置流程（邮箱验证码）
4. 用户中心完善（个人资料、设置、通知、购买记录）
5. 营销活动（签到、任务、充值活动）
6. 评论/评分系统

**后期迭代**
- 推荐优化
- 多语言
- Google OAuth 完善

---

## 5. 项目结构

### 仓库与文件夹

| 仓库 | 本地路径 | GitHub | 说明 |
|------|----------|--------|------|
| **tinytale** | `/Users/gabriel/tinytale/` | `Gabriel0518/tinytale` | Next.js 项目（前端 7001 + 后台 7003 共用） |
| **tinytale-api** | `/Users/gabriel/tinytale-api/` | `Gabriel0518/tinytale-api` | Express 后端 API（7002） |

> 前端和后台共用同一个 Next.js 项目，通过 App Router 路由区分。后端 API 是独立的 Express 项目，独立部署。

```
/tinytale/              # Next.js 项目 (前端 Port 7001 + 后台 Port 7003)
  /src
    /app                  # Next.js App Router
      /admin              # 后台管理系统页面 (27个)
      /affiliate          # 推广员门户 (7个: index, apply, pending, dashboard, reports, payments, creatives)
      /auth               # 认证页面 (login, register, reset-password, reset-password/verify)
      /browse             # 浏览页面
      /category           # 分类页面
      /drama              # 短剧详情/播放
      /help               # 帮助中心
      /rankings           # 排行榜
      /ref                # 推广深链接 (/ref/[code]/[[...params]])
      /search             # 搜索页面
      /user               # 用户中心 (profile, settings, notifications, purchases, coins, subscription, favorites, history)
    /components           # 共享组件
      /admin              # 后台专用组件 (AdminSidebar, AdminHeader, DashboardCharts, VideoUploader, 各种Modal)
      /affiliate          # 推广员组件 (AffiliateSidebar, AffiliateHeader)
      /auth               # 认证组件 (AuthLayout)
      /features           # 功能组件 (DramaCard, Navbar, Footer, VipSubscriptionModal, PaymentSuccessModal, etc.)
      /player             # 播放器组件 (CloudflarePlayer, Controls, etc.)
      /ui                 # 基础UI组件 (Button, Input, Select, Modal, Toast, Tabs, Badge, EmptyState)
    /lib                  # 工具/API (api.ts, adminApi.ts, authContext.tsx, utils.ts)
    /types                # TypeScript类型定义
    /hooks                # 自定义Hooks (useAuthGuard)

/tinytale-api/            # 后端API项目 (Port 7002)
  /src
    /config               # 配置 (index.ts: port, mongodbUri, redisUrl, jwt, frontendUrl, adminUrl)
    /models               # MongoDB模型 (24个)
    /routes               # API路由
      /admin              # 后台管理子路由 (episodes, comments, rankings, dashboard, activities)
    /middleware            # 中间件 (auth: authenticate, requireAdmin)
```

### 后台管理系统页面架构

```
后台管理系统 (/admin)
│
├── 🔐 登录
│   └── /admin/login ──────────────── 管理员登录（不显示侧边栏）
│
├── 📊 仪表盘 Dashboard
│   └── /admin ─────────────────────── 数据概览、快捷操作、图表
│
├── 📺 内容管理 Content
│   ├── /admin/dramas ──────────────── 短剧列表管理
│   │   ├── /admin/dramas/create ──── 创建短剧向导（不显示侧边栏）
│   │   └── /admin/dramas/[id] ────── 短剧详情编辑
│   │       └── /admin/dramas/[id]/episodes ── 分集管理与编辑
│   ├── /admin/categories ─────────── 分类管理
│   ├── /admin/rankings ───────────── 排行榜与推荐
│   └── /admin/comments ───────────── 评论审核
│
├── 👥 用户管理 Users
│   ├── /admin/users ──────────────── 用户列表（筛选、搜索、状态管理）
│   └── /admin/users/[id] ─────────── 用户详情（资料、统计、7个Tab、3个弹窗）
│
├── 💰 财务管理 Finance
│   ├── /admin/orders ─────────────── 充值订单管理（含退款弹窗 M4-01）
│   │   └── /admin/orders/[id] ────── 订单详情（双栏布局、支付时间线、退款弹窗）
│   ├── /admin/subscriptions ──────── VIP 订阅管理
│   ├── /admin/coin-records ───────── 金币消费记录
│   └── /admin/finance ────────────── 财务报表与概览
│
├── 📢 推广管理 Promoters
│   ├── /admin/promoters ──────────── 推广员列表
│   │   ├── /admin/promoters/[id] ── 推广员详情
│   │   └── /admin/promoters/settings ── 推广设置
│   └── /admin/withdrawals ────────── 提现审核
│
├── 🎯 营销管理 Marketing
│   ├── /admin/checkin ────────────── 每日签到系统
│   ├── /admin/tasks ──────────────── 任务管理
│   └── /admin/campaigns ──────────── 营销活动
│
└── ⚙️ 系统管理 System
    ├── /admin/admins ─────────────── 管理员账号
    ├── /admin/roles ──────────────── 角色与权限
    ├── /admin/settings ───────────── 系统设置
    └── /admin/logs ───────────────── 审计日志
```

> 共 7 大模块、19 个导航项 + 1 个登录页 + 7 个子页面，总计 27 个后台页面 + 30 个前台页面 = 57 个页面。
> 布局：固定左侧边栏（240px, dark gray-900），当前路由高亮 indigo-600，登录页和创建短剧页不显示侧边栏。
> 关键文件：`src/app/admin/layout.tsx`（布局）、`src/components/admin/AdminSidebar.tsx`（侧边栏）、`src/lib/adminApi.ts`（API 客户端）

### 前台页面架构

```
前台用户端 (/)
│
├── 🏠 首页
│   └── / ────────────────────── 推荐轮播、热门短剧、分类入口
│
├── 🔍 浏览与发现
│   ├── /browse ──────────────── 全部短剧列表（分类筛选、排序）
│   ├── /search ──────────────── 搜索页面
│   ├── /rankings ────────────── 排行榜
│   ├── /category ────────────── 分类详情页
│   └── /help ────────────────── 帮助中心（FAQ、条款、隐私）
│
├── 🎬 短剧详情与播放
│   ├── /drama/[id] ──────────── 短剧详情（简介、剧集列表、评论、评分）
│   └── /drama/[id]/play/[episodeId] ── 播放页面（竖屏播放器）
│
├── 🔐 认证
│   ├── /auth/login ──────────── 登录
│   ├── /auth/register ───────── 注册
│   ├── /auth/reset-password ─── 忘记密码（输入邮箱）
│   └── /auth/reset-password/verify ── 验证码验证 + 重置密码
│
├── 👤 用户中心
│   ├── /user/profile ────────── 个人资料（头像、昵称、VIP状态、交易记录）
│   ├── /user/favorites ──────── 收藏列表
│   ├── /user/history ────────── 观看历史
│   ├── /user/notifications ──── 通知中心
│   ├── /user/purchases ──────── 购买/消费记录
│   ├── /user/settings ───────── 账号设置（密码、安全、社交绑定）
│   ├── /user/coins ──────────── 金币充值（Stripe Checkout）
│   ├── /user/coins/success ──── 充值成功回调页
│   ├── /user/subscription ───── VIP订阅页面
│   └── /user/subscription/success ── VIP订阅成功回调页
│
├── 🤝 推广员门户
│   ├── /affiliate ───────────── 推广员首页（介绍、CTA）
│   ├── /affiliate/apply ─────── 申请成为推广员
│   ├── /affiliate/pending ───── 申请审核中等待页
│   ├── /affiliate/dashboard ─── 推广数据面板
│   ├── /affiliate/reports ───── 佣金报表
│   ├── /affiliate/payments ──── 提现管理
│   └── /affiliate/creatives ─── 推广素材库
│
└── 🔗 推广深链接
    └── /ref/[code]/[[...params]] ── 推广链接落地页（跳转+追踪）
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

### 后台管理系统主题

- 背景色：`bg-[#0f0f17]`（页面）、`bg-[#13131d]`（卡片）、`bg-[#1a1a2e]`（输入框/hover）
- 主色：`indigo-600`（按钮、高亮、选中状态）
- 边框：`border-gray-700/50`
- 文字：`text-gray-200`（正文）、`text-gray-400`（次要）、`text-gray-500`（辅助）
- 状态色：绿色(成功)、黄色(警告)、红色(错误/危险)、紫色(VIP)

### 核心前端依赖

| 包 | 用途 |
|---|---|
| `next` 14.2.35 | React 框架 |
| `tailwindcss` ^3.4.1 | CSS 工具类 |
| `chart.js` + `react-chartjs-2` | 仪表盘图表 |
| `react-hook-form` + `zod` | 表单验证 |
| `framer-motion` | 动画 |
| `lucide-react` | 图标 |
| `swiper` | 轮播 |
| `video.js` | 视频播放器 |
| `tus-js-client` | 视频分片上传 |

### 核心后端依赖

| 包 | 用途 |
|---|---|
| `express` ^4.18.2 | Web 框架 |
| `mongoose` ^8.0.3 | MongoDB ODM |
| `jsonwebtoken` ^9.0.2 | JWT 认证 |
| `bcryptjs` ^2.4.3 | 密码哈希 |
| `redis` ^4.6.12 | Redis 客户端 |
| `cors` ^2.8.5 | 跨域 |

### Next.js 14 架构规范

#### Providers 组件架构

**关键文件：** `/src/components/Providers.tsx`

```typescript
'use client';

import { AuthProvider } from '@/lib/authContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
```

**用途：**
- 在根 layout (`/src/app/layout.tsx`) 中包裹所有子组件
- 提供全局上下文（Auth、Toast、Google OAuth）
- 解决 Next.js 14 构建时 "useAuth must be used within an AuthProvider" 错误
- 确保所有页面在 SSR 和客户端都能访问 auth context

**根 Layout 使用方式：**

```typescript
import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### 动态渲染配置

**规则：** 所有使用以下功能的页面必须添加 `export const dynamic = 'force-dynamic'`：

1. **使用 `useAuth` 的页面**（直接或通过 Navbar 组件）
2. **使用 `useSearchParams` 的页面**
3. **使用 `useRouter` 并依赖客户端状态的页面**

**配置位置：** 在 `"use client"` 指令之后，所有 import 之前

```typescript
"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
// ... 其他 imports
```

**已配置的页面列表：**

| 类别 | 页面 | 原因 |
|------|------|------|
| **认证页面** | `/auth/login`, `/auth/register`, `/auth/verify-otp`, `/auth/reset-password`, `/auth/reset-password/verify` | 使用 useAuth 或 useSearchParams |
| **用户中心** | `/user/*` (8个页面) | 使用 useAuth + Navbar |
| **推广员** | `/affiliate/*` (7个页面 + layout) | 使用 useAuth |
| **短剧相关** | `/drama/[id]`, `/drama/[id]/play/[episodeId]` | 使用 useAuth + Navbar |
| **浏览页面** | `/`, `/browse`, `/search`, `/category`, `/rankings`, `/help` | 使用 Navbar（含 useAuth） |
| **其他** | `/ref/[code]/[[...params]]` | 使用 useParams 动态路由 |

**常见错误及解决方案：**

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `useAuth must be used within an AuthProvider` | 页面在构建时静态生成，但 AuthProvider 只在客户端可用 | 1. 确保根 layout 使用 Providers 组件<br>2. 页面添加 `export const dynamic = 'force-dynamic'` |
| `useSearchParams() should be wrapped in a suspense boundary` | 使用 useSearchParams 但未配置动态渲染 | 添加 `export const dynamic = 'force-dynamic'` |
| Navbar 组件导致构建失败 | Navbar 使用 useAuth，所有引用它的页面都需要动态渲染 | 所有使用 Navbar 的页面添加 dynamic 配置 |

---

## 7. API接口

### 认证接口 (/api/auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 用户注册 (email, password, nickname, referredBy?) |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/google | Google OAuth 登录 (credential) |
| GET | /api/auth/me | 获取当前用户 [Auth] |
| POST | /api/auth/reset-password | 发送密码重置验证码 (email) |
| POST | /api/auth/verify-code | 验证重置码 (email, code) |
| POST | /api/auth/reset-password/confirm | 确认重置密码 (email, code, newPassword) |

### 短剧接口 (/api/dramas)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dramas | 获取短剧列表 (category, sort, limit, page) |
| GET | /api/dramas/:id | 获取短剧详情（含剧集） |
| GET | /api/dramas/:id/related | 获取相关短剧 |
| GET | /api/dramas/:id/reviews | 获取短剧评论 |
| POST | /api/dramas | 创建短剧 [Admin] |
| PUT | /api/dramas/:id | 更新短剧 [Admin] |
| DELETE | /api/dramas/:id | 删除短剧 [Admin] |

### 用户接口 (/api/user)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/favorites | 获取收藏列表 [Auth] |
| POST | /api/user/favorites | 添加收藏 [Auth] |
| DELETE | /api/user/favorites/:dramaId | 取消收藏 [Auth] |
| GET | /api/user/history | 获取观看历史 [Auth] |
| POST | /api/user/history | 更新观看进度 [Auth] |
| DELETE | /api/user/history | 清空观看历史 [Auth] |
| DELETE | /api/user/history/:id | 删除单条历史 [Auth] |
| GET | /api/user/episodes/:episodeId/unlocked | 检查剧集是否已解锁 [Auth] |
| PUT | /api/user/profile | 更新个人资料 (nickname, avatar) [Auth] |
| PUT | /api/user/password | 修改密码 (oldPassword, newPassword) [Auth] |
| GET | /api/user/purchases | 获取购买记录 (page, type) [Auth] |
| DELETE | /api/user/account | 注销账号（软删除）[Auth] |
| GET | /api/user/notifications | 获取通知列表 [Auth] |
| PUT | /api/user/notifications/:id/read | 标记通知已读 [Auth] |
| PUT | /api/user/notifications/read-all | 标记全部已读 [Auth] |
| GET | /api/user/settings | 获取用户设置 [Auth] |
| PUT | /api/user/settings | 更新用户设置 [Auth] |
| GET | /api/user/security | 获取安全信息（会话等）[Auth] |
| DELETE | /api/user/sessions/:id | 移除登录会话 [Auth] |
| POST | /api/user/sessions/logout-all | 登出所有会话 [Auth] |

### 金币接口 (/api/coins)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coins/balance | 获取余额 [Auth] |
| POST | /api/coins/recharge | 金币充值（模拟）[Auth] |
| POST | /api/coins/unlock | 解锁剧集 [Auth] |
| GET | /api/coins/transactions | 获取交易历史 [Auth] |
| POST | /api/coins/redeem | 兑换码兑换金币 [Auth] |

### 评论接口 (/api/comments)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/comments | 获取评论列表 (dramaId, episodeId, page, limit) |
| POST | /api/comments | 发表评论 [Auth] |
| POST | /api/comments/:id/like | 点赞评论 [Auth] |
| DELETE | /api/comments/:id | 删除评论 [Auth] |

### 分类接口 (/api/categories)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/categories | 获取所有分类 |

### 推荐/排行接口 (/api/featured)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/featured | 获取推荐内容 (type) |
| GET | /api/featured/rankings | 获取排行榜 (type=rating\|views\|newest) |
| GET | /api/featured/trending | 获取热门短剧 |

### 支付接口 (/api/payment)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/payment/packages | 获取金币套餐（从 Settings DB 读取或使用默认值）|
| POST | /api/payment/create-order | 创建 Stripe Checkout（payment 模式）[Auth] |
| POST | /api/payment/webhook | Stripe Webhook 处理（checkout.session.completed, invoice.paid, customer.subscription.deleted, checkout.session.expired）|
| GET | /api/payment/verify-session/:sessionId | 验证 Stripe 会话 + 备用履约 [Auth] |
| GET | /api/payment/vip/plans | 获取VIP套餐 |
| POST | /api/payment/vip/subscribe | 订阅VIP（Stripe Subscription 模式）[Auth] |
| GET | /api/payment/vip/status | 获取VIP订阅状态 [Auth] |
| GET | /api/payment/transactions | 获取用户交易记录 (page, limit) [Auth] |

### 剧集播放接口 (/api/episodes)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/episodes/:id/stream | 获取播放流地址 + 签名 Token（VIP检查）|
| GET | /api/episodes/:id/access | 检查播放权限 (free/vip/unlocked/locked) [Auth] |
| POST | /api/episodes/:id/progress | 上报播放进度 (currentTime, duration) [Auth] |

### 联系/帮助接口 (/api/contact)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/contact/inquiry | 提交联系表单 (name, email, subject, message, type?) |

### 推广员接口 (/api/promoter)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/promoter/apply | 申请成为推广员 (fullName, businessEmail, country, promotionChannels, paymentMethod) [Auth] |
| GET | /api/promoter/profile | 获取推广员资料 [Auth] |
| GET | /api/promoter/dashboard | 推广数据面板（收益趋势、余额）[Auth] |
| GET | /api/promoter/commissions | 佣金列表（分页、筛选）[Auth] |
| GET | /api/promoter/commissions/export | 导出佣金CSV [Auth] |
| GET | /api/promoter/creatives | 获取推广素材 (dramaId?, type?) [Auth] |
| GET | /api/promoter/payment-methods | 获取收款方式列表 [Auth] |
| POST | /api/promoter/payment-methods | 添加收款方式 [Auth] |
| PUT | /api/promoter/payment-methods/:id | 更新收款方式 [Auth] |
| DELETE | /api/promoter/payment-methods/:id | 删除收款方式 [Auth] |
| PUT | /api/promoter/payment-methods/:id/default | 设为默认收款方式 [Auth] |
| POST | /api/promoter/withdraw | 申请提现（最低$50，2%手续费）[Auth] |
| GET | /api/promoter/withdrawals | 获取提现记录 [Auth] |
| GET | /api/promoter/referral-link | 获取推广链接 [Auth] |
| POST | /api/promoter/track-click | 追踪推广链接点击 |
| GET | /api/promoter/notifications | 获取推广员通知 [Auth] |
| GET | /api/promoter/settings | 获取推广设置（公开）|

**推广员管理（Admin 子路由）**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/promoter/admin/list | 获取推广员列表 [Admin] |
| GET | /api/promoter/admin/:id | 获取推广员详情 [Admin] |
| POST | /api/promoter/admin/:id/review | 审核推广员申请 [Admin] |
| PUT | /api/promoter/admin/:id/level | 调整推广员等级 [Admin] |
| PUT | /api/promoter/admin/:id/status | 更新推广员状态 [Admin] |
| GET | /api/promoter/admin/withdrawals | 获取提现列表 [Admin] |
| POST | /api/promoter/admin/withdrawals/:id/review | 审核提现 [Admin] |
| POST | /api/promoter/admin/withdrawals/:id/confirm-payment | 确认打款 [Admin] |
| POST | /api/promoter/admin/creatives | 上传推广素材 [Admin] |
| PUT | /api/promoter/admin/creatives/:id | 更新推广素材 [Admin] |
| DELETE | /api/promoter/admin/creatives/:id | 删除推广素材 [Admin] |
| GET | /api/promoter/admin/settings | 获取推广设置 [Admin] |
| PUT | /api/promoter/admin/settings | 更新推广设置 [Admin] |

### 管理后台接口 (/api/admin) [全部需要 Admin 权限]

**仪表盘**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | 统计数据概览 |
| GET | /api/admin/stats/charts | 图表数据 (period=7d\|30d) |

**用户管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | 用户列表 (search, status, page, limit) |
| PUT | /api/admin/users/:id | 更新用户 (coins, status) |

**短剧管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dramas | 短剧列表 (search, status, page, limit) |
| POST | /api/admin/dramas | 创建短剧 |
| PUT | /api/admin/dramas/:id | 更新短剧 |
| DELETE | /api/admin/dramas/:id | 删除短剧（含剧集） |

**剧集管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/episodes | 获取剧集 (dramaId) |
| GET | /api/admin/episodes/:id | 获取单个剧集 |
| POST | /api/admin/episodes | 创建剧集 |
| POST | /api/admin/episodes/bulk | 批量创建剧集 |
| PUT | /api/admin/episodes/:id | 更新剧集 |
| DELETE | /api/admin/episodes/:id | 删除剧集 |

**分类管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/categories | 获取分类 |
| POST | /api/admin/categories | 创建分类 |
| PUT | /api/admin/categories/:id | 更新分类 |
| DELETE | /api/admin/categories/:id | 删除分类 |

**交易/订单管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/transactions | 交易列表 (page, limit, type, status) |
| POST | /api/admin/transactions/:id/refund | 处理退款（含金币回收） |

**评论管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/comments | 评论列表 (dramaId, status, page, limit) |
| GET | /api/admin/comments/:id | 获取单条评论 |
| POST | /api/admin/comments/:id/approve | 审核通过 |
| POST | /api/admin/comments/:id/reject | 审核拒绝 |
| POST | /api/admin/comments/bulk/approve | 批量通过 |
| POST | /api/admin/comments/bulk/reject | 批量拒绝 |
| DELETE | /api/admin/comments/:id | 删除评论 |

**推荐/排行管理**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/featured | 获取推荐项 (type) |
| POST | /api/admin/featured | 创建推荐项 |
| PUT | /api/admin/featured/:id | 更新推荐项 |
| DELETE | /api/admin/featured/:id | 删除推荐项 |
| GET | /api/admin/rankings | 获取排行项 |
| POST | /api/admin/rankings | 创建排行项 |
| PUT | /api/admin/rankings/:id | 更新排行项 |
| DELETE | /api/admin/rankings/:id | 删除排行项 |
| POST | /api/admin/rankings/reorder | 重新排序 |

**系统管理 (/api/admin/settings)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/settings/roles | 获取角色列表 |
| POST | /api/admin/settings/roles | 创建角色 |
| PUT | /api/admin/settings/roles/:id | 更新角色 |
| DELETE | /api/admin/settings/roles/:id | 删除角色 |
| GET | /api/admin/settings/admins | 获取管理员列表 |
| POST | /api/admin/settings/admins | 创建管理员 |
| PUT | /api/admin/settings/admins/:id | 更新管理员 |
| DELETE | /api/admin/settings/admins/:id | 删除管理员 |
| POST | /api/admin/settings/admins/:id/reset-password | 重置管理员密码 |
| GET | /api/admin/settings/logs | 获取系统日志 |
| GET | /api/admin/settings/settings | 获取系统设置 |
| PUT | /api/admin/settings/settings | 更新系统设置 |
| GET | /api/admin/settings/vip-plans | 获取VIP套餐列表 |
| POST | /api/admin/settings/vip-plans | 创建VIP套餐 |
| PUT | /api/admin/settings/vip-plans/:id | 更新VIP套餐 |
| DELETE | /api/admin/settings/vip-plans/:id | 删除VIP套餐 |

**营销活动管理 (/api/admin/activities)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/activities/checkin | 获取签到配置 |
| PUT | /api/admin/activities/checkin | 更新签到配置 |
| GET | /api/admin/activities/tasks | 获取任务列表 |
| POST | /api/admin/activities/tasks | 创建任务 |
| PUT | /api/admin/activities/tasks/:id | 更新任务 |
| DELETE | /api/admin/activities/tasks/:id | 删除任务 |
| GET | /api/admin/activities/campaigns | 获取营销活动 |
| POST | /api/admin/activities/campaigns | 创建营销活动 |
| PUT | /api/admin/activities/campaigns/:id | 更新营销活动 |
| DELETE | /api/admin/activities/campaigns/:id | 删除营销活动 |

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

### Collections 总览 (24个模型)

| Collection | 说明 | 关键字段 |
|------------|------|----------|
| **users** | 用户信息 | email, password, nickname, avatar, googleId, role(user/admin), coins, status(active/banned), vipStatus, vipExpireDate, stripeCustomerId, referredBy, registeredFrom, lastLoginAt |
| **dramas** | 短剧元数据 | title, cover, description, categories[], actors[], rating, isCompleted, status(draft/published), viewCount, totalEpisodes, country, language |
| **episodes** | 剧集信息 | dramaId, title, episodeNumber, videoUrl, thumbnail, duration, isFree, unlockPrice, subtitleUrl, videoQuality(480p/720p/1080p), streamVideoId |
| **categories** | 分类 | name, slug, icon, sortOrder |
| **comments** | 评论 | userId, dramaId, episodeId, content, status(pending/approved/rejected), replyTo, likes |
| **transactions** | 交易记录 | userId, type(recharge/unlock/refund/vip/task_reward/promotion), amount, status(pending/completed/failed/refunded), paymentMethod, stripeSessionId, stripePaymentIntentId, coinAmount, bonusCoins, refundAmount, refundReason, coinHandling, coinClawbackAmount |
| **favorites** | 用户收藏 | userId, dramaId (unique: userId+dramaId) |
| **watch_histories** | 观看历史 | userId, dramaId, episodeId, progress |
| **unlocked_episodes** | 解锁记录 | userId, episodeId, price (unique: userId+episodeId) |
| **vip_plans** | VIP套餐 | name, price, durationDays, coins, features[], isActive, sortOrder |
| **vip_subscriptions** | VIP订阅 | userId, planId, startDate, endDate, status(active/expired/cancelled), autoRenew, stripeSubscriptionId |
| **promoters** | 推广员 | userId, level, totalRevenue, pendingWithdrawal, referralCode, parentPromoterId, status(active/suspended), applicationStatus(pending/approved/rejected), commissionRate, fullName, businessEmail, country, promotionChannels, totalClicks, totalRegistrations, totalPaidUsers, effectiveUsers, withdrawnAmount |
| **withdrawals** | 提现记录 | promoterId, amount, status(pending/approved/rejected/paid), paymentMethodId, transactionFee, feeRate, netAmount, bankName, bankAccount, reviewedBy, reviewedAt, paidAt, paidBy, paymentProof |
| **commissions** | 佣金记录 | promoterId, referralCode, userId, dramaId, dramaTitle, orderId, orderAmount, commissionRate, commissionAmount, status(pending/confirmed/rejected), freezeUntil, confirmedAt, referralLink |
| **payment_methods** | 推广员收款方式 | promoterId, type(paypal/bank_transfer/usdt), isDefault, paypalEmail, bankName, bankAccount, usdtAddress, usdtNetwork |
| **creative_assets** | 推广素材 | dramaId, type(clip/poster/banner/video), title, url, thumbnailUrl, dimensions, fileSize, status |
| **featured** | 推荐/排行 | dramaId, type(rankings/featured/trending/new), position, startDate, endDate |
| **admins** | 管理员 | username, password, roleId, lastLogin, status(active/inactive) |
| **admin_roles** | 管理员角色 | name, permissions[], description |
| **system_logs** | 系统日志 | adminId, action, targetType, targetId, details, ip |
| **settings** | 系统设置 | key, value, category, description |
| **activities** | 营销活动 | type(signin/task/recharge_bonus), name, config, startDate, endDate, status(draft/active/ended), targetTiers, promotionType, bonusValue, limitPerUser |
| **user_activities** | 用户活动记录 | userId, activityId, type, completedAt, reward |
| **tasks** | 任务配置 | name, description, type(daily/newbie/achievement), triggerEvent, completionTarget, reward, sortOrder, active |

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

### 金币充值模式

1. 用户选择金币套餐 → `POST /api/payment/create-order`
2. 后端创建 pending Transaction + Stripe Checkout Session（payment 模式）
3. 用户跳转 Stripe Checkout 完成支付
4. 履约路径（二选一）：
   - **Webhook**：`checkout.session.completed` → 标记 Transaction 完成 → 增加用户金币余额 → 生成推广佣金
   - **verify-session 备用**：`GET /api/payment/verify-session/:sessionId` → 如果 Webhook 未触发则执行相同履约
5. 解锁剧集 → 扣除金币 → 记录 UnlockedEpisode

### VIP订阅模式

1. 用户选择VIP套餐 → `POST /api/payment/vip/subscribe`
2. 后端获取/创建 Stripe Customer（存储 `user.stripeCustomerId`）
3. 创建 pending Transaction + Stripe Checkout Session（**subscription 模式**，recurring interval: month/year）
4. 用户跳转 Stripe Checkout 完成支付
5. 履约：创建 VIPSubscription 记录 → 设置 `user.vipStatus='active'` + `user.vipExpireDate`
6. **自动续费**：Webhook 处理 `invoice.paid`（billing_reason=subscription_cycle）→ 延长 VIPSubscription endDate
7. **取消订阅**：Webhook 处理 `customer.subscription.deleted` → 标记 VIPSubscription 为 cancelled
8. VIP 用户可免费观看所有付费剧集

### Stripe集成

- **Checkout Session**：金币充值（payment 模式）+ VIP订阅（subscription 模式）
- **Webhook**：处理 `checkout.session.completed`、`invoice.paid`、`customer.subscription.deleted`、`checkout.session.expired`
- **Refund**：管理后台退款（含金币回收）
- **Customer**：VIP 订阅用户自动创建 Stripe Customer

### 推广佣金

- 被推荐用户每次付款自动生成佣金记录
- Level 1 推广员：5% 佣金率
- Level 2+ 推广员：8% 佣金率
- 佣金有 30 天冻结期，冻结期后可提现
- 提现最低 $50，手续费 2%

---

## 11. 视频播放

### 技术架构：Cloudflare Stream + HLS + Video.js

```
┌─────────────────────────────────────────────────────────────┐
│                     前端播放器层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Video.js    │  │ 自定义控制栏│  │ 业务层              │  │
│  │ + HLS.js    │  │ (Controls)  │  │ (付费墙/字幕/连播)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     后端服务层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 视频管理API │  │ 签名服务    │  │ 权限校验            │  │
│  │             │  │ (Token)     │  │ (付费/VIP)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Stream                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 视频存储    │  │ 自动转码    │  │ HLS 全球分发        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 核心依赖

| 包 | 用途 |
|---|---|
| `video.js` | 播放器核心，内置 HLS 支持 |
| `@types/video.js` | TypeScript 类型 |
| `tus-js-client` | 后台视频分片上传（TUS 协议） |

### 播放器组件结构

```
components/player/
├── CloudflarePlayer.tsx      # Video.js 播放器封装（消费 HLS 流）
├── PlayerRoot.tsx            # 播放器根容器 + Context
├── PaywallOverlay.tsx        # 付费墙覆盖层
├── PreviewController.tsx     # 预览时长控制
├── SubtitleSystem.tsx        # 字幕菜单 + VTT 加载
├── Controls/
│   ├── PlayControls.tsx      # 播放/暂停/上下集
│   ├── ProgressBar.tsx       # 进度条 + 缓冲条
│   ├── VolumeControl.tsx     # 音量滑块 + 静音
│   └── SettingsMenu.tsx      # 倍速 + 画质 + 字幕
├── hooks/
│   ├── usePlayerState.ts     # useReducer 播放状态管理
│   └── useFullscreen.ts      # Fullscreen API + Safari polyfill
└── types/
    └── player.ts             # 播放器类型定义
```

### 播放流地址格式

```
https://customer-{subdomain}.cloudflarestream.com/{video_uid}/manifest/video.m3u8
```

### 双模式支持

- **Stream 模式**：Episode 有 `streamVideoId` 时，从 CF Stream 获取 HLS 流
- **Fallback 模式**：无 Stream ID 时，降级为原生 `<video>` + 直接 URL（开发调试用）

### 字幕系统

- 存储方式：独立存储（非 CF Stream 原生），支持按地区配置语言版本
- 上传格式：SRT / VTT（SRT 上传后服务端自动转 VTT）
- 播放加载：Video.js `<track>` 元素加载 VTT 文件
- 数据结构：`subtitles: [{ language, label, src, regions }]`

### 播放规则

- 前几集免费，后续集数需金币解锁
- 付费内容使用签名 Token 鉴权（1小时有效期）
- 未付费用户可预览前 N 秒，到时弹出付费墙
- 支持剧集自动连播

### 视频相关 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/episodes/:id/stream | 获取播放流地址 + 签名 Token |
| GET | /api/episodes/:id/access | 检查播放权限 |
| POST | /api/episodes/:id/progress | 上报播放进度 |
| POST | /api/admin/upload/video | 获取 TUS 直传 URL |
| PUT | /api/admin/episodes/:id/video | 替换视频 |
| POST | /api/admin/episodes/:id/subtitles | 上传字幕（SRT/VTT） |
| DELETE | /api/admin/episodes/:id/subtitles/:lang | 删除字幕 |

### 环境变量

```
CF_ACCOUNT_ID=         # Cloudflare 账户 ID
CF_API_TOKEN=          # API Token（Stream:Edit 权限）
CF_STREAM_SUBDOMAIN=   # 播放地址前缀 customer-xxxxx
CF_STREAM_SIGNING_KEY_ID=    # 签名 Key ID（付费鉴权）
CF_STREAM_SIGNING_KEY_JWK=   # 签名私钥 JWK（付费鉴权）
```

---

## 12. 环境变量

### 后端 (/tinytale-api/.env)

```
PORT=7002
MONGODB_URI=mongodb://localhost:27017/tinytale
REDIS_URL=redis://localhost:6379
JWT_SECRET=tinytale-secret-key-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:7001
ADMIN_URL=http://localhost:7003

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=

# Cloudflare Stream (视频托管)
CF_ACCOUNT_ID=
CF_API_TOKEN=
CF_STREAM_SUBDOMAIN=
CF_STREAM_SIGNING_KEY_ID=
CF_STREAM_SIGNING_KEY_JWK=
```

### 前端 (/tinytale)

- 无 `.env` 文件，API URL 默认值：`NEXT_PUBLIC_API_URL=http://localhost:7002`（在 `src/lib/api.ts` 中定义）

### Vercel 生产环境变量

**必需环境变量：**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://api.tinytale.top` | 生产环境后端 API 地址 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google 登录功能 |

**配置方式：**

```bash
# 通过 Vercel CLI 添加环境变量
vercel env add NEXT_PUBLIC_API_URL production
# 输入值: https://api.tinytale.top

# 或通过 Vercel Dashboard
# Project Settings → Environment Variables → Add New
```

**重要提示：**
- 环境变量修改后需要重新部署才能生效
- `NEXT_PUBLIC_` 前缀的变量会在构建时注入到客户端代码中
- 生产环境 API URL 必须使用 HTTPS

### 本地开发启动

```bash
# 方式1：使用启动脚本（同时启动所有服务）
cd /Users/gabriel/tinytale && bash start-local.sh

# 方式2：分别启动
# 后端 API (Port 7002)
cd /Users/gabriel/tinytale-api && npm run dev

# 前端 (Port 7001)
cd /Users/gabriel/tinytale && npx next dev -p 7001

# 后台管理 (Port 7003)
cd /Users/gabriel/tinytale && npx next dev -p 7003
```

> **注意**：前端和后台共用同一个 Next.js 项目，无法同时用 `next dev` 运行两个端口。`start-local.sh` 通过后台进程实现，但可能存在冲突。生产环境通过 Vercel 分别部署。

### VPS 生产环境部署

| 属性 | 值 |
|------|-----|
| **IP** | 93.188.160.112 |
| **SSH 端口** | 7897 |
| **用户** | root |
| **前端路径** | /var/www/tinytale/frontend |
| **后端路径** | /var/www/tinytale/api |
| **进程管理** | PM2 (tinytale-api, tinytale-web) |
| **PM2 配置** | /var/www/tinytale/ecosystem.config.js |

```bash
# 部署流程
ssh -p 7897 root@93.188.160.112 "cd /var/www/tinytale/api && git pull && npm run build && cd /var/www/tinytale/frontend && git pull && npm run build && pm2 restart all"
```

### Vercel 部署流程

**生产环境：**

| 属性 | 值 |
|------|-----|
| **前端域名** | https://tinytale.top |
| **部署平台** | Vercel |
| **Git 仓库** | https://github.com/Gabriel0518/tinytale.git |
| **自动部署** | main 分支推送自动触发 |

**手动部署命令：**

```bash
# 方式1：通过 Vercel CLI 手动部署
cd /Users/gabriel/tinytale
npx vercel --prod

# 方式2：推送到 GitHub 触发自动部署
git push origin main

# 查看部署状态
npx vercel ls --prod

# 查看部署日志
npx vercel logs <deployment-url>
```

**部署检查清单：**

1. ✅ 确保所有使用 `useAuth` 的页面添加了 `export const dynamic = 'force-dynamic'`
2. ✅ 确保所有使用 `useSearchParams` 的页面添加了动态渲染配置
3. ✅ 确保根 layout 使用 Providers 组件包裹子组件
4. ✅ 确保 Vercel 环境变量已配置（`NEXT_PUBLIC_API_URL`）
5. ✅ 本地测试构建：`npm run build`
6. ✅ 检查 TypeScript 错误：`npm run type-check`（如果有）
7. ✅ 推送代码到 GitHub 或手动触发部署

**常见部署问题：**

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 构建失败：`useAuth must be used within an AuthProvider` | 页面缺少动态渲染配置 | 添加 `export const dynamic = 'force-dynamic'` |
| 环境变量未生效 | 环境变量配置后未重新部署 | 重新触发部署 |
| API 请求失败 | `NEXT_PUBLIC_API_URL` 未配置或错误 | 检查 Vercel 环境变量配置 |
| Google Fonts CSS 警告 | Next.js 字体优化问题 | 可忽略，不影响功能 |

---

## 13. 前端API客户端模块

所有前端 API 调用封装在 `src/lib/api.ts`，通过 `ApiClient` 类统一管理：

| 模块 | 说明 |
|------|------|
| `authApi` | 登录、注册、Google OAuth、获取当前用户 |
| `dramasApi` | 短剧列表、详情、推荐、排行、相关推荐 |
| `episodesApi` | 播放流获取、权限检查、进度上报 |
| `categoriesApi` | 分类列表 |
| `userApi` | 收藏、历史、解锁检查、通知 |
| `commentsApi` | 评论列表、发表、点赞 |
| `reviewsApi` | 评分/评论 |
| `coinsApi` | 余额、解锁、充值套餐、Stripe 创建订单、验证会话、兑换码 |
| `passwordApi` | 发送重置码、验证码、重置密码 |
| `profileApi` | 更新资料、修改密码、购买记录、注销账号 |
| `settingsApi` | 用户设置、安全信息、会话管理 |
| `subscriptionApi` | VIP套餐、订阅、订阅状态 |
| `contactApi` | 提交联系表单 |
| `promoterApi` | 推广员申请、资料、面板、佣金、素材、收款方式、提现、推广链接、通知 |

后台管理 API 封装在 `src/lib/adminApi.ts`。

---

## 14. 验收标准

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

## 15. 统一国家/地区系统

所有涉及国家选择的页面统一使用 `src/lib/countries.ts`，禁止在页面中硬编码国家列表。

| 导出 | 类型 | 说明 |
|------|------|------|
| `COUNTRY_GROUPS` | `CountryGroup[]` | 按 17 个区域分组的国家列表（含 label + countries） |
| `ALL_COUNTRIES` | `string[]` | 扁平化的全部国家名称列表（由 COUNTRY_GROUPS 自动生成） |

### 使用方式

```typescript
import { COUNTRY_GROUPS } from "@/lib/countries";  // 需要分组选择器时
import { ALL_COUNTRIES } from "@/lib/countries";    // 需要扁平列表时
```

### 引用页面

| 页面 | 导入 | 用途 |
|------|------|------|
| `admin/rankings/page.tsx` | `ALL_COUNTRIES` | Playlist 国家定向 |
| `admin/categories/page.tsx` | `ALL_COUNTRIES` | Category 国家定向 |
| `admin/dramas/components/EditDramaModal.tsx` | `COUNTRY_GROUPS` | Drama 地区选择（分组） |
| `admin/dramas/create/page.tsx` | `COUNTRY_GROUPS` | Drama 创建地区选择（分组） |
| `affiliate/apply/page.tsx` | `ALL_COUNTRIES` | 推广员申请国家选择 |

> **规则**：新增国家/地区功能时，只修改 `src/lib/countries.ts`，所有页面自动同步。数据库中国家字段统一存储英文全名（如 "United Arab Emirates" 而非 "UAE"）。

---

*本文档为TinyTale项目开发行为的基础规则，所有开发活动必须遵循此文档。*
