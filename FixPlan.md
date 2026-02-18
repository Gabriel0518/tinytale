# TinyTale 优化开发方案

> 策略：按「共享基础设施 → 批量扫描修复 → 按文件集中修复」分层，最大化复用，减少重复劳动
> 预计：128 个问题合并为 10 个开发批次，每批次可并行 Task 执行

---

## 总览

| 批次 | 名称 | 覆盖问题数 | 预计文件数 | 依赖 |
|------|------|-----------|-----------|------|
| B1 | 共享基础组件提取 | 18 | 15+ | 无 |
| B2 | 全局 TypeScript 安全扫描 | 12 | 10 | 无 |
| B3 | Auth 流程修复 | 14 | 5 | 无 |
| B4 | Drama Detail + Video Player 修复 | 22 | 3 | B1 |
| B5 | 首页 + 浏览 + 搜索 + 排行 修复 | 18 | 4 | B1 |
| B6 | User 页面批量修复 | 20 | 7 | B1, B2 |
| B7 | 全局无障碍(Accessibility)扫描 | 25+ | 15+ | B1-B6 |
| B8 | 全局响应式布局修复 | 10 | 8 | B1 |
| B9 | Help + Category 页面修复 | 8 | 2 | B1 |
| B10 | 性能 + SEO 优化 | 10+ | 10+ | B1-B9 |

---

## B1 — 共享基础组件提取（一次创建，全局受益）

创建 4 个共享组件/工具，直接消除 18+ 个重复问题：

### 1.1 `src/components/features/Footer.tsx`
- 统一 Footer 组件，替换 10+ 页面的重复 Footer 代码
- 动态年份 `new Date().getFullYear()`
- 响应式 `grid-cols-2 md:grid-cols-4`
- 统一社交链接、法律链接
- **消除**: P3 Footer 重复、P2 年份不一致、P2 Footer 响应式、P2 社交链接不一致

### 1.2 `src/components/ui/Toast.tsx`
- 全局 Toast 通知组件（替代 `window.alert()` 和各页面自建 toast）
- 支持 success/error/info 类型
- 自带 `role="alert"` + `aria-live="assertive"`
- 自动 cleanup setTimeout
- **消除**: P2 所有 alert() 使用、P2 Toast 无 ARIA、P2 Toast 未 cleanup

### 1.3 `src/lib/utils.ts`
- `getDramaBadge(drama)` — 统一徽章逻辑（用相对日期）
- `formatDuration(seconds)` — 统一时长格式化
- `formatPrice(amount)` — 强制 2 位小数
- `safeParam(param)` — 安全提取 `string | string[]` 参数
- **消除**: P3 getDramaBadge 重复、P1-07 硬编码日期、P3 价格格式、P3 params 类型安全

### 1.4 `src/hooks/useAuthGuard.ts`
- 统一 auth 守卫 hook：检查 `loading` + `user`，未登录时重定向
- 支持 `returnUrl` 参数
- **消除**: P1-34 hydration 重定向（coins/purchases/subscription）、P1-37 settings render 中 redirect、P2 已登录用户访问 auth 页面

**操作**: 创建 4 个新文件 → 全局替换各页面的 Footer/Toast/utils 引用

---

## B2 — 全局 TypeScript 安全扫描（批量 find-replace）

一次性扫描所有文件，批量修复：

| 修复项 | 方法 | 覆盖 |
|--------|------|------|
| `catch (err: any)` → `catch (err: unknown)` | 全局替换 + 添加 `err instanceof Error ? err.message : "..."` | P1-31 (8+ 处) |
| `as any` 类型断言 → 正确泛型 | 逐个修复 api 调用处 | P1-16, P2 TypeSafety |
| `!` 非空断言 → `?.` 可选链 | 全局搜索替换 | P1-04 |
| `history: any[]` / `user: any` → 正确类型 | profile/history 页面 | P2 TypeSafety |

**操作**: `grep -r "err: any\|as any\|: any" src/` → 逐文件修复

---

## B3 — Auth 流程修复（5 个文件集中处理）

### 3.1 Login (`auth/login/page.tsx`)
- Facebook 按钮 → 改为 Toast "Coming soon"（P0-02）
- 添加 label htmlFor/id 关联（P1-33）
- 社交按钮添加 `disabled={isLoading}`
- 已登录用户重定向（用 useAuthGuard）
- 支持 `returnUrl` 查询参数

### 3.2 Register (`auth/register/page.tsx`)
- Facebook 按钮 → Toast "Coming soon"（P1-30）
- 添加所有 `<label>` 元素（P1-32）
- 统一密码最低长度为 8（与 verify 页一致）
- 统一 accent color 为 amber（与 login 一致）

