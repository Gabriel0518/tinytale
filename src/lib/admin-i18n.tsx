"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AdminLocale = "zh" | "en";

type AdminI18nContextValue = {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  toggleLocale: () => void;
};

const ADMIN_LOCALE_STORAGE_KEY = "admin_locale";
const ADMIN_LOCALE_COOKIE_KEY = "admin_locale";
const DEFAULT_ADMIN_LOCALE: AdminLocale = "zh";

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

const TEXT_NODE_ORIGINALS = new WeakMap<Text, string>();
const ELEMENT_ATTR_ORIGINALS = new WeakMap<Element, Partial<Record<"placeholder" | "title" | "aria-label" | "value", string>>>();

const EXACT_ZH_ENTRIES: Array<[string, string]> = [
  ["Admin", "后台管理"],
  ["TinyTale Admin", "TinyTale 后台管理系统"],
  ["© 2024 TinyTale. All rights reserved.", "© 2024 TinyTale. 版权所有。"],
  ["Overview", "概览"],
  ["Dashboard", "仪表盘"],
  ["Today's Overview", "今日概览"],
  ["MANAGEMENT", "业务管理"],
  ["SYSTEM", "系统管理"],
  ["Content", "内容管理"],
  ["Users", "用户管理"],
  ["Finance", "财务管理"],
  ["Creator Management", "创作者管理"],
  ["Promotion", "推广管理"],
  ["Activity", "活动管理"],
  ["Drama Management", "短剧管理"],
  ["Dramas", "短剧"],
  ["Categories", "分类"],
  ["Rankings", "排行"],
  ["Banners", "横幅"],
  ["Hero Banners", "首页大横幅"],
  ["Comments & Reviews", "评论与评分"],
  ["User List", "用户列表"],
  ["Orders", "订单"],
  ["Subscriptions", "订阅"],
  ["Coin Records", "金币记录"],
  ["Finance Overview", "财务概览"],
  ["Promoters", "推广员"],
  ["Withdrawals", "提现"],
  ["Daily Check-in", "每日签到"],
  ["Tasks", "任务"],
  ["Campaigns", "营销活动"],
  ["Settings", "系统设置"],
  ["Information & Help Center", "信息与帮助中心"],
  ["Audit Logs", "审计日志"],
  ["Admins", "管理员"],
  ["Roles", "角色"],
  ["Creator Dashboard", "创作者仪表盘"],
  ["Applications", "申请管理"],
  ["Creator Applications", "创作者申请"],
  ["Creator List", "创作者列表"],
  ["Content Review", "内容审核"],
  ["Creator Content Review", "创作者内容审核"],
  ["Creator DMCA", "创作者 DMCA"],
  ["DMCA", "DMCA 申诉"],
  ["Revenue", "收入分析"],
  ["Creator Revenue", "创作者收入"],
  ["Bank Accounts", "银行账户"],
  ["Creator Bank Accounts", "创作者银行账户"],
  ["Payout Requests", "结算申请"],
  ["Creator Payout Requests", "创作者结算申请"],
  ["Settlements", "结算单"],
  ["Creator Settlements", "创作者结算"],
  ["Policies", "政策配置"],
  ["Creator Policies", "创作者政策"],
  ["Tickets", "工单管理"],
  ["Creator Tickets", "创作者工单"],
  ["Comments", "评论"],
  ["Review Applications", "审核申请"],
  ["Open Creator List", "打开创作者列表"],
  ["Operational dashboard for creator onboarding and lifecycle management", "创作者入驻与生命周期管理运营看板"],
  ["This dashboard follows the latest Creator Management spec and centralizes application review, bank-account blockers, risk watch items, and the first-wave management KPIs required in P1.", "该看板遵循最新创作者管理规范，集中展示申请审核、银行卡阻塞项、风险关注项以及 P1 阶段所需的核心运营指标。"],
  ["Application funnel", "申请漏斗"],
  ["A quick read on the creator review queue and where the queue is currently stalling.", "快速查看创作者审核队列的分布情况，以及当前卡点所在。"],
  ["Open queue", "打开队列"],
  ["SLA alerts", "SLA 预警"],
  ["Review items that are close to or over the documented SLA threshold.", "查看接近或超过既定 SLA 阈值的审核事项。"],
  ["Breached", "已超时"],
  ["Watch", "观察中"],
  ["Creator highlights", "重点创作者"],
  ["Top active creators by current monthly revenue and title output.", "按本月收入和内容产出展示当前最活跃的创作者。"],
  ["View all", "查看全部"],
  ["Finance watchlist", "财务关注列表"],
  ["Creators whose payouts still have unresolved blockers from banking or risk flows.", "仍存在银行卡或风险流程阻塞，导致无法结算的创作者列表。"],
  ["Bank review", "银行审核"],
  ["Recent activity", "最近活动"],
  ["Recent review, compliance, and finance events touching the Creator module.", "最近与创作者模块相关的审核、合规与财务事件。"],
  ["Applications still waiting on admin review.", "仍在等待后台审核的申请数量。"],
  ["Approved creators with monetization access.", "已通过审核并具备变现权限的创作者数量。"],
  ["Creator accounts with active operational restrictions.", "当前存在运营限制的创作者账号数量。"],
  ["Payout accounts still blocking finance operations.", "仍在阻塞财务操作的收款账户数量。"],
  ["Time", "时间"],
  ["Actor", "操作者"],
  ["Action", "动作"],
  ["Summary", "摘要"],
  ["Search", "搜索"],
  ["Search...", "搜索..."],
  ["Logout", "退出登录"],
  ["Admin User", "管理员"],
  ["Super Admin", "超级管理员"],
  ["Verifying authentication...", "正在验证登录状态..."],
  ["Welcome back, please login to your account.", "欢迎回来，请登录后台账户。"],
  ["Username", "用户名"],
  ["Password", "密码"],
  ["Remember me", "记住我"],
  ["Signing in...", "登录中..."],
  ["Sign in", "登录"],
  ["Hide password", "隐藏密码"],
  ["Show password", "显示密码"],
  ["Enter your password", "请输入密码"],
  ["All rights reserved.", "版权所有。"],
  ["Please enter both username and password.", "请输入用户名和密码。"],
  ["Invalid username or password", "用户名或密码错误"],
  ["Access denied. Admin privileges required.", "拒绝访问，需要管理员权限。"],
  ["Login failed. Please check your credentials.", "登录失败，请检查账号信息。"],
  ["Real-time monitoring", "实时监控"],
  ["TOTAL USERS", "总用户数"],
  ["TOTAL REVENUE", "总收入"],
  ["TOTAL DRAMAS", "短剧总数"],
  ["TOTAL EPISODES", "剧集总数"],
  ["NEW USERS (7D)", "近 7 日新增用户"],
  ["New Users", "新增用户"],
  ["New Users (7 Days)", "近 7 日新增用户"],
  ["Revenue (7 Days)", "近 7 日收入"],
  ["Recent Transactions", "最近交易"],
  ["User", "用户"],
  ["Type", "类型"],
  ["Amount", "金额"],
  ["Status", "状态"],
  ["Date", "日期"],
  ["No data yet", "暂无数据"],
  ["No transactions yet", "暂无交易记录"],
  ["Filters", "筛选器"],
  ["Apply Filter", "应用筛选"],
  ["Apply Filters", "应用筛选"],
  ["Reset", "重置"],
  ["Export", "导出"],
  ["User Data", "用户数据"],
  ["User ID", "用户 ID"],
  ["Email", "邮箱"],
  ["Nickname", "昵称"],
  ["Registration Date", "注册时间"],
  ["Member Status", "会员状态"],
  ["Total Recharge $", "累计充值金额 $"],
  ["Reg. Method", "注册方式"],
  ["Account Status", "账号状态"],
  ["All Status", "全部状态"],
  ["VIP", "VIP"],
  ["Standard", "普通用户"],
  ["All Methods", "全部方式"],
  ["Total Users", "用户总数"],
  ["Registration Time", "注册时间"],
  ["Last Login", "最后登录"],
  ["Coins", "金币"],
  ["Recharge", "充值"],
  ["Tag", "标签"],
  ["Active", "正常"],
  ["Banned", "封禁"],
  ["Google", "Google"],
  ["Apple", "Apple"],
  ["No users found", "未找到用户"],
  ["No data found", "未找到数据"],
  ["No results found", "未找到结果"],
  ["Cancel", "取消"],
  ["Delete", "删除"],
  ["Save", "保存"],
  ["Save Changes", "保存更改"],
  ["Saved successfully", "保存成功"],
  ["Failed to save changes", "保存失败"],
  ["Basic Info", "基础信息"],
  ["Payment Settings", "付费设置"],
  ["SEO & Publish", "SEO 与发布"],
  ["Translations", "翻译"],
  ["Back to Dramas", "返回短剧列表"],
  ["New Drama", "新短剧"],
  ["Manage Episodes", "管理剧集"],
  ["Translation title is required", "翻译标题不能为空"],
  ["Delete Translation", "删除翻译"],
  ["Auto Translate", "自动翻译"],
  ["Translating...", "翻译中..."],
  ["Saving...", "保存中..."],
  ["Not created", "未创建"],
  ["Manage Subtitles", "管理字幕"],
  ["Upload Subtitle", "上传字幕"],
  ["English", "英文"],
  ["Chinese", "中文"],
  ["Japanese", "日文"],
  ["Spanish", "西班牙文"],
  ["Portuguese", "葡萄牙文"],
  ["Hindi", "印地语"],
  ["Indonesian", "印尼语"],
  ["Korean", "韩文"],
  ["French", "法文"],
  ["Set as default", "设为默认"],
  ["Upload SRT/VTT", "上传 SRT/VTT"],
  ["Subtitle uploaded.", "字幕上传成功。"],
  ["Subtitle deleted.", "字幕已删除。"],
  ["Default subtitle updated.", "默认字幕已更新。"],
  ["Language", "语言"],
  ["Format", "格式"],
  ["Source", "来源"],
  ["Lines", "行数"],
  ["Default", "默认"],
  ["Actions", "操作"],
  ["Loading subtitles...", "字幕加载中..."],
  ["No subtitles uploaded yet.", "暂未上传字幕。"],
  ["Yes", "是"],
  ["No", "否"],
  ["Set Default", "设为默认"],
  ["Retry Failed", "重试失败项"],
  ["Open", "打开"],
  ["Delete this subtitle?", "确认删除这条字幕吗？"],
  ["Failed to load subtitles", "字幕加载失败"],
  ["Failed to fetch translation task status", "获取翻译任务状态失败"],
  ["Failed to upload subtitle", "字幕上传失败"],
  ["Failed to set default subtitle", "设置默认字幕失败"],
  ["Failed to delete subtitle", "删除字幕失败"],
  ["Retry failed", "重试失败"],
  ["No translation to delete for this language", "当前语言没有可删除的翻译"],
  ["Completed", "已完成"],
  ["Pending", "待处理"],
  ["Failed", "失败"],
  ["Refunded", "已退款"],
  ["Draft", "草稿"],
  ["Published", "已发布"],
  ["Rejected", "已拒绝"],
  ["Approved", "已通过"],
  ["Need More Info", "需补充资料"],
  ["Under Review", "审核中"],
  ["Pending Review", "待审核"],
  ["Changes Requested", "需修改"],
  ["Archived", "已归档"],
  ["Hidden", "隐藏"],
  ["Inactive", "停用"],
  ["Missing", "缺失"],
  ["Frozen", "冻结"],
  ["Held", "挂起"],
  ["Disputed", "争议中"],
  ["Generated", "已生成"],
  ["Confirmed", "已确认"],
  ["Paid", "已付款"],
  ["Verified", "已验证"],
  ["Low", "低"],
  ["Medium", "中"],
  ["High", "高"],
  ["Payment API", "支付接口"],
  ["Social Accounts", "社交账号"],
  ["Language & Region", "语言与地区"],
  ["Country Catalog", "国家目录"],
  ["Edit country-language mapping rules used for first-visit language detection. Existing user cookie preferences are not overridden.", "编辑首次访问时使用的国家-语言映射规则。已存在的用户 Cookie 语言偏好不会被覆盖。"],
  ["All database countries currently map to a language.", "数据库中的所有国家目前都已映射到语言。"],
  ["No plans configured yet", "尚未配置套餐"],
  ["No custom questions added yet.", "还没有添加自定义问题。"],
  ["No banners yet. Create your first banner.", "暂无横幅，创建第一个横幅吧。"],
  ["No hero banners yet. Create your first one.", "暂无首页大横幅，创建第一个吧。"],
  ["No playlists yet. Create one to get started.", "暂无播放列表，先创建一个吧。"],
  ["No trend snapshots yet. Capture snapshots to build trends.", "暂无趋势快照，请先采集快照以生成趋势。"],
  ["Language options", "语言选项"],
  ["Switch admin language", "切换后台语言"],
  ["Chinese UI", "中文界面"],
  ["English UI", "英文界面"],
  ["Review Withdrawal Request", "审核提现申请"],
  ["Promoter Details", "推广员信息"],
  ["Withdrawal Amount", "提现金额"],
  ["Effective Users", "有效用户"],
  ["Finance review policy", "财务审核策略"],
  ["No finance note on record.", "暂无财务备注。"],
  ["No bank submitted", "未提交银行信息"],
  ["No schedule", "暂无计划"],
  ["Source Subtitle (Optional)", "源字幕（可选）"],
  ["Replace Subtitle", "替换字幕"],
  ["Subtitle auto-translation completed.", "字幕自动翻译已完成。"],
  ["Subtitle auto-translation failed.", "字幕自动翻译失败。"],
  ["Upload failed", "上传失败"],
  ["I know", "我知道了"],
  ["Video upload completed", "视频上传完成"],
  ["Slicing in progress...", "正在切片中..."],
  ["Slicing progress", "切片处理进度"],
  ["Only .srt and .vtt subtitle files are supported.", "仅支持 .srt 和 .vtt 字幕文件。"],
  ["Source subtitle uploaded. It will be split together with episodes.", "源字幕已上传，自动切片时会随剧集一起拆分。"],
  ["Failed to upload subtitle file", "字幕文件上传失败"],
  ["Episode subtitle uploaded.", "单集字幕已上传。"],
  ["Failed to upload episode subtitle file", "单集字幕上传失败"],
  ["User Details", "用户详情"],
  ["User not found.", "未找到用户。"],
  ["Adjust Coins", "调整金币"],
  ["Adjust VIP", "调整 VIP"],
  ["Ban User", "封禁用户"],
  ["Unban User", "解封用户"],
  ["Ban User Account", "封禁用户账号"],
  ["Unban User Account", "解封用户账号"],
  ["Membership", "会员身份"],
  ["Coins Balance", "金币余额"],
  ["Silver Balance", "银币余额"],
  ["Total Recharge", "累计充值"],
  ["Coins Spent", "金币消耗"],
  ["Episodes Unlocked", "已解锁剧集"],
  ["Favorites", "收藏"],
  ["History", "历史记录"],
  ["Notifications", "通知"],
  ["Purchases", "购买记录"],
  ["Security", "安全"],
  ["Email", "邮箱"],
  ["Registration Method", "注册方式"],
  ["Adjust Coins Balance", "调整金币余额"],
  ["VIP Member Adjustment", "VIP 会员调整"],
  ["VIP Gold", "VIP Gold"],
  ["Extend VIP", "延长 VIP"],
  ["Upgrade VIP", "升级 VIP"],
  ["Downgrade VIP", "降级 VIP"],
  ["Cancel VIP", "取消 VIP"],
  ["Confirm Ban", "确认封禁"],
  ["Confirm Unban", "确认解封"],
  ["Visible", "可见"],
  ["Canceled", "已取消"],
  ["Disabled", "已禁用"],
  ["Never", "从未"],
  ["Just now", "刚刚"],
  ["User", "用户"],
  ["All", "全部"],
  ["Payment Method", "支付方式"],
  ["Bank Transfer", "银行转账"],
  ["Bank Name", "银行名称"],
  ["Account Holder Name", "账户持有人姓名"],
  ["Account Number", "账号"],
  ["Routing Number / SWIFT", "路由号 / SWIFT"],
  ["Bank Address", "银行地址"],
  ["Request Details", "申请详情"],
  ["Request Date", "申请日期"],
  ["Review Result", "审核结果"],
  ["Approve Request", "通过申请"],
  ["Reject Request", "拒绝申请"],
  ["Verify and proceed to payment", "核验后继续付款"],
  ["Return funds to balance", "将资金退回余额"],
  ["Confirm Review", "确认审核"],
  ["Confirm Payment", "确认付款"],
  ["Close dialog", "关闭弹窗"],
  ["Withdrawal Amount", "提现金额"],
  ["Recipient", "收款人"],
  ["Method", "方式"],
  ["Account", "账户"],
  ["Payment Time", "付款时间"],
  ["Payment Proof", "付款凭证"],
  ["Upload Proof", "上传凭证"],
  ["Remark", "备注"],
  ["Confirm payment", "确认付款"],
  ["Reset Password", "重置密码"],
  ["Securely update access credentials.", "安全更新访问凭证。"],
  ["Target Administrator", "目标管理员"],
  ["New Password", "新密码"],
  ["Generate", "生成"],
  ["Strength:", "强度："],
  ["Weak", "弱"],
  ["Fair", "一般"],
  ["Good", "良好"],
  ["Strong", "强"],
  ["Min 8 chars, mixed case & numbers.", "至少 8 位，需包含大小写字母和数字。"],
  ["Confirm New Password", "确认新密码"],
  ["Passwords do not match.", "两次输入的密码不一致。"],
  ["Send new password via email", "通过邮箱发送新密码"],
  ["Resetting...", "重置中..."],
  ["Confirm Reset", "确认重置"],
  ["Failed to reset password", "重置密码失败"],
  ["Task Configuration", "任务配置"],
  ["Configure task details, rewards, and conditions.", "配置任务详情、奖励与触发条件。"],
  ["Task Name", "任务名称"],
  ["Task Type", "任务类型"],
  ["Trigger Event", "触发事件"],
  ["Select type", "选择类型"],
  ["Select trigger", "选择触发事件"],
  ["Task Description", "任务说明"],
  ["Sort Weight", "排序权重"],
  ["Task Status", "任务状态"],
  ["Enable or disable this task immediately", "立即启用或停用该任务"],
  ["Save Task", "保存任务"],
  ["Daily", "每日"],
  ["Newbie", "新手"],
  ["Achievement", "成就"],
  ["Watch", "观看"],
  ["Share", "分享"],
  ["Favorite", "收藏"],
  ["Invite", "邀请"],
  ["Rate", "评分"],
  ["Complete Profile", "完善资料"],
  ["Activity Name", "活动名称"],
  ["Activity Type", "活动类型"],
  ["Time Range", "时间范围"],
  ["Applicable Tiers", "适用档位"],
  ["Extra Coins", "额外金币"],
  ["Discount", "折扣"],
  ["Save Configuration", "保存配置"],
  ["Upload complete", "上传完成"],
  ["Cancel upload", "取消上传"],
  ["Review Application", "审核申请"],
  ["Applicant Details", "申请人信息"],
  ["Applied Date", "申请日期"],
  ["Total Promoted", "累计推广"],
  ["Decision", "审核决定"],
  ["Rejection Reason", "拒绝原因"],
  ["Reject Application", "拒绝申请"],
  ["Approve Application", "通过申请"],
  ["Ban Promoter", "封禁推广员"],
  ["Unban Promoter", "解封推广员"],
  ["Reason", "原因"],
  ["Review context", "审核上下文"],
  ["Current status", "当前状态"],
  ["Open blockers", "待处理阻塞项"],
  ["Reviewer action", "审核操作"],
  ["Approve application", "通过申请"],
  ["Request more information", "要求补充资料"],
  ["Reject application", "拒绝申请"],
  ["Save review decision", "保存审核决定"],
  ["Attachment preview", "附件预览"],
  ["Open in new tab", "新标签页打开"],
  ["Close", "关闭"],
  ["Primary language", "主要语言"],
  ["Genres", "题材"],
  ["English (en)", "英文 (en)"],
  ["Español (es)", "西班牙语 (es)"],
  ["Português (pt)", "葡萄牙语 (pt)"],
  ["中文 (zh)", "中文 (zh)"],
  ["日本語 (ja)", "日语 (ja)"],
  ["हिन्दी (hi)", "印地语 (hi)"],
  ["Indonesia (id)", "印尼语 (id)"],
  ["한국어 (ko)", "韩语 (ko)"],
  ["Français (fr)", "法语 (fr)"],
  ["Country Catalog Management", "国家目录管理"],
  ["Language & Region Mapping Rules", "语言与地区映射规则"],
  ["Activity Name", "活动名称"],
  ["Summer Flash Sale 2023", "2023 夏日限时特惠"],
  ["Review note", "审核备注"],
  ["Review Withdrawal Request", "审核提现申请"],
  ["Promoter Details", "推广员信息"],
  ["Total Commission", "累计佣金"],
  ["Available Balance", "可用余额"],
  ["Request Details", "申请详情"],
  ["Request Date", "申请日期"],
  ["Payment Method", "支付方式"],
  ["Review Result", "审核结果"],
  ["Standard", "普通"],
  ["Professional", "专业"],
  ["Basic rewards", "基础奖励"],
  ["Custom commission", "自定义佣金"],
  ["Adjust Promoter Level", "调整推广员等级"],
  ["Update commission tiers and privileges", "更新佣金等级和权限"],
  ["Total Users", "总用户数"],
  ["Joined", "加入时间"],
  ["Earnings", "收益"],
  ["New Level Selection", "新等级选择"],
  ["Current Level", "当前等级"],
  ["Commission Rate", "佣金比例"],
  ["Please describe why you are changing the promoter level...", "请说明调整该推广员等级的原因..."],
  ["This will restore the promoter's access to the affiliate system.", "这将恢复该推广员对联盟系统的访问权限。"],
  ["This will suspend the promoter's access to the affiliate system. They will not be able to earn commissions or withdraw funds.", "这将暂停该推广员对联盟系统的访问权限。封禁后将无法赚取佣金或申请提现。"],
  ["Reason for unbanning...", "请输入解封原因..."],
  ["Reason for banning...", "请输入封禁原因..."],
  ["Confirm Payment", "确认付款"],
  ["Click to upload screenshot", "点击上传截图"],
  ["SVG, PNG, JPG or GIF (max. 5MB)", "支持 SVG、PNG、JPG 或 GIF（最大 5MB）"],
  ["Add any notes about this transaction...", "填写这笔交易的补充说明..."],
  ["Remove file", "移除文件"],
  ["e.g., Incorrect bank account information provided...", "例如：银行账户信息有误..."],
  ["Explain why this application is being rejected...", "请说明拒绝该申请的原因..."],
  ["Coin Consumption Records", "金币消费记录"],
  ["Search user name or email...", "搜索用户名或邮箱..."],
  ["Page Total:", "本页合计："],
  ["Total Records:", "总记录数："],
  ["Coins Spent", "消耗金币"],
  ["Time", "时间"],
  ["No records found", "未找到记录"],
  ["User List", "用户列表"],
  ["Search email...", "搜索邮箱..."],
  ["Search nickname...", "搜索昵称..."],
  ["User Data", "用户数据"],
  ["Reg. Time", "注册时间"],
  ["Order No.", "订单号"],
  ["Product", "商品"],
  ["Coins Received", "到账金币"],
  ["View", "查看"],
  ["No consumption records found", "暂无消费记录"],
  ["No playback records found", "暂无播放记录"],
  ["No watchlist items found", "暂无收藏记录"],
  ["No comments found", "暂无评论记录"],
  ["No login logs found", "暂无登录日志"],
  ["No operation logs found", "暂无操作日志"],
  ["Search Order ID...", "搜索订单号..."],
  ["Coin Adjustment", "金币调整"],
  ["Current Balance", "当前余额"],
  ["Wallet", "钱包"],
  ["Gold Coins", "金币"],
  ["Silver Coins", "银币"],
  ["Add Coins (+)", "增加金币 (+)"],
  ["Deduct Coins (-)", "扣减金币 (-)"],
  ["Select a reason...", "请选择原因..."],
  ["Compensation", "补偿"],
  ["Promotion", "活动奖励"],
  ["Manual Adjustment", "手动调整"],
  ["Other", "其他"],
  ["Edit Administrator", "编辑管理员"],
  ["Update staff account details and permissions.", "更新后台成员账号信息与权限。"],
  ["Username cannot be changed once created.", "用户名创建后不可修改。"],
  ["Full name", "姓名"],
  ["Role Permission", "角色权限"],
  ["Select a role", "选择角色"],
  ["Grants access to content management and user operations.", "授予内容管理与用户运营相关权限。"],
  ["Password Management", "密码管理"],
  ["Disable to temporarily block access.", "关闭后将临时禁止该账号访问后台。"],
  ["Configure Recharge Activity", "配置充值活动"],
  ["Set up promotional rules for user recharges", "设置用户充值活动的促销规则"],
  ["e.g., Summer Flash Sale 2023", "例如：2023 夏日闪购"],
  ["Select type...", "选择类型..."],
  ["Applicable Tiers", "适用档位"],
  ["Selected:", "已选择："],
  ["Select All", "全选"],
  ["tiers", "个档位"],
  ["Promotion Details", "促销详情"],
  ["Promotion Type", "促销类型"],
  ["Extra Coins", "额外金币"],
  ["Bonus Value", "奖励数值"],
  ["Users will receive this amount as bonus.", "用户将获得该奖励数值。"],
  ["Limit Per User", "单用户限制"],
  ["Max times a single user can claim this offer.", "单个用户可领取该活动的最大次数。"],
  ["Activity Status", "活动状态"],
  ["Enable to make this activity live immediately", "开启后该活动会立即生效"],
  ["Task Configuration", "任务配置"],
  ["e.g. Daily Check-in", "例如：每日签到"],
  ["times", "次"],
  ["Number of times user must perform action.", "用户需要完成该动作的次数。"],
  ["Coins awarded upon completion.", "完成后发放的金币奖励。"],
  ["Describe the task clearly for the user...", "请为用户清晰描述任务内容..."],
  ["Hero Banner Management", "首页大横幅管理"],
  ["Configure homepage top carousel banners", "配置首页顶部轮播横幅"],
  ["No hero banners yet. Create your first one.", "暂无首页大横幅，创建第一个吧。"],
  ["Duration:", "时长："],
  ["Pos:", "位置："],
  ["Category Management", "分类管理"],
  ["Total Count", "总数量"],
  ["Active Categories", "已启用分类"],
  ["Linked Dramas", "关联短剧"],
  ["Search categories...", "搜索分类..."],
  ["Confirm Delete", "确认删除"],
  ["Unlink all dramas before deleting.", "删除前请先解除与所有短剧的关联。"],
  ["Category name", "分类名称"],
  ["Icon (emoji or key)", "图标（emoji 或 key）"],
  ["e.g. heart, star, or paste emoji", "例如：heart、star，或直接粘贴 emoji"],
  ["Reward Schedule", "奖励日历"],
  ["Icon Preview", "图标预览"],
  ["Reward Amount (Coins)", "奖励金币"],
  ["Bonus Item", "额外奖励"],
  ["Auto-Reset Cycle", "自动重置周期"],
  ["Live Preview", "实时预览"],
  ["Portfolio quality is strong. Verify the government ID match against the payout name before approval.", "作品集质量较强。批准前请核对政府证件姓名与收款账户姓名是否一致。"],
  ["Document names align with the applicant record.", "证件姓名与申请记录一致。"],
  ["Social links show original episodic storytelling content.", "社交链接展示了原创分集短剧内容。"],
  ["Applicant confirmed rights ownership in submission.", "申请人已在提交材料中确认内容权利归属。"],
  ["Latest agreement version accepted in-page.", "已在页面中接受最新协议版本。"],
  ["No prior strikes or payment anomalies found.", "未发现历史违规或支付异常。"],
  ["Application submitted", "已提交申请"],
  ["Entered creator application queue.", "已进入创作者申请队列。"],
  ["Assigned reviewer", "已指派审核人"],
  ["Initial verification started.", "已开始初步审核。"],
  ["Business ID scan is blurry and the payout account holder does not match the company legal name.", "营业执照扫描件不清晰，且收款账户持有人与公司法定名称不一致。"],
  ["Business license requires a clearer scan.", "营业执照需要更清晰的扫描件。"],
  ["Studio portfolio contains original fantasy series.", "工作室作品集包含原创奇幻系列内容。"],
  ["Ownership declaration submitted.", "已提交权属声明。"],
  ["Accepted under company representative.", "已由公司代表接受协议。"],
  ["Payout holder mismatch needs clarification.", "收款账户持有人不匹配，需要进一步说明。"],
  ["Company application entered queue.", "公司申请已进入审核队列。"],
  ["Need more information", "需要更多资料"],
  ["Requested clearer license and payout holder proof.", "已要求补交更清晰的营业执照和收款账户持有人证明。"],
  ["Approved and activated. Ready for contract issuance.", "已通过并激活，可进入合同签发阶段。"],
  ["Passport validated.", "护照已验证。"],
  ["Existing audience and samples verified.", "现有受众和样片已验证。"],
  ["Ownership declaration completed.", "权属声明已完成。"],
  ["Signed under current agreement version.", "已按当前协议版本签署。"],
  ["No exception found.", "未发现异常。"],
  ["Application approved", "申请已通过"],
  ["Creator access enabled.", "已开通创作者访问权限。"],
  ["Provide rights chain for submitted portfolio", "请补充提交作品集的权利链证明"],
  ["Rejected due to unclear content rights ownership across two portfolio titles.", "由于两部作品集内容的版权归属不清晰，申请被拒绝。"],
  ["Company registration is valid.", "公司注册信息有效。"],
  ["Portfolio titles reference third-party distributors.", "作品集内容涉及第三方发行方。"],
  ["Rights chain was incomplete.", "权利链材料不完整。"],
  ["Agreement was accepted.", "协议已接受。"],
  ["Escalated for rights compliance.", "已升级至版权合规审核。"],
  ["Application rejected", "申请已拒绝"],
  ["Rejected due to missing rights chain evidence.", "因缺少权利链证明材料，申请被拒绝。"],
  ["Creator focused on premium romance micro-dramas with cliffhanger-heavy pacing.", "创作者专注于高品质爱情微短剧，擅长高悬念节奏。"],
  ["Gross unlock revenue attributed to creator titles in the current admin window.", "当前后台时间窗口内归属于创作者作品的解锁总收入。"],
  ["The admin routes are aligned to the Creator portal spec, so these screens can attach to `/api/admin/*` without path drift later.", "后台路由已与创作者门户规范对齐，这些页面后续可直接接入 `/api/admin/*` 而无需调整路径。"],
  ["United States", "美国"],
  ["Canada", "加拿大"],
  ["United Kingdom", "英国"],
  ["Australia", "澳大利亚"],
  ["Romance", "爱情"],
  ["Drama", "剧情"],
  ["Fantasy", "奇幻"],
  ["Thriller", "惊悚"],
  ["Comedy", "喜剧"],
  ["Slice of Life", "生活"],
];

