# TinyTale 升级开发方案

> 本文档由 Lead Agent 制定，作为项目升级的开发指导。每次开发任务前请先对照此方案，确保开发方向正确、避免遗漏。

---

## 一、项目概览

### 1.1 升级范围

| 模块 | 方案页面数 | 现有完成 | 待开发 |
|------|-----------|---------|--------|
| 客户端前端 | 20个 | 11个 | 9个新建 + 9个升级 |
| 后台管理系统 | 50+个 | 5个 | 45+个新建 + 5个升级 |
| 基础设施 | - | 部分 | 依赖/配置/组件库 |

### 1.2 技术栈

| 层级 | 选型 | 端口 |
|------|------|------|
| 客户端前端 | Next.js 14 + TypeScript + Tailwind CSS | 7001 |
| 后台管理 | Next.js 14 + TypeScript + Tailwind CSS | 7002 |
| 后端 API | Node.js + Express + TypeScript | 7003 |
| 数据库 | MongoDB (Docker) | 27017 |
| 缓存 | Redis | 6379 |

### 1.3 开发方案文档位置

所有页面开发方案位于: `/Users/gabriel/Documents/fangan/`

---

## 二、系统级升级清单

### 2.1 依赖包安装

**状态**: [ ] 未完成

```bash
# UI/动画
npm install framer-motion lucide-react

# 表单验证
npm install react-hook-form zod

# Radix UI 组件
npm install @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-checkbox

# 图表
npm install chart.js react-chartjs-2

# 视频播放
npm install video.js @types/video.js

# 认证
npm install next-auth

# HTTP客户端 (可选)
npm install axios
```

### 2.2 Tailwind 配置升级

**状态**: [ ] 未完成

**文件**: `tailwind.config.js`

```js
module.exports = {
  // ... 现有配置
  theme: {
    extend: {
      colors: {
        // 客户端主题色（深色Netflix风格）
        'primary-gold': '#D4AF37',
        'dark-bg': '#0F1014',
        'dark-card': '#141414',
        'dark-border': '#2A2A2A',

        // 后台管理主题色（专业SaaS风格）
        'admin-primary': '#0d0df2',
        'admin-bg': '#101022',
        'admin-border': '#15152a',
        'admin-card': '#1a1a2e',

        // 通用状态色
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
}
```

### 2.3 项目目录结构

**状态**: [ ] 未完成

**目标结构**:
```
src/
├── app/
│   ├── (client)/              # 客户端路由组
│   │   ├── page.tsx           # P-01 首页
│   │   ├── browse/            # P-02 浏览页
│   │   ├── rankings/          # P-03 排行榜
│   │   ├── search/            # P-04 搜索页
│   │   ├── drama/[id]/        # P-05 详情页
│   │   │   └── play/[ep]/     # P-06 播放页
│   │   └── user/              # 用户中心
│   │       ├── profile/       # P-11 用户中心
│   │       ├── favorites/     # P-12 收藏夹
│   │       ├── history/       # P-13 观看历史
│   │       ├── settings/      # P-14 账户设置
│   │       ├── coins/         # P-15 金币充值
│   │       └── purchases/     # P-17 购买历史
│   ├── auth/                  # 认证页面
│   │   ├── login/             # P-07 登录
│   │   ├── register/          # P-08 注册
│   │   ├── verify/            # P-09 验证码
│   │   └── reset-password/    # P-10 重置密码
│   ├── help/                  # P-20 帮助中心
│   ├── not-found.tsx          # P-18 404页面
│   └── admin/                 # 后台管理
│       ├── page.tsx           # P1 数据看板
│       ├── dramas/            # P2 剧集管理
│       ├── users/             # P3 用户管理
│       ├── orders/            # P4 订单管理
│       ├── promoters/         # P5 推广管理
│       ├── marketing/         # P6 营销活动
│       └── settings/          # P7 系统设置
├── components/
│   ├── ui/                    # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Pagination.tsx
│   │   └── Tooltip.tsx
│   ├── client/                # 客户端专用组件
│   │   ├── HomeCarousel.tsx
│   │   ├── VideoCard.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── SearchBar.tsx
│   │   ├── EpisodeList.tsx
│   │   └── PaymentModal.tsx
│   ├── admin/                 # 后台专用组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── StatCard.tsx
│   │   ├── TrendBadge.tsx
│   │   ├── DataTable.tsx
│   │   └── FilterBar.tsx
│   ├── charts/                # 图表组件
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   └── DoughnutChart.tsx
│   └── auth/                  # 认证组件
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── SocialAuth.tsx
│       └── AuthWrapper.tsx
├── lib/
│   ├── api/                   # API模块
│   │   ├── client.ts          # API客户端基类
│   │   ├── auth.ts
│   │   ├── dramas.ts
│   │   ├── users.ts
│   │   ├── coins.ts
│   │   └── admin.ts
│   ├── hooks/                 # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useFavorites.ts
│   │   └── useDebounce.ts
│   └── utils/                 # 工具函数
│       ├── format.ts
│       └── validators.ts
└── types/                     # 类型定义
    ├── drama.ts
    ├── user.ts
    ├── order.ts
    └── api.ts
```