### 3.3 Reset Password (`auth/reset-password/page.tsx`)
- 验证码通过 sessionStorage 传递到 verify 页（P0-03）
- 添加成功提示 "验证码已发送"
- 验证码输入添加 `maxLength={6}` + `inputMode="numeric"`

### 3.4 Reset Password Verify (`auth/reset-password/verify/page.tsx`)
- 从 sessionStorage 读取验证码（P0-03 + P0-04）
- 无 email/code 时重定向回 reset-password
- 重置成功后传 `?reset=success` 到 login 页显示提示
- 统一 accent color

### 3.5 AuthContext (`lib/authContext.tsx`)
- 添加 `typeof window !== 'undefined'` 守卫

---

## B4 — Drama Detail + Video Player 修复（3 个文件）

### 4.1 Drama Detail (`drama/[id]/page.tsx`)
- 修复 favorite toggle 逻辑反转（P0-05）
- 添加 auth 检查（用 useAuthGuard hook）（P1-18）
- Episode unlock 调用 `coinsApi.unlock()`（P1-19）
- 锁定集不设置 videoUrl（P1-20）
- Suspense 包裹 useSearchParams（P1-21）
- 错误处理用 Toast 替代静默 catch（P1-22）
- 初始化 favorite 状态（P1-17）
- "Now Playing" overlay 上移避开控件
- Share 按钮用 Toast 替代 alert
- "Unlock All" 按钮改为 disabled + tooltip
- searchParams 依赖优化（提取 ep 字符串）
- videoRef.load() 移到 useEffect

### 4.2 Video Player (`drama/[id]/play/[episodeId]/page.tsx`)
- 添加 unlock 状态检查 API（P0-06）
- 添加 poster 属性（P1-25）
- 用 onPlay/onPause 同步 isPlaying（P1-23）
- 添加 not-found 状态（P1-24）
- 添加 touch 事件 + auto-hide（P1-26）
- 添加 next/prev 导航按钮（P1-27）
- 记录观看历史（P1-28）
- Fullscreen 请求改为 container（P1-29）
- 集时长显示用 formatDuration（修复 "300 min" bug）
- handleTimeUpdate 节流

### 4.3 Backend 新增端点 (`server/index.js`)
- `GET /api/user/unlocked/:episodeId` — 检查解锁状态
- `DELETE /api/user/history` — 清除历史
- `DELETE /api/user/history/:id` — 删除单条历史

---

## B5 — 首页 + 浏览 + 搜索 + 排行修复（4 个文件）

### 5.1 Homepage (`page.tsx`)
- Category pills 实现过滤逻辑（P1-01）
- "My List" 按钮接入 favorites API（P1-02）
- 移除 "Filters" 按钮（P1-03，暂不实现）
- 用 Footer 组件替换内联 footer
- useMemo 包裹 computed arrays
- EditorialBanner 加 loading 守卫

### 5.2 Browse (`browse/page.tsx`)
- "Upcoming" filter 实现（P1-05）
- categoryParam 加入 useEffect deps（P1-06）
- 用共享 getDramaBadge（P1-07）
- 滤器变更时 scrollTo top
- 用 Footer 组件替换
- useMemo 包裹 filtered

### 5.3 Search (`search/page.tsx`)
- 改用后端搜索 API（P1-08 + P1-09）
- 实现滑动窗口分页（P1-10）
- 搜索更新 URL（P1-11）
- 移除非功能按钮（Relevance/Filter）
- 用 Footer 组件替换
- 年份改为动态

### 5.4 Rankings (`rankings/page.tsx`)
- Period 参数传递给 API（P1-12）
- 移除 "Most Collected" 假数据或标注为估算（P1-13）
- daysAgo 添加 Invalid Date 守卫
- useMemo 包裹排序
- 用 Footer 组件替换

---

## B6 — User 页面批量修复（7 个文件）

所有页面统一：用 useAuthGuard 替换各自的 auth 检查，用 Footer 组件替换 footer

### 6.1 Coins (`user/coins/page.tsx`)
- 用 useAuthGuard（P1-34）
- 包装 grid 响应式（P1-40）
- fallback packages 时禁用支付按钮
- 用 Toast 组件替换自建 toast

### 6.2 Favorites (`user/favorites/page.tsx`)
- sort "newest" 改用日期字段排序
- remove 添加 undo toast
- 用 `<Image>` 替换 `<img>`

