# TinyTale 系统架构方案 (最终版)

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Architecture                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │   Frontend  │     │    Admin    │     │   Backend   │  │
│   │  (Next.js)  │     │  (Next.js)  │     │  (Express)  │  │
│   │  Port:7001  │     │  Port:7002  │     │   Port:7003  │  │
│   └─────────────┘     └─────────────┘     └─────────────┘  │
│          │                   │                   │            │
│          └───────────────────┴───────────────────┘            │
│                              │                                │
│                     ┌────────▼────────┐                     │
│                     │   MongoDB + Redis │                    │
│                     └───────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## 2. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS |
| 后台 | Next.js 14 + TypeScript + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MongoDB |
| 缓存 | Redis |
| 视频存储 | 第三方CDN (Mux/Cloudflare Stream) |
| 支付 | Stripe |
| 部署 | Vercel (前端) + Railway/AWS (后端) |

## 3. 数据库 Schema

### 3.1 users - 用户表
```sql
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  nickname: String,
  avatar: String,
  role: String (user/admin),
  coins: Number,
  status: String (active/banned),
  createdAt: Date,
  updatedAt: Date
}
```

### 3.2 dramas - 短剧表
```sql
{
  _id: ObjectId,
  title: String,
  cover: String (URL),
  description: String,
  categories: [String],
  actors: [String],
  rating: Number,
  isCompleted: Boolean,
  status: String (draft/published),
  viewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.3 episodes - 剧集表
```sql
{
  _id: ObjectId,
  dramaId: ObjectId (ref: dramas),
  title: String,
  episodeNumber: Number,
  videoUrl: String (第三方CDN URL),
  thumbnail: String (URL),
  duration: Number (秒),
  isFree: Boolean,
  unlockPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.4 favorites - 收藏表
```sql
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  dramaId: ObjectId (ref: dramas),
  createdAt: Date
}
```

### 3.5 watch_history - 观看历史表
```sql
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  dramaId: ObjectId (ref: dramas),
  episodeId: ObjectId (ref: episodes),
  progress: Number (秒),
  createdAt: Date,
  updatedAt: Date
}
```

### 3.6 unlocked_episodes - 解锁记录表
```sql
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  episodeId: ObjectId (ref: episodes),
  price: Number,
  createdAt: Date
}
```

### 3.7 transactions - 交易记录表
```sql
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  type: String (recharge/unlock/refund),
  amount: Number,
  status: String (pending/completed/failed),
  paymentMethod: String,
  externalId: String (Stripe payment ID),
  createdAt: Date,
  updatedAt: Date
}
```

### 3.8 categories - 分类表
```sql
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  icon: String,
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 4. API 接口清单

### 4.1 认证接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新Token |
| GET | /api/auth/me | 获取当前用户 |

### 4.2 短剧接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dramas | 获取短剧列表 |
| GET | /api/dramas/:id | 获取短剧详情 |
| POST | /api/dramas | 创建短剧(管理员) |
| PUT | /api/dramas/:id | 更新短剧(管理员) |
| DELETE | /api/dramas/:id | 删除短剧(管理员) |

### 4.3 剧集接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dramas/:id/episodes | 获取剧集列表 |
| GET | /api/episodes/:id | 获取剧集详情 |
| POST | /api/episodes | 创建剧集(管理员) |
| PUT | /api/episodes/:id | 更新剧集(管理员) |

### 4.4 用户接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/favorites | 获取收藏列表 |
| POST | /api/user/favorites | 添加收藏 |
| DELETE | /api/user/favorites/:id | 删除收藏 |
| GET | /api/user/history | 获取观看历史 |
| POST | /api/user/history | 添加观看记录 |
| DELETE | /api/user/history | 清空观看历史 |

### 4.5 金币接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/coins/balance | 获取金币余额 |
| POST | /api/coins/recharge | 金币充值 |
| POST | /api/coins/unlock | 解锁剧集 |
| GET | /api/coins/transactions | 交易记录 |

### 4.6 分类接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/categories | 获取分类列表 |

### 4.7 管理后台接口
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | 统计数据 |
| GET | /api/admin/users | 用户列表 |
| PUT | /api/admin/users/:id | 更新用户 |
| GET | /api/admin/dramas | 短剧管理 |
| GET | /api/admin/episodes | 剧集管理 |
| GET | /api/admin/categories | 分类管理 |
| GET | /api/admin/transactions | 交易记录 |

## 5. 环境变量

### 后端 (.env)
```
PORT=7003
MONGODB_URI=mongodb://localhost:27017/tinytale
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
FRONTEND_URL=http://localhost:7001
ADMIN_URL=http://localhost:7002
```

### 前端 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:7003
```

## 6. 第三方服务集成

### 6.1 视频存储 (Mux/Cloudflare Stream)
- 上传视频获取播放URL
- 动态适配带宽
- 防下载处理
- 播放统计

### 6.2 支付 (Stripe)
- Checkout Session (充值)
- Webhook (支付回调)
- 退款处理

## 7. 开发计划

### Phase 1: 基础功能 (1周)
- [x] 项目架构设计
- [x] 前端项目搭建
- [x] 后端API开发
- [x] MongoDB集成
- [x] Redis集成

### Phase 2: 核心功能 (1周)
- [ ] 用户认证
- [ ] 短剧/剧集CRUD
- [ ] 收藏/历史功能
- [ ] 金币系统

### Phase 3: 支付集成 (1周)
- [ ] Stripe集成
- [ ] 金币充值
- [ ] 剧集解锁

### Phase 4: 部署上线 (1周)
- [ ] 前端部署 (Vercel)
- [ ] 后端部署 (Railway/AWS)
- [ ] 测试验收