---

## 三、客户端页面开发清单

### 3.1 页面状态总览

| 编号 | 页面名称 | 状态 | 方案文档 | 优先级 |
|------|---------|------|---------|--------|
| P-01 | 首页 | 升级 | `客户端P-01 首页.md` | High |
| P-02 | 浏览页 | 升级 | `客户端P-02 浏览页.md` | Medium |
| P-03 | 排行榜 | 升级 | `客户端P-03 排行榜.md` | Medium |
| P-04 | 搜索页 | 升级 | `客户端P-04 搜索页.md` | Medium |
| P-05 | 短剧详情页 | 升级 | `客户端P-05 短剧详情页.md` | High |
| P-06 | 全屏播放页 | 升级 | `客户端P-06 全屏播放页.md` | High |
| P-07 | 登录页面 | **重写** | `客户端P-07 登录页面.md` | High |
| P-08 | 注册页面 | **重写** | `客户端P-08 账户注册页面.md` | High |
| P-09 | 重置密码验证 | **新建** | `客户端P-09 重置密码验证.md` | Medium |
| P-10 | 重置密码 | **新建** | `客户端P-10 重置密码.md` | Medium |
| P-11 | 用户中心 | 升级 | `客户端P-11用户中心.md` | High |
| P-12 | 收藏夹 | **新建** | `客户端P-12 收藏夹.md` | Medium |
| P-13 | 观看历史 | **新建** | `客户端P-13 观看历史.md` | Medium |
| P-14 | 账户设置 | **新建** | `客户端P-14 账户设置.md` | Medium |
| P-15 | 金币充值页面 | 升级 | `客户端P-15 金币充值页面.md` | High |
| P-16-1 | 支付成功弹窗 | **新建** | `客户端P-16-1 支付成功弹窗组件.md` | Medium |
| P-16-2 | 支付失败弹窗 | **新建** | `客户端P-16-2 支付失败弹窗组件.md` | Medium |
| P-17 | 购买历史记录 | **新建** | `客户端P-17 购买历史记录.md` | Low |
| P-18 | 404页面 | **新建** | `客户端P-18 404页面.md` | Low |
| P-19 | 会员订阅弹窗 | **新建** | `客户端P-19 会员订阅弹窗组件.md` | Medium |
| P-20 | 帮助中心 | **新建** | `客户端P-20信息与帮助中心.md` | Low |

### 3.2 客户端关键组件

| 组件名称 | 用途 | 状态 | 所属页面 |
|---------|------|------|---------|
| HomeCarousel | 首页推荐轮播 | 新建 | P-01 |
| VideoCard | 短剧卡片 | 升级 | P-01/02/03/12/13 |
| VideoPlayer | 视频播放器(Video.js) | 新建 | P-06 |
| SearchBar | 搜索栏(带Debounce) | 升级 | P-04 |
| EpisodeList | 集数列表 | 新建 | P-05 |
| AuthWrapper | 登录页背景容器 | 新建 | P-07/08 |
| LoginForm | 登录表单 | 重写 | P-07 |
| SocialAuth | 第三方登录 | 新建 | P-07/08 |
| PaymentModal | 支付弹窗 | 新建 | P-15/16/19 |

### 3.3 客户端 API 接口

