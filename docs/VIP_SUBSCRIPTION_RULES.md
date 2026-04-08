# TinyTale VIP 订阅规则

本文档基于当前项目中的前端实现、后台配置项、接口定义与开发文档整理，用于说明 TinyTale 当前版本的 VIP 订阅规则。

适用范围：
- 用户端 VIP 订阅页与支付流程
- 后台 VIP 套餐与权益配置
- Stripe Subscription 履约与续费逻辑

说明：
- 若前端文案、后台配置、后端计算结果存在差异，最终以服务端实际履约与播放权限判定为准。
- 本文档描述的是当前项目已实现或已定义的规则，不代表未来固定不变。

## 1. VIP 订阅定位

VIP 是 TinyTale 面向用户提供的会员订阅服务，采用 Stripe `subscription` 模式完成扣费和续费。

VIP 的核心目标：
- 为用户提供更高等级的观看权益
- 提升付费剧集转化率与续费率
- 与金币充值、单集解锁并行构成双轨付费体系

## 2. 开通入口

用户可通过以下路径进入 VIP 订阅流程：
- `/user/subscription` 会员订阅页
- 锁集播放页的 VIP 引导入口
- 付费内容相关弹窗或 CTA

用户订阅前提：
- 必须登录
- 必须选择一个有效的 VIP 套餐
- 套餐需处于 `active` 状态

## 3. VIP 套餐规则

后台支持配置多个 VIP 套餐，每个套餐包含以下字段：
- `name`：套餐名称
- `price`：价格
- `durationDays`：会员时长，单位为天
- `coins`：附赠金币数量，可为 0
- `features[]`：套餐特性说明
- `sortOrder`：展示排序
- `status`：`active / inactive`
- `stripePriceId`：默认 Stripe Price ID
- `stripePriceIds.tier1/tier2/tier3`：分层定价对应的 Stripe Price ID
- `tierPricing.tier1/tier2/tier3`：地区/价格层级定价

默认新建套餐示例：
- 名称：`New Plan`
- 价格：`9.99`
- 时长：`30` 天
- 赠送金币：`0`
- 状态：`active`

## 4. VIP 订阅开通流程

标准流程如下：
1. 用户选择 VIP 套餐
2. 前端调用 `POST /api/payment/vip/subscribe`
3. 后端获取或创建 Stripe Customer，并写入 `user.stripeCustomerId`
4. 后端创建一笔 `pending` 状态的交易记录
5. 后端创建 Stripe Checkout Session，模式为 `subscription`
6. 用户跳转到 Stripe Hosted Checkout 完成支付
7. 支付成功后，Webhook 履约创建 VIP 订阅记录，并更新用户 VIP 状态

涉及核心接口：
- `GET /api/payment/vip/plans`
- `POST /api/payment/vip/subscribe`
- `GET /api/payment/vip/status`

## 5. 会员状态规则

用户 VIP 相关状态字段：
- `user.vipStatus`
- `user.vipExpireDate`
- `user.stripeCustomerId`

订阅记录核心字段：
- `userId`
- `planId`
- `startDate`
- `endDate`
- `status`
- `autoRenew`
- `stripeSubscriptionId`

订阅状态至少包含：
- `active`：生效中
- `expired`：已过期
- `cancelled`：已取消

用户在以下情况下应被视为有效 VIP：
- `user.vipStatus === 'active'`
- 管理员账号在部分前端逻辑中也被视为拥有 VIP 访问权限

## 6. VIP 权益规则

### 6.1 当前默认权益

后台当前默认 VIP 权益配置为：
- 无广告：开启
- 高画质播放：开启
- 提前观看：默认关闭
- 金币购买折扣：`10%`
- 每月免费看剧数量：`30` 部
- 超出月度免费额度后的折扣：`50%`
- VIP 条款链接：可配置，默认留空

### 6.2 观看权益

当前项目中的 VIP 观看权益存在两层定义：

第一层，开发文档中的基础规则：
- VIP 用户可免费观看所有付费剧集

第二层，后台权益配置中的细化规则：
- VIP 用户每月可免费观看 `30` 部短剧
- 超出免费额度后，按原价享受 `50%` 折扣

因此，当前推荐按以下方式理解：
- VIP 用户对付费内容拥有优先访问权
- 是否完全免费、是否命中月度免费额度、是否改为折扣价，最终以后端 `/api/episodes/:id/access` 的访问判定结果为准

