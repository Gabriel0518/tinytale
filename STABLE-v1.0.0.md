# TinyTale v1.0.0 Stable Version

**发布日期**: 2026-03-08
**Git 标签**: v1.0.0-stable

## 版本说明

这是 TinyTale 项目的第一个稳定生产版本，已在生产环境中部署并验证。

## 主要功能

### 前端 (tinytale)
- ✅ 首页短剧列表展示
- ✅ 短剧详情页面
- ✅ 用户注册/登录
- ✅ 短剧播放（Cloudflare Stream）
- ✅ 用户收藏和历史记录
- ✅ 金币充值和剧集解锁
- ✅ VIP 订阅系统
- ✅ 推广员系统
- ✅ 数据库数据正常加载

### 后台管理 (tinytale-admin)
- ✅ 管理员登录系统
- ✅ 短剧管理（CRUD）
- ✅ 用户管理
- ✅ 订单管理
- ✅ 推广员管理
- ✅ 系统设置

### 后端 API (tinytale-api)
- ✅ RESTful API
- ✅ JWT 认证
- ✅ MongoDB 数据库
- ✅ Stripe 支付集成
- ✅ Cloudflare Stream 视频托管
- ✅ CORS 配置正确

## 生产环境配置

### 域名
- 前端: https://tinytale.top
- 后台: https://admin.tinytale.top
- API: https://api.tinytale.top

### VPS 服务器
- IP: 93.188.160.112
- SSH 端口: 7897
- 前端路径: /var/www/tinytale/frontend
- API 路径: /var/www/tinytale/api

### 环境变量

#### 前端 (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.tinytale.top
NEXT_PUBLIC_GOOGLE_CLIENT_ID=995123954885-eslkphffjblocspkukd7l2ms49sgcmv0.apps.googleusercontent.com
```

#### API (.env)
```
PORT=7002
MONGODB_URI=mongodb://localhost:27017/tinytale
FRONTEND_URL=https://tinytale.top
ADMIN_URL=https://admin.tinytale.top
JWT_SECRET=tinytale-secret-key-2024
```

### 管理员账号
- 用户名: `oldbeck`
- 密码: `79057380aA`
- 邮箱: oldbeck@gmail.com

## 已修复的问题

1. ✅ CSP (Content Security Policy) 混合内容错误
2. ✅ CORS 跨域问题
3. ✅ GoogleOAuthProvider SSR 错误
4. ✅ 数据库数据加载问题
5. ✅ 后台管理登录问题

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: MongoDB
- **视频**: Cloudflare Stream
- **支付**: Stripe
- **部署**: PM2 + Nginx

## 部署命令

### 前端部署
```bash
cd /var/www/tinytale/frontend
git pull origin main
export NEXT_PUBLIC_API_URL=https://api.tinytale.top
npm run build
pm2 restart tinytale-web
```

### API 部署
```bash
cd /var/www/tinytale/api
git pull origin main
npm run build
pm2 restart tinytale-api
```

## 回滚到此版本

如果需要回滚到这个稳定版本：

```bash
# 前端
cd /Users/gabriel/tinytale
git checkout v1.0.0-stable

# API
cd /Users/gabriel/tinytale-api
git checkout v1.0.0-stable
```

## 下一步计划

- [ ] 性能优化
- [ ] 多语言支持
- [ ] 推荐算法优化
- [ ] 移动端优化
- [ ] SEO 优化

---

**注意**: 此版本已在生产环境验证，可以作为后续开发的基准版本。