| 接口 | 方法 | 用途 | 状态 |
|------|------|------|------|
| `/api/videos/recommendations` | GET | 获取推荐列表 | 新增 |
| `/api/videos/search` | GET | 搜索短剧 | 已有 |
| `/api/auth/login` | POST | 用户登录 | 已有 |
| `/api/auth/register` | POST | 用户注册 | 已有 |
| `/api/auth/reset-password` | POST | 重置密码 | 新增 |
| `/api/auth/verify-code` | POST | 验证码校验 | 新增 |
| `/api/user/favorites` | GET/POST/DELETE | 收藏管理 | 已有 |
| `/api/user/history` | GET/POST | 观看历史 | 已有 |
| `/api/user/profile` | GET/PUT | 用户信息 | 升级 |
| `/api/coins/balance` | GET | 金币余额 | 已有 |
| `/api/coins/recharge` | POST | 金币充值 | 已有 |
| `/api/coins/unlock` | POST | 解锁剧集 | 已有 |
| `/api/subscription/plans` | GET | 订阅套餐 | 新增 |
| `/api/subscription/subscribe` | POST | 订阅VIP | 新增 |

---

## 四、后台管理页面开发清单

### 4.1 页面状态总览

| 编号 | 页面名称 | 状态 | 方案文档 | 优先级 |
|------|---------|------|---------|--------|
| **P0** | 后台登录 | 升级 | `后台管理端P0 后台登录页面.md` | High |
| **P1** | 数据看板 | 升级 | `后台管理端P1 后台主页数据看板.md` | High |
| **P2-01** | 剧集管理 | 升级 | `后台管理端P2-01 剧集管理.md` | High |
| P2-02-01 | 剧集基本信息 | 新建 | `后台管理端P2-02-01 剧集基本信息.md` | High |
| P2-02-02 | 视频与字幕 | 新建 | `后台管理端P2-02-02 视频与字幕.md` | High |
| P2-02-03 | 付费设置 | 新建 | `后台管理端P2-02-03 付费设置.md` | High |
| P2-02-04 | SEO与发布 | 新建 | `后台管理端P2-02-04 SEO 与发布.md` | Medium |
| P2-03 | 分集管理 | 新建 | `后台管理端P2-03 分集管理页面.md` | High |
| P2-05 | 分类管理 | 升级 | `后台管理端P2-05 分类管理主页面.md` | Medium |
| P2-06 | 排行榜管理 | 新建 | `后台管理端P2-06 排行榜与精选管理.md` | Medium |
| P2-07 | 评论管理 | 新建 | `后台管理端P2-07 评论管理主列表.md` | Low |
| **P3-01** | 用户列表 | 升级 | `后台管理端P3-01 用户列表管理后台.md` | High |
| P3-02 | 用户详情 | 新建 | `后台管理端P3-02 用户详情分析后台.md` | Medium |
| **P4-01** | 充值订单 | 升级 | `后台管理端P4-01 充值订单管理后台.md` | High |
| P4-02 | 订单详情 | 新建 | `后台管理端P4-02 充值订单详情.md` | Medium |
| P4-03 | 订阅订单 | 新建 | `后台管理端P4-03 订阅订单管理.md` | Medium |
| P4-04 | 消费记录 | 新建 | `后台管理端P4-04 虚拟货币消费记录.md` | Low |
| P5-01 | 推广员管理 | 新建 | `后台管理端P5-01 推广员管理后台.md` | Low |
| P5-02 | 推广员详情 | 新建 | `后台管理端P5-02 推广员画像与业绩审计后台.md` | Low |
| P5-03 | 推广设置 | 新建 | `后台管理端P5-03 推广设置 (全局配置).md` | Low |
| P5-04 | 提现管理 | 新建 | `后台管理端P5-04 提现审计与发放管理.md` | Low |
| P6-01 | 签到配置 | 新建 | `后台管理端P6-01 每日签到配置.md` | Low |
| P6-02 | 任务配置 | 新建 | `后台管理端P6-02 任务配置管理.md` | Low |
| P6-03 | 充值活动 | 新建 | `后台管理端P6-03 充值营销活动管理.md` | Low |
| P7-01 | 管理员管理 | 新建 | `后台管理端P7-01-01 后台管理员.md` | Medium |
| P7-02 | 角色权限 | 新建 | `后台管理端P7-02 角色与权限管理.md` | Medium |
| P7-03 | 全局设置 | 新建 | `后台管理端P7-03-*.md` (5个子页面) | Medium |
| P7-04 | 操作日志 | 新建 | `后台管理端P7-04 系统操作日志.md` | Low |

