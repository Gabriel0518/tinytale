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

| 层级 | 选型 |
|-----|------|
| **前端** | Next.js 14 + TypeScript + Tailwind CSS |
| **后端** | Node.js + Express + TypeScript |
| **数据库** | MongoDB + Redis |
| **视频托管** | 第三方CDN（Mux / Cloudflare Stream） |
| **支付** | Stripe |
| **部署** | Vercel(前端) + AWS/Railway(后端) |

---

## 3. Agent Team

### 团队成员

| 角色 | Agent | 职责 |
|------|-------|------|
| 项目负责人 | Lead Agent | 拆任务、调度Agent、做最终决策 |
| 产品经理 | Product Agent | PRD、用户路径、逻辑规则 |
| UI/UX设计师 | Design Agent | 视觉、交互、前端结构 |
| 工程师 | Dev Agent | 写代码、改代码、合并 |
| 测试工程师 | Audit Agent | 冲突、风险、规范检查 |

### 团队规则

- **Communication**: 只有Lead Agent分配时才能发言
- **Responsibility**: 每个Agent必须在自己的职责范围内工作
- **Tools**: 每个Agent必须遵守工具权限
- **Output**: 输出必须清楚标记是哪个Agent在说话

### Agent输出格式

- `[Lead Agent] Decision / Task Assignment`
- `[Product Agent] PRD / Feature Logic`
- `[Design Agent] UI / Layout`
- `[Dev Agent] Code Implementation`
- `[Audit Agent] Issues / Suggestions`

---

## 4. 开发流程

### 工作流

```
Lead → Product → Design → Dev → Audit → Lead
```

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

## 5. 代码规范

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

## 6. API设计规范

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

## 7. 数据库设计 (MongoDB)

### 核心 Collections

- **users**: 用户信息
- **dramas**: 短剧元数据
- **episodes**: 剧集信息
- **episodes_unlock**: 用户解锁记录
- **transactions**: 交易记录
- **categories**: 分类

### Redis 缓存

- 用户Session
- 视频播放Token
- 热门数据缓存

---

## 8. 支付流程

### 金币模式

1. 用户充值金币 → Stripe Checkout
2. 金币到账 → 更新用户余额
3. 解锁剧集 → 扣除金币 → 记录解锁记录

### Stripe集成

- Checkout Session (充值)
- Webhook (支付回调)
- Refund (退款)

---

## 9. 视频播放

### 第三方CDN

- Mux / Cloudflare Stream
- 播放器组件封装
- 防下载处理
- 清晰度切换（可选）

### 播放规则

- 前几集免费
- 后续集数需金币解锁

---

## 10. 验收标准

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

## 11. 开发原则

1. **MVP优先**: 先完成核心功能，不追求完美
2. **组件化**: 复用组件，减少重复代码
3. **类型安全**: TypeScript严格模式
4. **代码审查**: Dev完成后由Audit检查
5. **渐进式**: 功能逐步迭代，不一次性堆砌

---

## 12. 禁止事项

- **禁止** Lead Agent之外直接分配任务
- **禁止** 跳过Product Agent直接写代码
- **禁止** Dev Agent自行决定UI设计
- **禁止** 未经Audit Agent检查直接合并
- **禁止** 改变产品范围（需Lead Agent审批）

---

*本文档为TinyTale项目开发行为的基础规则，所有开发活动必须遵循此文档。*