播放权限状态包括：
- `free`
- `vip`
- `unlocked`
- `locked`

### 6.3 提前观看

项目支持 `VIP Early Access / Exclusive` 能力：
- 可由后台在短剧维度开启
- 开启后，VIP 用户可比免费用户提前 `24` 小时观看相关内容

### 6.4 其他权益

用户端订阅页当前展示的典型 VIP 权益包括：
- 无广告观看
- 提前 48 小时观看新剧集
- 4K / 高清画质
- 金币充值优惠
- 每月 30 部短剧免费观看
- 超额内容半价解锁

说明：
- 展示文案中的“提前 48 小时”属于订阅页权益表达
- 后台短剧配置中的“提前 24 小时”属于内容侧早享开关说明
- 两者若不一致，应以后端实际策略为准，后续建议统一口径

## 7. 自动续费规则

VIP 订阅采用自动续费模式。

规则如下：
- 用户开通后，订阅默认按账单周期自动续费
- 当前周期结束前至少 24 小时未取消，则进入下一账期
- Stripe Webhook 接收到 `invoice.paid` 且 `billing_reason=subscription_cycle` 后，应延长订阅 `endDate`
- 用户可在账户设置中管理或取消订阅

## 8. 取消订阅规则

取消方式：
- 用户侧通过 Stripe / 账户设置进行订阅管理
- 管理后台可执行取消操作

取消后的处理：
- Webhook 接收到 `customer.subscription.deleted`
- 系统将对应 VIPSubscription 标记为 `cancelled`
- 用户后续是否立即失去权益，或在当前周期结束后失效，最终以后端处理策略为准

当前产品文案建议理解为：
- 用户可以随时取消
- 已取消的订阅通常在当前已支付周期结束后不再续费

## 9. 履约与异常规则

### 9.1 支付成功履约

Webhook 事件：
- `checkout.session.completed`
- `invoice.paid`

处理目标：
- 标记交易成功
- 创建或更新 VIP 订阅记录
- 更新用户 VIP 状态与到期时间

### 9.2 取消与失效

Webhook 事件：
- `customer.subscription.deleted`
- `checkout.session.expired`

处理目标：
- 标记订阅取消或支付会话失效
- 防止未支付成功的订阅被错误生效

### 9.3 异常处理

用户端在下列情况展示失败或兜底提示：
- 创建 checkout 失败
- 服务不可用
- 网络连接失败
- 支付成功页验单失败

对应策略：
- 提示用户稍后重试
- 支持通过订阅状态接口重新确认
- 用户资料刷新后同步最新 VIP 状态

## 10. 后台可配置项

后台当前支持配置的 VIP 相关内容包括：

### 10.1 套餐配置
- 套餐名称
- 套餐价格
- 订阅时长
- 附赠金币
- 功能特性列表
- 展示排序
- 上下架状态
- Stripe Price ID
- 分层定价与不同 tier 的 Stripe Price ID

### 10.2 权益配置
- 是否无广告
- 是否高画质
- 是否提前观看
- 金币购买折扣比例
- 每月免费看剧数量
- 超额折扣比例
- VIP 服务条款链接

### 10.3 管理动作
- 查看订阅列表
- 查看单条订阅详情
- 取消订阅
- 在用户详情页手动调整 VIP（延长 / 升级 / 降级 / 取消）

## 11. 对账与数据记录

涉及主要数据表：
- `vip_plans`
- `vip_subscriptions`
- `transactions`
- `users`

交易记录中与 VIP 相关的典型信息：
- 交易类型 `vip`
- 支付状态 `pending / completed / failed / refunded`
- Stripe Session / Subscription 关联信息

## 12. 当前口径建议

为了便于产品、运营、客服统一对外描述，当前建议采用以下版本：

### 对外展示口径
- VIP 为自动续费会员服务
- 支持免广告、高画质、会员专属内容与优先观看
- 每月可免费观看一定数量短剧，超额内容享会员折扣
- 用户可在到期前至少 24 小时取消自动续费

### 对内实施口径
- 套餐、权益、价格层级均以后台配置为准
- 支付履约与续费状态以 Stripe Webhook 为主
- 观看权限最终以后端 access 接口计算结果为准

## 13. 参考实现位置

关键文件：
- `src/app/user/subscription/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/lib/api.ts`
- `AGENTS.md`