### 4.2 后台弹窗组件清单

| 编号 | 组件名称 | 状态 | 方案文档 |
|------|---------|------|---------|
| M2-01 | 分集编辑弹窗 | 新建 | `后台管理端P2-03 M2-01 分集编辑弹窗组件.md` |
| M2-02 | 分类编辑弹窗 | 新建 | `后台管理端P2-03 M2-02分类管理与编辑弹窗组件.md` |
| M2-03 | 推荐位配置弹窗 | 新建 | `后台管理端P2-03 M2-03 推荐位配置弹窗组件.md` |
| M2-04 | 评论审核弹窗 | 新建 | `后台管理端P2-03 M2-04 评论详情与审核弹窗.md` |
| M3-01 | 金币调整弹窗 | 新建 | `后台管理端P3 M3-01用户详情与金币调整弹窗.md` |
| M3-02 | VIP调整弹窗 | 新建 | `后台管理端P3 M3-02 用户详情与 VIP 调整弹窗.md` |
| M3-03 | 封禁管理弹窗 | 新建 | `后台管理端P3 M3-03 用户详情与封禁管理.md` |
| M4-01 | 退款处理弹窗 | 新建 | `后台管理端P4 M4-01 退款处理弹窗.md` |
| M5-01 | 推广员等级弹窗 | 新建 | `后台管理端P5 M5-01推广员等级调整弹窗.md` |
| M5-02 | 提现审核弹窗 | 新建 | `后台管理端P5 M5-02 提现审核弹窗.md` |
| M5-03 | 确认打款弹窗 | 新建 | `后台管理端P5 M5-03 确认打款弹窗.md` |
| M6-01 | 任务配置弹窗 | 新建 | `后台管理端P6 M6-01 任务配置弹窗.md` |
| M6-02 | 充值活动弹窗 | 新建 | `后台管理端P6 M6-02 充值活动配置弹窗.md` |
| MG-01 | 通用确认弹窗 | 新建 | `后台管理端MG-01 通用确认弹窗.md` |
| MG-02 | 全局Toast | 新建 | `后台管理端MG-02 全局 Toast 通知系统.md` |

### 4.3 后台管理 API 接口

| 接口 | 方法 | 用途 | 状态 |
|------|------|------|------|
| `/api/v1/dashboard/summary` | GET | 看板汇总数据 | 新增 |
| `/api/v1/dashboard/trends` | GET | 趋势图表数据 | 新增 |
| `/api/admin/dramas` | GET | 剧集列表(带筛选分页) | 升级 |
| `/api/admin/dramas/{id}` | GET/PUT/DELETE | 剧集CRUD | 升级 |
| `/api/admin/dramas/{id}/status` | PATCH | 剧集状态切换 | 新增 |
| `/api/admin/dramas/{id}/episodes` | GET/POST | 分集管理 | 新增 |
| `/api/admin/categories` | GET/POST/PUT/DELETE | 分类管理 | 升级 |
| `/api/admin/users` | GET | 用户列表 | 升级 |
| `/api/admin/users/{id}` | GET/PUT | 用户详情 | 新增 |
| `/api/admin/users/{id}/coins` | PATCH | 金币调整 | 新增 |
| `/api/admin/users/{id}/vip` | PATCH | VIP调整 | 新增 |
| `/api/admin/users/{id}/ban` | PATCH | 封禁操作 | 新增 |
| `/api/admin/orders/recharge` | GET | 充值订单 | 新增 |
| `/api/admin/orders/subscription` | GET | 订阅订单 | 新增 |
| `/api/admin/orders/{id}/refund` | POST | 退款处理 | 新增 |
| `/api/admin/comments` | GET | 评论列表 | 新增 |
| `/api/admin/comments/{id}/review` | PATCH | 评论审核 | 新增 |
| `/api/admin/promoters` | GET | 推广员列表 | 新增 |
| `/api/admin/withdrawals` | GET | 提现列表 | 新增 |
| `/api/admin/marketing/checkin` | GET/PUT | 签到配置 | 新增 |
| `/api/admin/marketing/tasks` | GET/POST/PUT/DELETE | 任务配置 | 新增 |
| `/api/admin/marketing/activities` | GET/POST/PUT/DELETE | 充值活动 | 新增 |
| `/api/admin/settings/*` | GET/PUT | 系统设置 | 新增 |
| `/api/admin/logs` | GET | 操作日志 | 新增 |