const EXACT_ZH_MAP: Record<string, string> = Object.fromEntries(EXACT_ZH_ENTRIES);

const EXACT_ZH_MAP_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(EXACT_ZH_MAP).map(([key, value]) => [key.toLowerCase(), value])
);

const REGEX_ZH_RULES: Array<[RegExp, (...matches: string[]) => string]> = [
  [/^Episode (\d+) — (.+)$/i, (_, episodeNumber, title) => `第 ${episodeNumber} 集 - ${title}`],
  [/^Saved ([a-z]{2}) translation$/i, (_, language) => `已保存 ${language.toUpperCase()} 翻译`],
  [/^Deleted ([a-z]{2}) translation$/i, (_, language) => `已删除 ${language.toUpperCase()} 翻译`],
  [/^Auto translated to ([a-z]{2})$/i, (_, language) => `已自动翻译为 ${language.toUpperCase()}`],
  [/^Delete ([a-z]{2}) translation\?$/i, (_, language) => `确认删除 ${language.toUpperCase()} 翻译吗？`],
  [/^Showing (\d+)-(\d+) of ([\d,]+) logs$/i, (_, start, end, total) => `显示第 ${start}-${end} 条，共 ${total} 条日志`],
  [/^Showing (\d+) to (\d+) of ([\d,]+) orders$/i, (_, start, end, total) => `显示第 ${start} 到 ${end} 条，共 ${total} 笔订单`],
  [/^Total Users:\s*(.+)$/i, (_, total) => `用户总数：${total}`],
  [/^Total Orders:\s*(.+)$/i, (_, total) => `订单总数：${total}`],
  [/^Adaptive Applied:\s*(.+)$/i, (_, total) => `已启用自适应定价：${total}`],
  [/^Owner:\s*(.+)$/i, (_, owner) => `负责人：${owner}`],
  [/^Due (.+)$/i, (_, date) => `截止 ${date}`],
  [/^Last run:\s*(.+)$/i, (_, date) => `最近运行：${date}`],
  [/^Processing\.\.\.$/i, () => "处理中..."],
  [/^Uploading\.\.\.$/i, () => "上传中..."],
  [/^Loading\.\.\.$/i, () => "加载中..."],
  [/^Translation in progress\.\.\.$/i, () => "翻译进行中..."],
  [/^Auto translation started for (\d+) language\(s\)\.$/i, (_, count) => `已启动自动翻译，目标语言 ${count} 个。`],
  [/^Retry task started for (\d+) language\(s\)\.$/i, (_, count) => `已启动重试任务，目标语言 ${count} 个。`],
  [/^Refund processed successfully$/i, () => "退款处理成功"],
  [/^Refund failed\. Please try again\.$/i, () => "退款失败，请重试。"],
  [/^No payout requests match the current filters\.$/i, () => "当前筛选条件下没有结算申请。"],
  [/^No bank accounts match the current filters\.$/i, () => "当前筛选条件下没有银行账户。"],
  [/^No creators match the current filters\.$/i, () => "当前筛选条件下没有创作者。"],
  [/^No phone provided$/i, () => "未提供手机号"],
  [/^No blockers$/i, () => "无阻塞项"],
  [/^Risk item (\d+)$/i, (_, index) => `风险项 ${index}`],
  [/^Primary language$/i, () => "主要语言"],
  [/^Review note$/i, () => "审核备注"],
  [/^Agreement version$/i, () => "协议版本"],
  [/^Signature name$/i, () => "签署姓名"],
  [/^Signed at$/i, () => "签署时间"],
  [/^Risk level$/i, () => "风险等级"],
  [/^Application status$/i, () => "申请状态"],
  [/^Assigned reviewer$/i, () => "指派审核人"],
  [/^Current risk signals$/i, () => "当前风险信号"],
  [/^Open review blockers$/i, () => "待处理阻塞项"],
  [/^Supporting reference$/i, () => "辅助材料"],
  [/^Uploaded attachments$/i, () => "已上传附件"],
  [/^Portfolio links$/i, () => "作品集链接"],
  [/^Reference materials$/i, () => "参考材料"],
  [/^Agreement acceptance evidence$/i, () => "协议接受证明"],
  [/^Risk screening evidence$/i, () => "风险筛查证明"],
  [/^Identity verification evidence$/i, () => "身份验证材料"],
  [/^Portfolio and content sample evidence$/i, () => "作品集与内容样本材料"],
  [/^Content-rights declaration evidence$/i, () => "内容权利声明材料"],
  [/^Agreement submission$/i, () => "协议提交信息"],
  [/^Rights declaration$/i, () => "权利声明"],
  [/^Uploaded one source subtitle file and it will be split with episodes during auto-split\.$/i, () => "上传一份源字幕文件后，自动切片时会随剧集一起拆分。"],
  [/^Upload a source subtitle file to quickly reuse language settings while assigning per-episode subtitles\.$/i, () => "上传源字幕文件后，设置单集字幕时可快速复用语言配置。"],
  [/^(\d+) orders$/i, (_, count) => `${count} 笔订单`],
  [/^(\d+) unlocks$/i, (_, count) => `${count} 次解锁`],
  [/^(.+) published titles$/i, (_, count) => `已发布 ${count} 部作品`],
  [/^Request ID: #(.+)$/i, (_, id) => `申请 ID：#${id}`],
  [/^Email:\s*(.+)$/i, (_, value) => `邮箱：${value}`],
  [/^Reg:\s*(.+)$/i, (_, value) => `注册：${value}`],
  [/^Expires:\s*(.+)$/i, (_, value) => `到期：${value}`],
  [/^Requested (.+)$/i, (_, value) => `申请时间 ${value}`],
  [/^Strength:\s*(.+)$/i, (_, value) => `密码强度：${value}`],
  [/^ID:\s*(.+)$/i, (_, value) => `ID：${value}`],
  [/^Joined (.+)$/i, (_, value) => `加入于 ${value}`],
  [/^Ref (.+)$/i, (_, value) => `参考号 ${value}`],
  [/^Selected:\s*(\d+) tiers$/i, (_, count) => `已选择：${count} 个档位`],
  [/^Duration:\s*(.+)$/i, (_, value) => `时长：${value}`],
  [/^Pos:\s*(.+)$/i, (_, value) => `位置：${value}`],
  [/^(.+) is required\.$/i, (_, value) => `${value}为必填项。`],
  [/^Unknown applicant$/i, () => "未知申请人"],
  [/^Unknown$/i, () => "未知"],
];

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeAdminLocale(value: string | null | undefined): AdminLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("en")) return "en";
  return null;
}

