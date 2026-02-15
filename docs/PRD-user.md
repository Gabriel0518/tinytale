# TinyTale 用户系统 PRD

## 1. 功能概述

| 功能 | 描述 |
|------|------|
| 注册/登录 | 邮箱、Google、Apple第三方登录 |
| 用户中心 | 个人资料、账户设置 |
| 收藏功能 | 收藏/取消收藏短剧 |
| 观看历史 | 记录观看历史、继续观看 |

---

## 2. 页面结构

```
/auth/login          # 登录页
/auth/register       # 注册页
/user/profile        # 个人资料
/user/favorites      # 收藏列表
/user/history        # 观看历史
```

---

## 3. 用户注册/登录

### 3.1 登录方式

| 方式 | 描述 |
|------|------|
| 邮箱登录 | 邮箱 + 密码 |
| Google登录 | OAuth 2.0 |
| Apple登录 | Sign in with Apple |

### 3.2 注册流程

```
输入邮箱 → 发送验证码 → 输入验证码 → 设置密码 → 注册成功
```

### 3.3 页面设计

```
┌─────────────────────────────────┐
│  [←]                            │
│                                 │
│         TinyTale Logo           │
│                                 │
│  [Email Input]                 │
│  [Password Input]              │
│  [Login Button]                │
│                                 │
│  ─────── Or ───────            │
│                                 │
│  [Google Login]                │
│  [Apple Login]                 │
│                                 │
│  Don't have an account? Sign Up │
└─────────────────────────────────┘
```

---

## 4. 用户中心

### 4.1 个人资料

```
┌─────────────────────────────────┐
│  [Avatar]     [Change]          │
│  Nickname                       │
│  email@example.com              │
├─────────────────────────────────┤
│  My Account                    │
│  - Edit Profile                │
│  - Change Password             │
│  - Security                   │
├─────────────────────────────────┤
│  My Activity                   │
│  - Favorites                  │
│  - History                    │
│  - Coins                      │
├─────────────────────────────────┤
│  Settings                     │
│  - Language                   │
│  - Notifications              │
│  - Dark Mode                  │
│                                │
│  [Logout]                     │
└─────────────────────────────────┘
```

---

## 5. 收藏功能

### 5.1 功能列表

- 添加/取消收藏
- 收藏列表展示
- 收藏状态实时同步

### 5.2 API

```
GET    /api/user/favorites     # 获取收藏列表
POST   /api/user/favorites     # 添加收藏
DELETE /api/user/favorites/:id # 取消收藏
```

---

## 6. 观看历史

### 6.1 功能列表

- 自动记录观看历史
- 显示观看进度
- 继续观看入口
- 清除历史

### 6.2 API

```
GET    /api/user/history      # 获取观看历史
POST   /api/user/history     # 添加观看记录
DELETE /api/user/history     # 清除历史
```

---

## 7. 验收标准

- [ ] 登录/注册流程完整
- [ ] 第三方登录可用
- [ ] 收藏功能实时同步
- [ ] 观看历史自动记录
- [ ] 用户体验流畅