---

## 五、开发阶段规划

### Phase 0: 基础设施 (预计2天)

**目标**: 完成系统级升级，为后续开发打基础

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 0.1 安装依赖包 | Dev Agent | [ ] |
| 0.2 更新Tailwind配置 | Design + Dev | [ ] |
| 0.3 创建基础UI组件库 | Design + Dev | [ ] |
| 0.4 调整项目目录结构 | Dev Agent | [ ] |

**验收标准**:
- [ ] 所有依赖安装成功，无版本冲突
- [ ] Tailwind配置包含所有自定义色彩
- [ ] 基础组件(Button/Input/Badge/Modal/Toast)可用
- [ ] 目录结构符合规范

---

### Phase 1: 客户端核心功能 (预计1周)

#### Sprint 1.1 认证模块 (P-07 ~ P-10)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 1.1.1 登录页重写 | Design + Dev | [ ] |
| 1.1.2 注册页重写 | Dev Agent | [ ] |
| 1.1.3 密码重置流程 | Product + Dev | [ ] |
| 1.1.4 OAuth集成 | Dev Agent | [ ] |

**关键交付物**:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/SocialAuth.tsx`
- `src/components/auth/AuthWrapper.tsx`

#### Sprint 1.2 首页升级 (P-01)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 1.2.1 HomeCarousel组件 | Design + Dev | [ ] |
| 1.2.2 VideoCard升级 | Design + Dev | [ ] |
| 1.2.3 推荐API对接 | Dev Agent | [ ] |

#### Sprint 1.3 播放模块 (P-05, P-06)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 1.3.1 详情页升级 | Design + Dev | [ ] |
| 1.3.2 Video.js集成 | Dev Agent | [ ] |
| 1.3.3 手势控制 | Dev Agent | [ ] |

#### Sprint 1.4 用户中心 (P-11 ~ P-17)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 1.4.1 用户中心主页 | Design + Dev | [ ] |
| 1.4.2 收藏夹页面 | Dev Agent | [ ] |
| 1.4.3 观看历史页面 | Dev Agent | [ ] |
| 1.4.4 账户设置页面 | Dev Agent | [ ] |
| 1.4.5 金币充值升级 | Dev Agent | [ ] |
| 1.4.6 支付弹窗组件 | Dev Agent | [ ] |
| 1.4.7 购买历史页面 | Dev Agent | [ ] |

#### Sprint 1.5 其他页面 (P-18 ~ P-20)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 1.5.1 404页面 | Dev Agent | [ ] |
| 1.5.2 会员订阅弹窗 | Product + Dev | [ ] |
| 1.5.3 帮助中心 | Product + Dev | [ ] |

---

### Phase 2: 后台管理核心 (预计2周)

#### Sprint 2.1 数据看板 (P1)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 2.1.1 StatCard组件 | Design + Dev | [ ] |
| 2.1.2 TrendBadge组件 | Dev Agent | [ ] |
| 2.1.3 Chart.js集成 | Dev Agent | [ ] |
| 2.1.4 用户趋势图 | Dev Agent | [ ] |
| 2.1.5 营收趋势图 | Dev Agent | [ ] |
| 2.1.6 内容排行图 | Dev Agent | [ ] |
| 2.1.7 渠道分布图 | Dev Agent | [ ] |
| 2.1.8 Dashboard API | Dev Agent | [ ] |

#### Sprint 2.2 剧集管理 (P2系列)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 2.2.1 剧集列表页升级 | Design + Dev | [ ] |
| 2.2.2 搜索筛选功能 | Dev Agent | [ ] |
| 2.2.3 数据表格组件 | Dev Agent | [ ] |
| 2.2.4 剧集编辑页-基本信息 | Dev Agent | [ ] |
| 2.2.5 剧集编辑页-视频字幕 | Dev Agent | [ ] |
| 2.2.6 剧集编辑页-付费设置 | Dev Agent | [ ] |
| 2.2.7 剧集编辑页-SEO发布 | Dev Agent | [ ] |
| 2.2.8 分集管理页面 | Dev Agent | [ ] |
| 2.2.9 分集编辑弹窗 | Dev Agent | [ ] |
| 2.2.10 分类管理 | Dev Agent | [ ] |
| 2.2.11 排行榜管理 | Dev Agent | [ ] |
| 2.2.12 评论管理 | Dev Agent | [ ] |

#### Sprint 2.3 用户管理 (P3系列)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 2.3.1 用户列表页 | Dev Agent | [ ] |
| 2.3.2 用户详情页 | Dev Agent | [ ] |
| 2.3.3 金币调整弹窗 | Dev Agent | [ ] |
| 2.3.4 VIP调整弹窗 | Dev Agent | [ ] |
| 2.3.5 封禁管理弹窗 | Dev Agent | [ ] |

#### Sprint 2.4 订单管理 (P4系列)

| 任务 | 负责Agent | 状态 |
|------|----------|------|
| 2.4.1 充值订单列表 | Dev Agent | [ ] |
| 2.4.2 订单详情页 | Dev Agent | [ ] |
| 2.4.3 订阅订单管理 | Dev Agent | [ ] |
| 2.4.4 消费记录页 | Dev Agent | [ ] |
| 2.4.5 退款处理弹窗 | Dev Agent | [ ] |

---

### Phase 3: 功能完善 (持续迭代)

#### Sprint 3.1 推广管理 (P5系列)
- P5-01 ~ P5-04 推广员管理全流程
- M5-01 ~ M5-03 相关弹窗

#### Sprint 3.2 营销活动 (P6系列)
- P6-01 签到配置
- P6-02 任务配置
- P6-03 充值活动
- M6-01 ~ M6-02 相关弹窗

#### Sprint 3.3 系统设置 (P7系列)
- P7-01 管理员管理
- P7-02 角色权限
- P7-03 全局设置 (5个子页面)
- P7-04 操作日志

#### Sprint 3.4 全局组件
- MG-01 通用确认弹窗
- MG-02 全局Toast通知

---

## 六、Agent 工作流程

### 6.1 标准开发流程

```
1. Lead Agent    → 任务分配、确认优先级
2. Product Agent → 需求确认、逻辑规则、API设计
3. Design Agent  → UI规范、交互细节、响应式
4. Dev Agent     → 代码实现、组件开发
5. Audit Agent   → 代码审查、安全检查、规范验证
6. Lead Agent    → 验收、合并决策
```

### 6.2 每个任务开始前检查清单

- [ ] 已阅读对应的方案文档 (`/Users/gabriel/Documents/fangan/`)
- [ ] 确认依赖组件是否已完成
- [ ] 确认API接口是否已定义
- [ ] 确认UI规范是否已输出
- [ ] 确认与现有代码的合并点

### 6.3 代码提交规范

```
feat(client): P-07 登录页面重写
fix(admin): P1 数据看板图表性能优化
refactor(ui): Button组件统一样式
```

---

## 七、风险与应对

| 风险点 | 影响 | 应对措施 | 负责 |
|--------|------|---------|------|
| 依赖版本冲突 | 构建失败 | 逐个安装测试 | Audit |
| 样式污染 | UI混乱 | CSS模块化/Tailwind前缀 | Design |
| API不一致 | 前后端对接失败 | 接口文档先行 | Product |
| Chart.js性能 | 页面卡顿 | 按需加载/销毁检查 | Dev |
| Video.js兼容 | 播放异常 | 多浏览器测试 | Audit |
| 支付安全 | 资金风险 | 严格审计 | Audit |

---

## 八、版本记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|---------|--------|
| v1.0 | 2026-02-17 | 初始版本，完整开发方案 | Lead Agent |

---

*本文档为TinyTale项目升级开发的核心指导文档，所有开发活动必须遵循此方案。*