function getCookieValue(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getStoredAdminLocale(): AdminLocale {
  if (!isBrowser()) return DEFAULT_ADMIN_LOCALE;

  const adminStorageLocale = normalizeAdminLocale(window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY));
  if (adminStorageLocale) return adminStorageLocale;

  const adminCookieLocale = normalizeAdminLocale(getCookieValue(ADMIN_LOCALE_COOKIE_KEY));
  if (adminCookieLocale) return adminCookieLocale;

  const userStorageLocale = normalizeAdminLocale(window.localStorage.getItem("user_lang"));
  if (userStorageLocale) return userStorageLocale;

  const userCookieLocale = normalizeAdminLocale(getCookieValue("user_lang"));
  if (userCookieLocale) return userCookieLocale;

  return DEFAULT_ADMIN_LOCALE;
}

export function getAdminLocaleTag(locale: AdminLocale): "zh-CN" | "en-US" {
  return locale === "zh" ? "zh-CN" : "en-US";
}

export function formatAdminDate(
  value: string | number | Date | null | undefined,
  locale: AdminLocale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getAdminLocaleTag(locale), options).format(date);
}

export function formatAdminDateTime(
  value: string | number | Date | null | undefined,
  locale: AdminLocale,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getAdminLocaleTag(locale), options).format(date);
}

