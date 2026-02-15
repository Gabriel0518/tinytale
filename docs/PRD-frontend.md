# TinyTale 前台核心功能 PRD

## 1. 项目概述

- **项目名称**: TinyTale (ReelShort Web端)
- **类型**: Netflix风格海外竖屏短剧流媒体平台
- **目标用户**: 北美18-35岁年轻用户（主要为女性）
- **核心价值**: 高品质UI体验 + 专注竖屏短剧品类 + 金币付费模式

---

## 2. 功能模块

### 2.1 首页浏览 (Home Page)

#### 功能列表
- 顶部导航栏（Logo、搜索、分类、用户头像）
- 横幅轮播（Featured Dramas）
- 分类快捷入口
- 短剧列表（Grid/List View）
- 无限滚动加载
- 下拉刷新

#### 用户路径
```
用户进入首页 → 查看推荐 → 浏览分类 → 滚动加载更多
```

#### 边界情况
- 空数据展示
- 网络错误重试
- 加载状态（Skeleton）

---

### 2.2 分类与搜索 (Categories & Search)

#### 功能列表
- 分类页面（Category Page）
- 分类筛选（类型、年代、地区）
- 搜索功能（关键词搜索）
- 搜索历史记录
- 热门搜索推荐
- 搜索结果排序

#### 用户路径
```
用户点击分类 → 筛选条件 → 查看结果 → 点击进入详情
用户点击搜索 → 输入关键词 → 查看结果 → 点击进入详情
```

#### 边界情况
- 无搜索结果
- 关键词敏感词过滤
- 搜索防抖（300ms）

---

### 2.3 短剧详情页 (Drama Detail Page)

#### 功能列表
- 短剧封面海报
- 标题、描述、评分
- 演员阵容
- 剧集列表（季/集）
- 点赞/收藏按钮
- 分享功能
- 相关推荐

#### 用户路径
```
用户进入详情页 → 查看简介 → 浏览剧集 → 选择集数播放
```

#### 边界情况
- 未登录提示
- 剧集已解锁/未解锁状态
- 完结/连载状态

---

### 2.4 视频播放 (Video Player)

#### 功能列表
- 竖屏播放器（9:16比例）
- 播放/暂停
- 进度条拖拽
- 下一集自动播放
- 选集列表
- 全屏切换
- 画中画模式
- 倍速播放（0.5x, 1x, 1.5x, 2x）

#### 播放规则
- 前3集免费
- 后续集数需金币解锁
- 未解锁时显示预览+解锁提示

#### 用户路径
```
选择剧集 → 判断是否解锁 → 播放视频 → 看完跳转下一集
```

#### 边界情况
- 网络中断重连
- 播放失败提示
- 解锁流程

---

### 2.5 用户系统 (User System)

#### 注册/登录
- 邮箱注册
- 邮箱登录
- Google第三方登录
- Apple第三方登录
- 验证码登录
- 忘记密码

#### 用户中心
- 个人资料编辑
- 头像上传
- 账户安全（修改密码）

#### 收藏功能
- 添加/取消收藏
- 收藏列表
- 收藏同步

#### 观看历史
- 历史记录列表
- 继续观看
- 清除历史

---

### 2.6 金币付费系统 (Coins & Payment)

#### 金币充值
- 金币套餐选择（100/500/1000/2000）
- Stripe支付
- 支付成功回调
- 订单记录

#### 金币消费
- 解锁单集（固定价格）
- 解锁整季
- 赠送金币

#### 余额管理
- 当前余额显示
- 消费记录
- 充值记录

#### 支付流程
```
选择充值金额 → Stripe支付 → 支付成功 → 金币到账
选择解锁剧集 → 确认支付 → 扣除金币 → 解锁成功
```

#### 边界情况
- 支付失败
- 金币不足提示
- 重复扣款防护

---

## 3. 页面结构

```
/                           # 首页
/drama/:id                 # 短剧详情
/drama/:id/play/:episodeId # 视频播放
/category/:slug           # 分类页
/search                    # 搜索页
/user/profile              # 个人资料
/user/favorites            # 收藏列表
/user/history              # 观看历史
/user/wallet               # 金币钱包
/auth/login                # 登录
/auth/register             # 注册
```

---

## 4. API接口

### 公开接口
- `GET /api/dramas` - 获取短剧列表
- `GET /api/dramas/:id` - 获取短剧详情
- `GET /api/categories` - 获取分类列表
- `GET /api/search` - 搜索

### 用户接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/user/profile` - 获取资料
- `PUT /api/user/profile` - 更新资料
- `GET /api/user/favorites` - 获取收藏
- `POST /api/user/favorites` - 添加收藏
- `DELETE /api/user/favorites/:id` - 取消收藏
- `GET /api/user/history` - 获取历史
- `POST /api/user/history` - 添加历史

### 支付接口
- `GET /api/coins/balance` - 余额查询
- `POST /api/coins/recharge` - 充值
- `POST /api/coins/unlock` - 解锁剧集
- `GET /api/coins/history` - 消费记录

---

## 5. 数据模型

### Drama
```typescript
{
  id: string;
  title: string;
  cover: string;
  description: string;
  categories: string[];
  actors: string[];
  rating: number;
  episodes: Episode[];
  isCompleted: boolean;
  createdAt: Date;
}
```

### Episode
```typescript
{
  id: string;
  dramaId: string;
  title: string;
  episodeNumber: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  isFree: boolean;
  unlockPrice: number;
}
```

### User
```typescript
{
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  coins: number;
  createdAt: Date;
}
```

---

## 6. 验收标准

- [ ] 首页加载时间 < 2s
- [ ] 搜索响应时间 < 500ms
- [ ] 视频播放无卡顿
- [ ] 支付流程成功率 > 99%
- [ ] 响应式布局适配 PC/Mobile
- [ ] 深色主题一致性