### 6.3 History (`user/history/page.tsx`)
- remove/clear 接入后端 API（P1-35）
- 用确定性值替换 Math.random()
- 用 _id 替换 index 做删除
- 添加 "Older" 时间分组

### 6.4 Profile (`user/profile/page.tsx`)
- 移除未使用的 imports（P1-39）
- WalletTab 接入真实交易 API
- 修复 `any` 类型
- "Redeem Code" 按钮链接到 /user/coins

### 6.5 Purchases (`user/purchases/page.tsx`)
- 用 useAuthGuard（P1-34）
- monthlySpent 添加月份过滤
- "Download Invoice" 按钮改为 disabled + "Coming soon"
- 移动端改为卡片布局

### 6.6 Settings (`user/settings/page.tsx`)
- Danger Zone 移入 security section（P0-07）
- 用 useAuthGuard 替换 render 中 redirect（P1-37）
- Preferences/Sessions 接入 API（P1-36）
- 2FA/Connected accounts 改为 "Coming soon"
- 移动端 sidebar 改为 dropdown

### 6.7 Subscription (`user/subscription/page.tsx`)
- 用 useAuthGuard（P1-34）
- VIP 过期用 selected.duration 计算（P1-38）
- paymentMethod 传给 API
- 已 VIP 时显示当前计划信息
- 移除装饰性 API 调用

---

## B7 — 全局无障碍扫描（B1-B6 完成后统一扫描）

一次性遍历所有文件，批量添加：

| 修复类型 | 方法 | 文件数 |
|----------|------|--------|
| `role="alert"` | 所有错误消息 div | 8 |
| `aria-label` | 所有 icon-only 按钮 | 15+ |
| `aria-expanded` | FAQ、mobile menu | 2 |
| `aria-pressed`/`aria-selected` | 过滤器、plan 选择 | 4 |
| `htmlFor`/`id` | 所有表单 label+input | 6 |
| `aria-hidden="true"` | 所有装饰性 SVG | 10+ |
| DramaCard `role="link"` + `tabIndex` | 1 组件 | 1 |
| Modal `role="dialog"` + focus trap | history、settings | 2 |
| Star rating `aria-label` | drama detail | 1 |
| Breadcrumb `aria-label` | drama detail | 1 |
| Video controls `aria-label` | video player | 1 |

**操作**: 用 grep 批量定位 → 逐文件添加属性

---

## B8 — 全局响应式布局修复

| 页面 | 修复 |
|------|------|
| Coins | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Purchases | 移动端卡片布局 |
| Settings | sidebar → 移动端 dropdown |
| Help | sidebar → 移动端水平滚动 |
| Video Player | episodes sidebar z-index + 移动端 bottom sheet |
| Footer (共享) | 已在 B1 中处理 |

---

## B9 — Help + Category 页面修复

### 9.1 Help (`help/page.tsx`)
- formStatus 自动重置
- footer 法律链接 scrollTo top
- `<style>` 移到 globals.css
- 用 Footer 组件替换
- contact form 2-col 响应式

### 9.2 Category (`category/page.tsx`)
- Retry 按钮用 retryCount（P1-14）
- URL 同步 selectedCategory（P1-15）
- 移除 `any` 断言（P1-16）
- 添加分页/Load More
- Suspense fallback 添加 skeleton

---

## B10 — 性能 + SEO 优化（最后批次）

### 10.1 `<img>` → `next/image` 全局替换
- 所有 drama cover images
- actor photos
- hero background image
- 预计影响 10+ 文件

### 10.2 SEO Metadata
- 每个路由添加 `layout.tsx` 或 `generateMetadata`
- 设置 title、description、OG tags

### 10.3 性能优化
- useMemo 包裹所有 computed arrays
- Video player handleTimeUpdate 节流
- 移除 subscription 装饰性 API 调用

---

## 执行建议

### 并行策略
```
Phase 1 (并行): B1 + B2 + B3          ← 基础设施 + 全局扫描 + Auth
Phase 2 (并行): B4 + B5 + B6 + B9     ← 各页面修复（依赖 B1）
Phase 3 (并行): B7 + B8               ← 全局扫描（依赖 Phase 2）
Phase 4:        B10                     ← 性能/SEO（最后）
```

### 预计工作量
- Phase 1: ~30 分钟（3 个并行 Task）
- Phase 2: ~40 分钟（4 个并行 Task）
- Phase 3: ~20 分钟（2 个并行 Task）
- Phase 4: ~15 分钟（1 个 Task）

总计约 2 小时，覆盖全部 128 个问题。