export function formatAdminCurrency(
  value: number,
  locale: AdminLocale,
  currencyCode = "USD",
  options: Intl.NumberFormatOptions = {}
) {
  const normalized = (currencyCode || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(getAdminLocaleTag(locale), {
      style: "currency",
      currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(Number(value || 0));
  } catch {
    return `${normalized} ${Number(value || 0).toFixed(2)}`;
  }
}

export function formatAdminNumber(
  value: number,
  locale: AdminLocale,
  options: Intl.NumberFormatOptions = {}
) {
  return new Intl.NumberFormat(getAdminLocaleTag(locale), options).format(Number(value || 0));
}

export function formatAdminTimeAgo(
  value: string | number | Date | null | undefined,
  locale: AdminLocale
) {
  if (!value) return locale === "zh" ? "从未" : "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return locale === "zh" ? "刚刚" : "Just now";
  if (mins < 60) return locale === "zh" ? `${mins} 分钟前` : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "zh" ? `${hours} 小时前` : `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "zh" ? `${days} 天前` : `${days} days ago`;
  const months = Math.floor(days / 30);
  return locale === "zh" ? `${months} 个月前` : `${months} months ago`;
}

function persistAdminLocale(locale: AdminLocale) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, locale);
  document.cookie = `${ADMIN_LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function preserveWhitespace(source: string, translated: string): string {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateTrimmedText(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return source;

  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{4})/i;
  if (datePattern.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      const nextDate = new Date(parsed);
      const translatedDate = trimmed.includes(":")
        ? new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(nextDate)
        : new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(nextDate);
      return preserveWhitespace(source, translatedDate);
    }
  }

  const exact = EXACT_ZH_MAP[trimmed] || EXACT_ZH_MAP_LOWER[trimmed.toLowerCase()];
  if (exact) {
    return preserveWhitespace(source, exact);
  }

  for (const [pattern, resolver] of REGEX_ZH_RULES) {
    if (pattern.test(trimmed)) {
      const translated = trimmed.replace(pattern, (...args) =>
        resolver(...args.slice(0, -2).map((item) => String(item)))
      );
      return preserveWhitespace(source, translated);
    }
  }

  return source;
}

export function translateAdminText(value: string, locale: AdminLocale): string {
  if (locale === "en" || !value) return value;
  return translateTrimmedText(value);
}

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("[data-admin-i18n-controlled='true']")) return true;
  const tagName = parent.tagName;
  return (
    tagName === "SCRIPT" ||
    tagName === "STYLE" ||
    tagName === "NOSCRIPT" ||
    tagName === "TEXTAREA" ||
    tagName === "CODE" ||
    tagName === "PRE" ||
    tagName === "SVG" ||
    tagName === "PATH"
  );
}

function translateTextNode(node: Text, locale: AdminLocale) {
  if (shouldSkipTextNode(node)) return;
  const current = node.nodeValue || "";
  if (!TEXT_NODE_ORIGINALS.has(node)) {
    TEXT_NODE_ORIGINALS.set(node, current);
  }
  const original = TEXT_NODE_ORIGINALS.get(node) || current;
  const next = locale === "zh" ? translateAdminText(original, locale) : original;
  if (next !== current) {
    node.nodeValue = next;
  }
}

function translateElementAttributes(element: Element, locale: AdminLocale) {
  if (element.closest("[data-admin-i18n-controlled='true']")) return;

  const attrNames: Array<"placeholder" | "title" | "aria-label"> = ["placeholder", "title", "aria-label"];
  const originals = ELEMENT_ATTR_ORIGINALS.get(element) || {};

  attrNames.forEach((attrName) => {
    const attrValue = element.getAttribute(attrName);
    if (attrValue !== null && originals[attrName] === undefined) {
      originals[attrName] = attrValue;
    }
    if (originals[attrName] !== undefined) {
      const next = locale === "zh" ? translateAdminText(originals[attrName] || "", locale) : (originals[attrName] || "");
      if (element.getAttribute(attrName) !== next) {
        element.setAttribute(attrName, next);
      }
    }
  });

  if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
    if (originals.value === undefined) {
      originals.value = element.value;
    }
    const nextValue = locale === "zh" ? translateAdminText(originals.value || "", locale) : (originals.value || "");
    if (element.value !== nextValue) {
      element.value = nextValue;
    }
  }

  ELEMENT_ATTR_ORIGINALS.set(element, originals);
}

function applyAdminTranslations(root: ParentNode, locale: AdminLocale) {
  if (!isBrowser()) return;

  if (root instanceof Element) {
    translateElementAttributes(root, locale);
  }

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let currentElement = elementWalker.currentNode as Element | null;
  while (currentElement) {
    translateElementAttributes(currentElement, locale);
    currentElement = elementWalker.nextNode() as Element | null;
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentText = textWalker.nextNode() as Text | null;
  while (currentText) {
    translateTextNode(currentText, locale);
    currentText = textWalker.nextNode() as Text | null;
  }
}

function resolveAdminRoot() {
  return document.querySelector("[data-admin-i18n-root]") || document.body;
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>(DEFAULT_ADMIN_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  const setLocale = useCallback((nextLocale: AdminLocale) => {
    setLocaleState(nextLocale);
    persistAdminLocale(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh" ? "en" : "zh");
  }, [locale, setLocale]);

  useEffect(() => {
    const nextLocale = getStoredAdminLocale();
    setLocaleState(nextLocale);
    persistAdminLocale(nextLocale);
    document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : "en";
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistAdminLocale(locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    window.dispatchEvent(new CustomEvent("tinytale:admin-language-changed", { detail: { locale } }));
  }, [hydrated, locale]);

  useEffect(() => {
    if (!hydrated || !isBrowser()) return undefined;

    const root = resolveAdminRoot();
    if (!root) return undefined;

    let frame = 0;
    const scheduleTranslate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyAdminTranslations(root, locale);
      });
    };

    scheduleTranslate();

    const observer = new MutationObserver(() => {
      scheduleTranslate();
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "value"],
    });

    return () => {
      observer.disconnect();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [hydrated, locale]);

  const value = useMemo<AdminI18nContextValue>(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale]
  );

  return (
    <AdminI18nContext.Provider value={value}>
      {hydrated ? children : null}
    </AdminI18nContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminI18nContext);
  if (!context) {
    throw new Error("useAdminLocale must be used within an AdminI18nProvider");
  }
  return context;
}
