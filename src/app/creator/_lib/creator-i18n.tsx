"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import translationMap from "./creator-translations.generated.json";

type TranslationTable = Partial<Record<SupportedLocale, Record<string, string>>>;
type DateInput = Date | string | number | null | undefined;
type RelativeTimeStyle = "short" | "long";
type CreatorTranslateFn = (value: string, ...args: Array<string | number>) => string;

const TRANSLATIONS = translationMap as TranslationTable;

const CREATOR_UPLOAD_ZH_OVERRIDES: Record<string, string> = {
  "Upload New Drama": "上传新短剧",
  "Series details": "剧集信息",
  "Video assets": "视频素材",
  "Payment Settings": "付费设置",
  "Monetization": "变现",
  "Finalize pricing rules and make sure every episode is ready for creator review.": "完成价格设置，并确保每一集都满足创作者审核要求。",
  "General Information": "基本信息",
  "Keep metadata clean and storefront-ready. Category stays single-select, while release regions support multi-select publishing.": "请完善适合上架展示的基础信息。分类为单选，发行区域支持多选发布。",
  "Release Scope": "发行范围",
  "Drama Title": "短剧标题",
  "Enter drama title": "请输入短剧标题",
  "Description": "简介",
  "Briefly describe your series...": "请简要介绍这部短剧……",
  "Category": "分类",
  "Select a category": "请选择分类",
  "Target Regions": "发行区域",
  "Global release": "全球发行",
  "Add region...": "添加区域……",
  "Cover Image": "封面图片",
  "Upload both portrait and landscape covers. The active tab changes the recommended asset ratio and preview rendering.": "请同时上传竖版和横版封面。切换标签后会展示对应的推荐比例和预览效果。",
  "Uploading cover...": "封面上传中……",
  "Drop your image here, or browse": "将图片拖到这里，或点击浏览上传",
  "Recommended size: __ARG_0__ (PNG, JPG, max 5MB)": "建议尺寸：__ARG_0__（PNG、JPG，最大 5MB）",
  "Both cover slots need valid uploads before the drama can move to the episode step.": "竖版和横版封面都上传完成后，才可以进入剧集上传步骤。",
  "Live Preview": "实时预览",
  "Mobile storefront card": "移动端展示卡片",
  "Drama": "短剧",
  "Cover preview": "封面预览",
  "Your Drama Title Here": "你的短剧标题将显示在这里",
  "Your description will appear here as the viewer explores the app...": "观众浏览应用时，这里会显示你的短剧简介……",
  "Watch Now": "立即观看",
  "This preview mirrors the mobile storefront ratio used across the creator and consumer surfaces.": "该预览与创作者端和用户端使用的移动展示比例保持一致。",
  "Readiness": "准备情况",
  "Covers": "封面",
  "__ARG_0__ of 2 uploaded": "已上传 __ARG_0__ / 2",
  "Metadata": "元数据",
  "Category assigned": "已选择分类",
  "Category pending": "待选择分类",
  "Regions": "区域",
  "Quick Tip": "小提示",
  "High-quality cover images increase viewership and help your drama stand out in recommendation feeds.": "高质量封面能提升点击和观看表现，也更容易在推荐流中脱颖而出。",
  "Bulk Upload (Auto-Slice)": "批量上传（自动切片）",
  "Individual Upload": "单集上传",
  "Auto-Slice From One Source Video": "从单个源视频自动切片",
  "Upload one long MP4, set duration per episode, then split to episodes automatically.": "上传一个完整 MP4，设置单集时长后，系统会自动切分成多集。",
  "Creator Auto-Slice": "创作者自动切片",
  "Upload Source Video (MP4)": "上传源视频（MP4）",
  "System will transcode before slicing": "系统会先转码，再进行切片",
  "Episode Duration": "单集时长",
  "minutes / episode": "分钟 / 集",
  "Subtitle Language": "字幕语言",
  "Applies to uploaded source and episode subtitle files": "该语言会应用于源字幕文件和切片后的单集字幕文件",
  "Upload subtitles before auto-slice": "自动切片前请先上传字幕",
  "Source video upload is complete. Please upload the matching subtitle file before starting auto-slice.": "源视频已上传完成。请先上传与该视频匹配的字幕文件，再开始自动切片。",
  "Auto-slice will stay unavailable until a source subtitle is uploaded.": "在上传源字幕之前，自动切片功能将保持不可用。",
  "I understand": "我知道了",
  "Upload Source Subtitle (Required)": "上传源字幕（必填）",
  "Auto-Slicing...": "自动切片中……",
  "Start Auto-Slice": "开始自动切片",
  "Select MP4 files for bulk upload": "选择 MP4 文件进行批量上传",
  "Files will be mapped to new episodes in filename order.": "文件将按照文件名顺序映射到新建剧集。",
  "File": "文件",
  "Size": "大小",
  "Status": "状态",
  "Start Bulk Upload": "开始批量上传",
  "Stop": "停止",
  "Clear Queue": "清空队列",
  "Open Preview": "打开预览",
  "Preview Episode": "预览剧集",
  "Episode __ARG_0__": "第 __ARG_0__ 集",
  "Edit Info": "编辑信息",
  "Delete episode __ARG_0__": "删除第 __ARG_0__ 集",
  "Replace Cover": "替换封面",
  "Upload Cover": "上传封面",
  "Upload Video": "上传视频",
  "Cancel": "取消",
  "Retry status": "重试状态检查",
  "Upload Subtitle": "上传字幕",
  "Subtitle Files": "字幕文件",
  "Default": "默认",
  "View All": "查看全部",
  "Subtitle Missing": "缺少字幕",
  "Auto Translation": "自动翻译",
  "Translation task failed": "翻译任务失败",
  "Click to add new episode": "点击添加新剧集",
  "Workflow Summary": "流程概览",
  "Episodes": "剧集数",
  "Ready for review": "可提交审核",
  "Free episodes": "免费剧集",
  "Paid episodes": "付费剧集",
  "Pricing Presets": "价格预设",
  "Use a template price, then adjust individual episodes where needed. Episode 1 is usually free.": "先使用统一模板价格，再按需调整单集价格。通常第 1 集为免费。",
  "Default unlock price": "默认解锁价格",
  "coins": "金币",
  "Apply Episode 1 Free": "将第 1 集设为免费",
  "Apply to paid episodes": "应用到付费剧集",
  "Episode Pricing": "剧集定价",
  "Set each episode as free or locked, then define the unlock price.": "设置每一集是免费还是付费，并配置解锁价格。",
  "Asset readiness: __ARG_0__%": "素材完成度：__ARG_0__%",
  "Add and upload at least one episode before configuring pricing.": "请至少添加并上传一集后再配置价格。",
  "Free": "免费",
  "Paid": "付费",
  "Save Draft": "保存草稿",
  "Next Step": "下一步",
  "Previous Step": "上一步",
  "Next Step: Payments": "下一步：付费设置",
  "Submit for Review": "提交审核",
    "Loading episode preview...": "正在加载剧集预览……",
    "Close": "关闭",
    All: "全部",
    Pending: "待处理",
    Processing: "处理中",
    Held: "暂缓",
    Disputed: "争议中",
    Rejected: "已拒绝",
    Review: "查看",
    Estimated: "预计",
    Action: "操作",
    Country: "国家",
    Currency: "币种",
    Missing: "缺失",
    Confirmed: "已确认",
    "Statement #__ARG_0__": "结算单 #__ARG_0__",
    "Period: __ARG_0__": "结算周期：__ARG_0__",
    "Last updated __ARG_0__": "最后更新于 __ARG_0__",
    "__ARG_0__% standard rate": "标准费率 __ARG_0__%",
    "__ARG_0__% local withholding": "本地预扣税 __ARG_0__%",
    "team or check our": "团队，或查看我们的",
    "Ep __ARG_0__: __ARG_1__": "第 __ARG_0__ 集：__ARG_1__",
    "Search regions": "搜索区域",
    "No matching regions": "没有匹配的区域",
    "Change bank account": "更改银行账户",
    "Add bank account": "添加银行账户",
    "Save bank account changes": "保存银行账户修改",
    "Save bank account": "保存银行账户",
    "Close form": "关闭表单",
    "Close bank account form": "关闭银行账户表单",
    "Bank account connected": "已连接银行账户",
    "Add your payout bank account": "添加你的收款银行账户",
    "No bank account connected": "未连接银行账户",
    "Not added yet": "尚未添加",
    "No bank account information added yet": "尚未添加银行账户信息",
    "Account holder": "账户持有人",
    "Account number": "账号",
    "Account Management": "账户管理",
    "Downloading...": "下载中...",
    "Showing __ARG_0__ of __ARG_1__ statements": "共 __ARG_1__ 条，当前显示 __ARG_0__ 条",
    "Portrait": "竖版",
    "Landscape": "横版",
  "Drama portrait cover": "短剧竖版封面",
  "Drama landscape cover": "短剧横版封面",
  "Progress": "进度",
  "Progress: __ARG_0__%": "进度：__ARG_0__%",
  "Source subtitle is required before auto-slice": "开始自动切片前必须先上传源字幕文件",
  "Source upload failed: no stream id returned": "源视频上传失败：未返回视频流 ID",
  "Video upload failed: no stream id returned": "视频上传失败：未返回视频流 ID",
  "Title is required": "标题不能为空",
  "Description is required": "简介不能为空",
  "Vertical cover is required": "必须上传竖版封面",
  "Horizontal cover is required": "必须上传横版封面",
  "Select one category": "请选择一个分类",
  "Primary language is required": "必须选择主要语言",
  "Set a valid unlock price for every paid episode": "请为每一个付费剧集设置有效的解锁价格",
  "Upload a video for every episode before submitting for review": "提交审核前，请为每一集上传视频",
  "Upload subtitles for every episode before submitting for review": "提交审核前，请为每一集上传字幕",
  "Upload a video before previewing the episode": "请先上传视频后再预览该剧集",
  "Failed to load episode preview": "加载剧集预览失败",
  "Failed to save basic info": "保存基本信息失败",
  "Failed to move to payment settings": "进入付费设置失败",
  "Failed to submit drama for review": "提交短剧审核失败",
  "Bulk upload failed": "批量上传失败",
  "Auto-slice started. Preparing __ARG_0__ episode clips in the background.": "自动切片已开始，正在后台准备 __ARG_0__ 个剧集片段。",
  "Auto-slice started. Preparing episode clips in the background.": "自动切片已开始，正在后台准备剧集片段。",
  "Auto-slice is preparing clips in the background.": "自动切片正在后台准备片段。",
  "Auto-slice is preparing clips: __ARG_0__/__ARG_1__ episodes created": "自动切片处理中：已创建 __ARG_0__ / __ARG_1__ 集",
  "Auto-slice is still preparing clips in the background. Please refresh in a moment.": "自动切片仍在后台处理中，请稍后刷新查看。",
  "Auto-slice completed: __ARG_0__ episodes ready": "自动切片完成：__ARG_0__ 集已就绪",
  "Auto-slice partial success: __ARG_0__ ready, __ARG_1__ failed (__ARG_2__)": "自动切片部分成功：__ARG_0__ 集完成，__ARG_1__ 集失败（__ARG_2__）",
  "Auto-slice started. __ARG_0__/__ARG_1__ clips ready, others still processing.": "自动切片已启动，__ARG_0__ / __ARG_1__ 个片段已就绪，其余仍在处理中。",
  "Unknown processing error": "未知处理错误",
  "__ARG_0__ regions selected": "已选择 __ARG_0__ 个区域",
  "Uploading __ARG_0__%": "上传中 __ARG_0__%",
  "Uploading source __ARG_0__%": "源视频上传中 __ARG_0__%",
  "Delete": "删除",
  "Delete this drama permanently? All synced episodes, subtitles, and videos will be removed.": "确认永久删除该短剧吗？关联的分集、字幕和视频都会一并删除。",
  "Action failed": "操作失败",
  "Archive": "归档",
  "Unarchive": "取消归档",
  "Submit": "提交",
  "Resubmit": "重新提交",
  "Updated recently": "刚刚更新",
  "Updated": "更新于",
};

const TRANSLATION_OVERRIDES: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    ...CREATOR_UPLOAD_ZH_OVERRIDES,
    "Creator Center": "创作者中心",
    "Creator Account": "创作者账号",
    "Creator Applicant": "申请中的创作者",
    "Open Creator Center": "进入创作者中心",
    Dashboard: "仪表盘",
    Dramas: "短剧",
    Analytics: "数据分析",
    Contract: "合约",
    Settlements: "结算",
    Tickets: "工单",
    Notifications: "通知",
    Settings: "设置",
    "New Drama": "新建短剧",
    "Apply to Create": "申请入驻",
    "Apply Now - It's Free": "立即申请，免费入驻",
    "Support Tickets": "支持工单",
    "Settlement Center": "结算中心",
    "Creator Onboarding": "创作者入驻",
    "Basic Info": "基础信息",
    "Creative Profile": "创作资料",
    "Step __ARG_0__": "第 __ARG_0__ 步",
    "Step __ARG_0__ of __ARG_1__": "第 __ARG_0__ / __ARG_1__ 步",
    "Step __ARG_0__ of __ARG_1__: __ARG_2__": "第 __ARG_0__ / __ARG_1__ 步：__ARG_2__",
    "Step 01": "第 1 步",
    "Step 02": "第 2 步",
    "Step 03": "第 3 步",
    "Step 04": "第 4 步",
    "Step 1 of 5: Basic Info": "第 1 / 5 步：基础信息",
    "Step 2 of 5: Creative Profile": "第 2 / 5 步：创作资料",
    "Step 3 of 5: Identity": "第 3 / 5 步：身份验证",
    "Step 4 of 5: Agreement": "第 4 / 5 步：协议确认",
    "Step 5 of 5: Review": "第 5 / 5 步：提交前确认",
    Bronze: "青铜",
    Silver: "白银",
    Gold: "黄金",
    Requirements: "要求",
    Perks: "权益",
    "Revenue share": "收入分成",
    "Search creator docs and onboarding": "搜索创作者指南与入驻说明",
    "Search creator guides, payout rules, review standards...": "搜索创作者指南、结算规则、审核标准...",
    "Why TinyTale": "为什么选择 TinyTale",
    "Earning Potential": "收益预估",
    "How It Works": "入驻流程",
    "Platform Features": "平台能力",
    "Creator Tiers": "创作者等级",
    "Launch Readiness": "上线前准备",
    "Final CTA": "立即开始",
    "Your stories deserve an audience and a paycheck.": "好故事，值得被更多人看见，也值得带来收入。",
    "Publish premium short dramas on TinyTale and turn strong storytelling into real revenue with a platform built for vertical series.":
      "在 TinyTale 发布优质竖屏短剧，用专为连续剧集打造的平台，把创作力真正变成收入。",
    "Built for creators who take storytelling seriously.": "专为认真做内容的短剧创作者打造。",
    "We're not another social media app. TinyTale is a dedicated short drama streaming platform built for episodic vertical series and creators who want both audience attention and real revenue.":
      "我们不是泛娱乐内容平台。TinyTale 专注竖屏短剧分发，服务真正想把故事做成作品、把作品做成收入的创作者。",
    "Viewers come here to watch dramas.": "来到这里的用户，就是来看短剧的。",
    "No competing with dance videos or cooking clips. TinyTale users open the app specifically to binge short dramas.":
      "不用和舞蹈、搞笑或美食内容争抢注意力。TinyTale 用户打开平台，就是为了连续追更短剧。",
    "Earn from views, not donations.": "靠内容变现，不靠打赏碰运气。",
    "Our coin-based model ties revenue to episode unlocks, so your income scales with content quality and audience retention.":
      "平台采用按集解锁的付费模式，收入直接与内容质量、付费转化和用户留存挂钩。",
    "A studio in your browser.": "把创作后台搬进浏览器。",
    "Upload episodes, manage subtitles, track analytics, and follow settlements from one creator dashboard.":
      "上传剧集、管理字幕、查看数据、跟踪结算，都能在同一个创作者后台完成。",
    "How much can you really earn?": "认真做短剧，能赚到多少？",
    "Your revenue depends on content quality, episode count, and audience engagement. These scenarios reflect the current tier model and typical unlock behavior across short drama catalogs.":
      "收益取决于内容质量、作品规模和观众付费表现。以下区间基于当前分成机制与典型解锁数据，仅供参考。",
    "30% share": "30% 分成",
    "45% share": "45% 分成",
    "60% share": "60% 分成",
    "Great for getting started": "适合起步阶段",
    "Consistent catalog builders": "适合稳定更新的创作者",
    "Full-time creator income": "具备全职创作潜力",
    "1 drama, 30 episodes, 5,000 monthly unlocks": "1 部短剧 / 30 集 / 月解锁 5,000 次",
    "3 dramas, 90 episodes, 25,000 monthly unlocks": "3 部短剧 / 90 集 / 月解锁 25,000 次",
    "5+ dramas, 200+ episodes, 100,000+ monthly unlocks": "5+ 部短剧 / 200+ 集 / 月解锁 100,000+ 次",
    "Estimates are based on average coin-to-USD conversion and typical viewer purchasing behavior. Actual earnings vary by content performance, retention, and regional pricing.":
      "以上为参考估算，实际收益会受题材表现、完播留存、付费转化和地区定价影响。",
    "From idea to income in 4 steps.": "从申请到变现，四步开始。",
    "Submit your application": "提交入驻申请",
    "Tell us about your creative background and what kind of stories you want to tell. Most applications are reviewed within 48 hours.":
      "填写你的创作经历、擅长题材和基础资料。大多数申请会在 48 小时内完成审核。",
    "Upload your first drama": "上传你的第一部短剧",
    "Use the creator workspace to upload episodes, add subtitles, set cover art, and submit every release for quality review.":
      "在创作者后台上传剧集、字幕和封面，并把每次发布提交至内容审核。",
    "Track your performance": "查看内容表现",
    "Follow views, watch time, revenue breakdown, and audience signals from one analytics workspace built for drama catalogs.":
      "在专为短剧设计的数据后台查看播放量、观看时长、收入构成和用户反馈。",
    "Get paid monthly": "按月结算收入",
    "Verify your bank account, reach the $50 threshold, and receive USD payouts without invoices or manual follow-up.":
      "完成收款账户与税务信息认证后，达到 50 美元门槛即可按月收款。",
    "Everything you need to build and grow.": "从内容上线到收入管理，一站完成。",
    "The creator center now covers content operations, analytics, settlements, multilingual delivery, and support workflows without pushing you into external tools.":
      "创作者中心已覆盖内容管理、数据分析、结算、字幕交付与工单支持，无需频繁切换外部工具。",
    "One dashboard. Everything you need.": "一个后台，管完创作全流程。",
    "Manage dramas, episodes, subtitles, and cover art from a single workspace with bulk uploads and instant previews.":
      "在同一工作台管理短剧、剧集、字幕与封面，支持批量上传和即时预览。",
    "Know your audience inside out.": "把观众看得更清楚。",
    "Track views, watch time, geography, device mix, and per-episode performance to see what stories resonate.":
      "从播放量、观看时长、地区、设备到单集表现，快速判断什么内容最能打动观众。",
    "See every dollar. No hidden fees.": "每一笔收入，都看得明明白白。",
    "Monthly settlement statements break down gross revenue, platform fees, your share, and payout status in USD.":
      "月度结算单会清晰展示总收入、渠道费用、分成比例和打款状态，全部以美元呈现。",
    "Quality standards that protect your brand.": "审核标准，也是在保护你的作品口碑。",
    "Every submission goes through content review for quality, compliance, and viewer readiness, with actionable feedback.":
      "每次提交都会经过质量、合规和上线可用性审核，并返回明确可执行的反馈。",
    "Reach viewers worldwide.": "把作品发到全球观众面前。",
    "Upload SRT or VTT subtitle files in any language and let the platform serve the right subtitles automatically.":
      "上传任意语言的 SRT 或 VTT 字幕后，平台会自动向对应用户展示合适字幕。",
    "Help when you need it.": "遇到问题，随时提单。",
    "Open creator support tickets for settlement questions, content review clarifications, and dashboard issues.":
      "无论是结算疑问、审核反馈还是后台故障，都可以通过工单快速处理。",
    "The more you create, the more you earn.": "内容越强，分成越高。",
    "Revenue share grows with your catalog and audience performance. Every creator starts at Bronze and levels up based on published work and business results.":
      "分成会随着作品规模和内容表现提升。所有创作者从青铜开始，根据已上线内容和经营结果逐步升级。",
    "Approved creator account": "已通过审核的创作者账号",
    "Creator workspace, basic analytics, monthly settlements": "开通创作者后台、基础数据面板、月度结算",
    "3+ published dramas, consistent upload cadence": "已上线 3 部以上短剧，保持稳定更新",
    "Advanced analytics, priority review, dedicated support": "高级数据分析、优先审核、专属支持",
    "5+ published dramas, strong audience metrics": "已上线 5 部以上短剧，且核心数据表现优秀",
    "Maximum revenue share, featured placement, early tool access": "更高分成、重点曝光、优先体验新工具",
    "What to prepare before you go live.": "开始前，先把这些准备好。",
    "Every card below reflects a real requirement already enforced by the creator application, content review, or settlement workflow.":
      "下面每一项都对应创作者申请、内容审核或结算流程中的真实要求。",
    "Application package": "入驻资料",
    "Prepare a portfolio link, creator bio, tax identity, and a primary work email before you start the application flow.":
      "开始申请前，请准备作品链接、创作者简介、税务身份信息和常用工作邮箱。",
    "Content delivery": "内容交付资料",
    "Each published title should include episode assets, subtitles, pricing rules, and cover art that meets creator review standards.":
      "每部上线作品都需要准备剧集素材、字幕、定价规则和符合审核标准的封面。",
    "Settlement readiness": "结算准备",
    "USD settlement requires a verified bank account plus completed tax information before revenue can move to payable status.":
      "想要进入美元结算，需要先完成收款账户和税务信息认证。",
    "Mapped to creator center requirements and real backend fields.": "对应创作者中心当前的真实字段与审核要求。",
    "Answers before you apply.": "申请前，你可能最关心的问题。",
    "We're actively recruiting creators.": "我们正在招募优质短剧创作者。",
    "Spots in the creator program are reviewed on a rolling basis. The sooner you apply, the sooner your stories reach a growing audience of drama fans.":
      "创作者计划采用滚动审核，越早申请，越早让你的作品进入持续增长的剧迷人群。",
    "No credit card required. 48-hour review. Cancel anytime.": "无申请费用，48 小时内审核，随时可退出。",
    "Creator Application": "创作者入驻申请",
    "Application Status": "申请进度",
    "Track your creator onboarding review. Approval unlocks the creator dashboard, drama uploads, analytics, and settlement views.":
      "查看你的入驻审核进度。审核通过后即可开启创作者后台、上传短剧、查看数据并管理结算。",
    "Review note:": "审核备注：",
    "Review Checklist": "审核清单",
    "Identity and contact information": "身份与联系方式",
    "Creative genres and portfolio proof": "创作方向与作品证明",
    "Document verification upload": "身份/资质文件上传",
    "In-page creator agreement acceptance": "在线阅读并确认创作者合作协议",
    "Last Update": "最近更新",
    "Standard target is within 48 hours, though revisions or additional checks may extend review.":
      "常规审核目标为 48 小时，如需补充材料或进行额外核验，时效可能顺延。",
    Submitted: "已提交",
    "Review Queue": "审核排队中",
    "Under Review": "审核中",
    "More Information Required": "需补充资料",
    Approved: "已通过",
    "Not Approved": "未通过",
    "Access Suspended": "账号已暂停",
    "Draft Saved": "草稿已保存",
    "Application Required": "请先申请入驻",
    "Your application has been submitted and is waiting to enter the manual review queue.":
      "你的申请已提交，正在等待进入人工审核队列。",
    "TinyTale is reviewing your profile, sample links, identity files, and agreement signature.":
      "TinyTale 正在审核你的资料、作品链接、身份文件和协议确认信息。",
    "The review team needs additional details before approval. Update your application and resubmit.":
      "审核团队需要你补充更多资料后才能继续审批，请更新申请并重新提交。",
    "Your creator access is active. You can now upload dramas, review analytics, and manage payouts.":
      "你的创作者权限已开通，现在可以上传短剧、查看数据并管理结算。",
    "This submission was not approved. You can revise your materials and apply again when ready.":
      "本次申请未通过审核。你可以补充或调整资料后再次提交。",
    "Creator access is temporarily suspended. Please check notifications or contact support for next steps.":
      "创作者权限已暂时停用，请查看通知或联系支持团队了解下一步处理方式。",
    "Your application draft is saved locally. Complete the remaining steps before submitting for review.":
      "申请草稿已保存在本地，请完成剩余步骤后再提交审核。",
    "Start your creator application to unlock the creator workspace.": "完成创作者入驻申请后，即可解锁创作者工作台。",
    "Manual Review": "人工审核",
    Decision: "审核结果",
    Published: "已上线",
    "Visible on TinyTale": "已在 TinyTale 正式展示",
    "Pending Review": "待审核",
    "Waiting for 48h SLA review": "等待审核，目标时效 48 小时",
    "Approved and ready to schedule": "审核通过，可安排上线",
    "Changes Required": "需修改",
    "Review feedback available": "已返回审核意见",
    Suspended: "已暂停",
    "Removed from distribution": "已停止分发",
    Archived: "已归档",
    "Hidden by creator": "已由创作者隐藏",
    Draft: "草稿",
    "Not submitted yet": "尚未提交",
    "All Titles": "全部作品",
    "Settlement Dispute": "结算申诉",
    "Content Appeal": "内容申诉",
    "DMCA / Rights": "版权 / DMCA",
    "Account Issue": "账号问题",
    "Upload / Technical": "上传 / 技术问题",
    Monetization: "变现",
    Content: "内容",
    Rights: "版权",
    Account: "账号",
    Technical: "技术",
    "General creator support request.": "常规创作者支持咨询。",
    Low: "低",
    Medium: "中",
    High: "高",
    Category: "分类",
    Subject: "主题",
    Description: "描述",
    Cancel: "取消",
    "Submitting...": "提交中...",
    Unknown: "未知",
    Bio: "简介",
    Instagram: "Instagram",
    Timezone: "时区",
    username: "用户名",
    "https://portfolio.example.com": "https://portfolio.example.com",
    Creator: "创作者",
    "__ARG_0__ active": "__ARG_0__ 个活跃会话",
    Views: "播放量",
    Completion: "完播率",
    Revenue: "收入",
    Uploaded: "已上传",
    Missing: "缺失",
    Thumbnail: "缩略图",
    none: "无",
    "30-day episode view count from creator drama analytics.": "来自创作者短剧分析的近 30 天剧集播放量。",
    "Video file: __ARG_0__.": "视频文件：__ARG_0__。",
    "Language: __ARG_0__.": "语言：__ARG_0__。",
    "Cover asset status: __ARG_0__.": "封面素材状态：__ARG_0__。",
    "Current unlock rate: __ARG_0__.": "当前解锁率：__ARG_0__。",
    "Back to __ARG_0__": "返回 __ARG_0__",
    "Ep __ARG_0__: __ARG_1__": "第 __ARG_0__ 集：__ARG_1__",
    "__ARG_0__ sec": "__ARG_0__ 秒",
    "__ARG_0__ status: __ARG_1__.": "__ARG_0__ 状态：__ARG_1__。",
    Urgent: "紧急",
    Open: "处理中",
    "In Progress": "跟进中",
    "Waiting Support": "等待平台处理",
    "Waiting You": "等待你处理",
    Resolved: "已解决",
    Closed: "已关闭",
    "Identity": "身份验证",
    Agreement: "协议确认",
    Review: "提交前确认",
    Continue: "继续下一步",
    "Previous Step": "上一步",
    "Save Draft": "保存草稿",
    "All creator agreements are displayed in-page and require explicit acceptance before submission.":
      "所有合作协议均需在页面内完整阅读并明确确认后，才可提交申请。",
    "Please resolve the following before continuing:": "继续之前，请先完成以下内容：",
    "Basic creator information": "基础资料",
    "Collect the legal identity and contact information needed for application review and creator account setup.":
      "填写用于审核、签约与后续结算的法定身份及联系资料。",
    "Applicant Type": "申请主体类型",
    "Individual Creator": "个人创作者",
    "Company / Studio": "公司 / 机构",
    "Company Name": "公司名称",
    "Full Name": "姓名",
    "Business Type": "公司业务类型",
    "Registration ID": "注册编号",
    Age: "年龄",
    "Company Address": "公司地址",
    "ID Number": "证件号码",
    Email: "邮箱",
    "Phone Number": "联系电话",
    Region: "地区",
    "Country / Region": "国家 / 地区",
    "Select country or region": "请选择国家 / 地区",
    "Company applications require the legal entity record, business type, registration identifier, mailing address, and operating region.":
      "公司主体申请需提交与收款主体一致的公司名称、业务类型、注册编号、注册地址及运营地区。",
    "Individual applications require the creator's legal profile, age, ID number, and direct contact information.":
      "个人申请需提交真实姓名、年龄、证件号码及可直接联系到本人的联系方式。",
    "Creative profile": "创作资料",
    "Describe your storytelling focus, language, and proof of prior work. These signals drive onboarding review and creator quality scoring.":
      "介绍你的创作方向、内容语言与过往作品证明，这些信息会直接影响入驻审核和创作者评级。",
    Genres: "内容题材",
    "Primary Language": "主要创作语言",
    "Portfolio Links": "作品 / 社媒链接",
    "Portfolio Link __ARG_0__": "作品链接 __ARG_0__",
    Remove: "移除",
    "+ Add another link": "+ 添加更多链接",
    "Creator Bio / Studio Introduction": "创作者 / 机构简介",
    "Introduce your creative background, target audience, and notable work.":
      "请介绍你的创作背景、目标受众以及代表作品。",
    "Identity verification": "身份验证",
    "Upload the company registration document used to verify the legal entity before creator access is activated.":
      "请上传用于核验公司主体的注册文件，审核通过后方可开通创作者权限。",
    "Upload the identity document that matches your creator profile. TinyTale uses this to verify the applicant before uploads and payouts are enabled.":
      "请上传与你申请身份一致的证件材料，TinyTale 会在开通上传与结算权限前完成核验。",
    "Verification Document": "验证文件类型",
    "Government ID": "身份证件",
    Passport: "护照",
    "Business License": "企业注册文件",
    "National ID card or state-issued ID.": "国家身份证或政府签发的有效身份证件。",
    "International passport for identity verification.": "用于身份核验的有效护照。",
    "Required for company-based applications.": "公司主体申请必须提交此项。",
    "Registration Document": "注册文件",
    "Passport Copy": "护照扫描件",
    "ID Card Front": "证件正面",
    "ID Card Back": "证件反面",
    "Select Registration Document": "选择注册文件",
    "Select Passport Copy": "选择护照扫描件",
    "Select ID Card Front": "选择证件正面",
    "Select ID Card Back": "选择证件反面",
    "Business Registration": "企业注册信息",
    "Company accounts submit one registration file in this step. Registration ID, address, country, and region stay linked to the first step and are preserved when you move backward.":
      "公司主体在此步骤只需提交一份注册文件。第一步填写的注册编号、公司地址、国家和地区会自动保留，返回上一步也不会丢失。",
    "Passport verification requires one passport image or PDF. Your Step 1 identity details stay intact if you go back to edit them.":
      "护照验证仅需上传 1 份护照图片或 PDF。若返回上一步修改资料，已填写的身份信息会自动保留。",
    "Government ID verification requires both the front and back of the ID card. Your Step 1 profile details stay intact if you go back to edit them.":
      "身份证件验证需同时上传正反两面。若返回上一步修改资料，已填写的信息会自动保留。",
    "Select __ARG_0__": "选择 __ARG_0__",
    "JPG, PNG, or PDF up to 10MB": "支持 JPG、PNG、PDF，单个文件不超过 10MB",
    "Uploading...": "上传中...",
    "Upload failed. Please try again.": "上传失败，请稍后重试。",
    "Failed to remove file. Please try again.": "删除文件失败，请稍后重试。",
    "Please sign in again before uploading files.": "登录状态已失效，请重新登录后再上传文件。",
    "Uploaded file": "已上传文件",
    "Open file": "打开文件",
    "Remove file": "删除文件",
    Image: "图片",
    Document: "文件",
    "Creator agreement": "创作者合作协议",
    "The creator agreement must be reviewed in-page. TinyTale records the acceptance timestamp once you submit the application.":
      "创作者合作协议需在页面内完整阅读。提交申请后，TinyTale 会记录你的确认时间。",
    "TinyTale Creator Cooperation Agreement": "TinyTale 创作者合作协议",
    Reviewed: "已阅读完成",
    "Scroll to review": "滚动完成阅读",
    "1. Rights and authorization": "1. 权利与授权",
    "2. Revenue share and settlement basis": "2. 分成与结算基础",
    "3. Content review and moderation": "3. 内容审核与管理",
    "4. DMCA and platform enforcement": "4. DMCA 与平台治理",
    "5. Banking, payouts, and tax responsibilities": "5. 收款、打款与税务责任",
    "6. Termination and account lifecycle": "6. 终止条款与账号生命周期",
    "I have read and agree to the TinyTale Creator Cooperation Agreement.":
      "我已完整阅读并同意《TinyTale 创作者合作协议》。",
    "You must review the agreement above before this checkbox is considered valid.":
      "只有完整阅读上方协议后，此确认项才会生效。",
    "I confirm the submitted content and materials are authentic and rights-cleared.":
      "我确认本次提交的内容与材料真实有效，且版权权属清晰。",
    "This includes portfolio links, uploaded identity files, and future drama uploads.":
      "包括作品链接、已上传的身份文件，以及未来提交的短剧内容。",
    "Signature Name": "签署姓名",
    "Type your full legal or representative name": "请输入你的法定姓名或签署代表姓名",
    "Basic Information": "基础资料",
    "Identity Verification": "身份验证",
    "Agreement Confirmation": "协议确认",
    "Agreement Reviewed": "协议已阅读",
    "Rights Confirmed": "版权声明已确认",
    "Agreement Accepted": "协议已接受",
    "Submit for manual review": "提交人工审核",
    "TinyTale will manually review the application, creator profile, identity materials, and agreement confirmation before enabling the creator dashboard. Review SLA target is within 48 hours.":
      "TinyTale 将对申请资料、创作背景、身份文件及协议确认信息进行人工审核，审核通过后才会开通创作者后台。目标审核时效为 48 小时内。",
    Submitting: "提交中",
    "Submit Application": "提交申请",
    Edit: "编辑",
    "Complete your TinyTale creator application. We will review profile quality, identity documents, and rights confirmation before creator access is granted.":
      "完成 TinyTale 创作者入驻申请。我们会审核你的创作资料、身份文件与版权确认信息，通过后即可开通创作者权限。",
    "__ARG_0__% complete": "已完成 __ARG_0__%",
    "Not saved yet": "尚未保存",
    "Saved just now": "刚刚保存",
    "Saved __ARG_0__m ago": "__ARG_0__ 分钟前已保存",
    "Saved __ARG_0__h ago": "__ARG_0__ 小时前已保存",
    "Saved __ARG_0__d ago": "__ARG_0__ 天前已保存",
    "Company name is required.": "请填写公司名称。",
    "Business type is required.": "请填写公司业务类型。",
    "Registration ID is required.": "请填写注册编号。",
    "Company address is required.": "请填写公司地址。",
    "Region is required.": "请填写地区。",
    "Full name is required.": "请填写姓名。",
    "Age is required.": "请填写年龄。",
    "Age must be a valid whole number.": "年龄必须为有效的整数。",
    "ID number is required.": "请填写证件号码。",
    "Email is required.": "请填写邮箱。",
    "Phone number is required.": "请填写联系电话。",
    "Country or region is required.": "请选择国家 / 地区。",
    "Select at least one creative genre.": "请至少选择 1 个内容题材。",
    "Add at least one portfolio or social link.": "请至少填写 1 个作品或社媒链接。",
    "Creator bio or studio introduction is required.": "请填写创作者或机构简介。",
    "Upload the registration document.": "请上传注册文件。",
    "Upload the passport copy.": "请上传护照扫描件。",
    "Upload the ID card front.": "请上传证件正面。",
    "Upload the ID card back.": "请上传证件反面。",
    "Please review the creator agreement through the end before continuing.":
      "继续前请先完整阅读创作者合作协议。",
    "You must accept the TinyTale Creator Agreement.": "你需要接受 TinyTale 创作者合作协议。",
    "You must confirm content authenticity and rights ownership.": "你需要确认内容真实且拥有合法版权。",
    "Signature name is required.": "请填写签署姓名。",
    "Failed to save draft.": "保存草稿失败。",
    "Failed to save progress.": "保存进度失败。",
    "Failed to submit your application.": "提交申请失败。",
    Select: "请选择",
    "(optional)": "（选填）",
    Yes: "是",
    No: "否",
    "Primary language is required.": "请填写主要创作语言。",
    "Saving Draft...": "草稿保存中...",
    "Missing token": "登录状态缺失",
    "Untitled Story": "未命名短剧",
    "Failed to create drama draft": "创建短剧草稿失败",
    "Failed to load episodes": "加载剧集失败",
    "Failed to initialize workspace": "初始化工作台失败",
    "Failed to create episode": "创建剧集失败",
    "Failed to delete episode": "删除剧集失败",
    "Video ready": "视频已就绪",
    "Video processing failed": "视频处理失败",
    "Preparing upload...": "准备上传中...",
    "Processing in cloud...": "云端处理中...",
    "Upload failed": "上传失败",
    "Video upload failed": "视频上传失败",
    "Upload cancelled": "上传已取消",
    "No uploaded video found to retry status check": "未找到可重试状态检测的视频",
    "Retrying cloud status check...": "正在重试云端状态检查...",
    "Failed to upload cover": "上传封面失败",
    "Failed to upload subtitle": "上传字幕失败",
    "Preparing source upload...": "准备上传源视频...",
    "Processing source video...": "源视频处理中...",
    "Source upload failed": "源视频上传失败",
    "Source video processing failed": "源视频处理失败",
    "Source video is still processing. Please retry in a moment.": "源视频仍在处理中，请稍后重试。",
    "Source video ready for auto-slice": "源视频已就绪，可开始自动切片",
    "Failed to upload source subtitle": "上传源字幕失败",
    "Please upload a source video and wait until it is ready": "请先上传源视频并等待处理完成",
    "Auto-slice completed, but no clip uid was returned": "自动切片完成，但未返回片段 UID",
    "Source cleanup completed": "源视频清理完成",
    "Source cleanup failed: __ARG_0__": "源视频清理失败：__ARG_0__",
    "Source cleanup pending: __ARG_0__": "源视频待清理：__ARG_0__",
    "Auto-slice completed: __ARG_0__ episodes ready": "自动切片完成：__ARG_0__ 集已就绪",
    "Auto-slice partial success: __ARG_0__ ready, __ARG_1__ failed (__ARG_2__)": "自动切片部分成功：__ARG_0__ 集就绪，__ARG_1__ 集失败（__ARG_2__）",
    "Auto-slice started. __ARG_0__/__ARG_1__ clips ready, others still processing.": "自动切片已启动，__ARG_0__/__ARG_1__ 个片段已就绪，其余仍在处理中。",
    "Auto-slice failed": "自动切片失败",
    "Please select MP4 files only": "请仅选择 MP4 文件",
    "Bulk upload cancelled": "批量上传已取消",
    "Cancelled by user": "已由用户取消",
    "No queued files to upload": "暂无可上传的排队文件",
    "Bulk upload initialization mismatch, please retry": "批量上传初始化异常，请重试",
    "Upload or processing failed": "上传或处理失败",
    "Bulk upload completed: __ARG_0__ done, __ARG_1__ failed": "批量上传完成：__ARG_0__ 个成功，__ARG_1__ 个失败",
    "Failed to move to next step": "进入下一步失败",
    "Episode Upload": "剧集上传",
    "Review & Monetization": "审核与变现",
    "Bulk Upload (Auto-Slice)": "批量上传（自动切片）",
    "Individual Upload": "单集上传",
    "Upload Episodes": "上传剧集",
    "Auto-Slice From One Source Video": "从单个源视频自动切片",
    "Upload one long MP4, set duration per episode, then split to episodes automatically.":
      "上传一个完整 MP4，设置每集时长后自动切分为多个剧集。",
    "Creator Auto-Slice": "创作者自动切片",
    "Upload Source Video (MP4)": "上传源视频（MP4）",
    "System will transcode before slicing": "系统会先完成转码，再执行切片",
    "Episode Duration": "单集时长",
    "minutes / episode": "分钟 / 集",
    "Subtitle Language": "字幕语言",
    "Applies to uploaded source and episode subtitle files": "应用于上传的源字幕和单集字幕文件",
    "Upload subtitles before auto-slice": "自动切片前请先上传字幕",
    "Source video upload is complete. Please upload the matching subtitle file before starting auto-slice.":
      "源视频上传完成后，请先上传匹配的字幕文件，再启动自动切片。",
    "Auto-slice will stay unavailable until a source subtitle is uploaded.": "在上传源字幕之前，自动切片按钮会保持不可用。",
    "I understand": "我知道了",
    "Subtitle: __ARG_0__": "字幕：__ARG_0__",
    "Upload Source Subtitle (Optional)": "上传源字幕（可选）",
    "Auto-Slicing...": "自动切片中...",
    "Start Auto-Slice": "开始自动切片",
    "Select MP4 files for bulk upload": "选择用于批量上传的 MP4 文件",
    "Files will be mapped to new episodes in filename order.": "系统会按文件名顺序映射到新剧集。",
    File: "文件",
    Size: "大小",
    Progress: "进度",
    "Start Bulk Upload": "开始批量上传",
    Stop: "停止",
    "Clear Queue": "清空队列",
    "Upload Cover": "上传封面",
    "Upload Video": "上传视频",
    "Retry status": "重试状态检查",
    "Upload Subtitle": "上传字幕",
    "Subtitle Ready": "字幕已就绪",
    "Click to add new episode": "点击添加新剧集",
    "Failed to load ticket detail": "加载工单详情失败",
    "Failed to send ticket reply": "发送工单回复失败",
    "Ticket Created": "工单已创建",
    "Support Replied": "平台已回复",
    "Status: __ARG_0__": "状态：__ARG_0__",
    "Loading ticket...": "工单加载中...",
    "Ticket not found.": "未找到工单。",
    Support: "支持中心",
    "My Tickets": "我的工单",
    "Ticket #__ARG_0__": "工单 #__ARG_0__",
    "Close Ticket": "关闭工单",
    "System Update": "系统更新",
    Attachment: "附件",
    "This ticket has been closed.": "该工单已关闭。",
    "Type your reply here...": "在这里输入你的回复...",
    Sending: "发送中",
    "Send Reply": "发送回复",
    "Ticket Details": "工单详情",
    "Created On": "创建时间",
    Timeline: "时间线",
    "TinyTale System": "TinyTale 系统",
    "TinyTale Support": "TinyTale 支持团队",
    "LATEST UPDATE": "最新更新",
    TODAY: "今天",
  },
  ja: {
    All: "すべて",
    Pending: "保留中",
    Processing: "処理中",
    Held: "保留",
    Disputed: "係争中",
    Rejected: "却下",
    Review: "確認",
    Estimated: "予想",
    Action: "操作",
    Country: "国",
    Currency: "通貨",
    Missing: "未設定",
    Confirmed: "確認済み",
    "Statement #__ARG_0__": "明細書 #__ARG_0__",
    "Period: __ARG_0__": "期間: __ARG_0__",
    "Last updated __ARG_0__": "最終更新 __ARG_0__",
    "__ARG_0__% standard rate": "標準料率 __ARG_0__%",
    "__ARG_0__% local withholding": "現地源泉徴収 __ARG_0__%",
    "team or check our": "チーム、または",
    "Ep __ARG_0__: __ARG_1__": "第 __ARG_0__ 話: __ARG_1__",
    Settlement: "決済",
    Back: "戻る",
    "Download PDF": "PDFをダウンロード",
    "Change bank account": "銀行口座を変更",
    "Add bank account": "銀行口座を追加",
    "Save bank account changes": "銀行口座の変更を保存",
    "Save bank account": "銀行口座を保存",
    "Close form": "フォームを閉じる",
    "Close bank account form": "銀行口座フォームを閉じる",
    "Search regions": "地域を検索",
    "No matching regions": "一致する地域がありません",
    "Bank account connected": "銀行口座連携済み",
    "Add your payout bank account": "受取用銀行口座を追加",
    "No bank account connected": "銀行口座が未連携です",
    "Not added yet": "未追加",
    "No bank account information added yet": "まだ銀行口座情報がありません",
    "Account holder": "口座名義人",
    "Account number": "口座番号",
    "Account Management": "口座管理",
    "Downloading...": "ダウンロード中...",
    "Showing __ARG_0__ of __ARG_1__ statements": "__ARG_1__ 件中 __ARG_0__ 件を表示",
    "Airwallex currently displays this payout form in English for the selected page language.": "Airwallex のこのフォームは、選択中の言語では現在英語表示になります。",
    "Airwallex beneficiary form is not ready yet.": "Airwallex の受取口座フォームはまだ準備中です。",
    "Airwallex payout account saved.": "Airwallex の受取口座を保存しました。",
    "Failed to save Airwallex payout account.": "Airwallex の受取口座を保存できませんでした。",
  },
  es: {
    All: "Todo",
    Pending: "Pendiente",
    Processing: "Procesando",
    Held: "Retenido",
    Disputed: "En disputa",
    Rejected: "Rechazado",
    Review: "Revisar",
    Estimated: "Estimado",
    Action: "Acción",
    Country: "País",
    Currency: "Moneda",
    Missing: "Falta",
    Confirmed: "Confirmado",
    "Statement #__ARG_0__": "Estado #__ARG_0__",
    "Period: __ARG_0__": "Periodo: __ARG_0__",
    "Last updated __ARG_0__": "Última actualización __ARG_0__",
    "__ARG_0__% standard rate": "tarifa estándar del __ARG_0__%",
    "__ARG_0__% local withholding": "retención local del __ARG_0__%",
    "team or check our": "equipo o consulta nuestra",
    "Ep __ARG_0__: __ARG_1__": "Ep. __ARG_0__: __ARG_1__",
    Settlement: "Liquidación",
    Back: "Volver",
    "Download PDF": "Descargar PDF",
    "Change bank account": "Cambiar cuenta bancaria",
    "Add bank account": "Agregar cuenta bancaria",
    "Save bank account changes": "Guardar cambios de la cuenta bancaria",
    "Save bank account": "Guardar cuenta bancaria",
    "Close form": "Cerrar formulario",
    "Close bank account form": "Cerrar formulario bancario",
    "Search regions": "Buscar regiones",
    "No matching regions": "No hay regiones coincidentes",
    "Bank account connected": "Cuenta bancaria conectada",
    "Add your payout bank account": "Agrega tu cuenta bancaria de cobro",
    "No bank account connected": "No hay una cuenta bancaria conectada",
    "Not added yet": "Aún no agregado",
    "No bank account information added yet": "Aún no se ha agregado información bancaria",
    "Account holder": "Titular de la cuenta",
    "Account number": "Número de cuenta",
    "Account Management": "Gestión de la cuenta",
    "Downloading...": "Descargando...",
    "Showing __ARG_0__ of __ARG_1__ statements": "Mostrando __ARG_0__ de __ARG_1__ estados",
    "Airwallex currently displays this payout form in English for the selected page language.": "Airwallex muestra actualmente este formulario de cobro en inglés para el idioma seleccionado.",
    "Airwallex beneficiary form is not ready yet.": "El formulario de beneficiario de Airwallex aún no está listo.",
    "Airwallex payout account saved.": "La cuenta de cobro de Airwallex se guardó correctamente.",
    "Failed to save Airwallex payout account.": "No se pudo guardar la cuenta de cobro de Airwallex.",
  },
  pt: {
    All: "Todos",
    Pending: "Pendente",
    Processing: "Processando",
    Held: "Retido",
    Disputed: "Em disputa",
    Rejected: "Rejeitado",
    Review: "Revisar",
    Estimated: "Estimado",
    Action: "Ação",
    Country: "País",
    Currency: "Moeda",
    Missing: "Ausente",
    Confirmed: "Confirmado",
    "Statement #__ARG_0__": "Extrato #__ARG_0__",
    "Period: __ARG_0__": "Período: __ARG_0__",
    "Last updated __ARG_0__": "Última atualização __ARG_0__",
    "__ARG_0__% standard rate": "taxa padrão de __ARG_0__%",
    "__ARG_0__% local withholding": "retenção local de __ARG_0__%",
    "team or check our": "equipe ou confira nosso",
    "Ep __ARG_0__: __ARG_1__": "Ep. __ARG_0__: __ARG_1__",
    Settlement: "Liquidação",
    Back: "Voltar",
    "Download PDF": "Baixar PDF",
    "Change bank account": "Alterar conta bancária",
    "Add bank account": "Adicionar conta bancária",
    "Save bank account changes": "Salvar alterações da conta bancária",
    "Save bank account": "Salvar conta bancária",
    "Close form": "Fechar formulário",
    "Close bank account form": "Fechar formulário da conta bancária",
    "Search regions": "Pesquisar regiões",
    "No matching regions": "Nenhuma região correspondente",
    "Bank account connected": "Conta bancária conectada",
    "Add your payout bank account": "Adicione sua conta bancária de recebimento",
    "No bank account connected": "Nenhuma conta bancária conectada",
    "Not added yet": "Ainda não adicionado",
    "No bank account information added yet": "Nenhuma informação bancária foi adicionada ainda",
    "Account holder": "Titular da conta",
    "Account number": "Número da conta",
    "Account Management": "Gestão da conta",
    "Downloading...": "Baixando...",
    "Showing __ARG_0__ of __ARG_1__ statements": "Mostrando __ARG_0__ de __ARG_1__ extratos",
    "Airwallex currently displays this payout form in English for the selected page language.": "No momento, a Airwallex exibe este formulário de recebimento em inglês para o idioma selecionado.",
    "Airwallex beneficiary form is not ready yet.": "O formulário de beneficiário da Airwallex ainda não está pronto.",
    "Airwallex payout account saved.": "A conta de recebimento da Airwallex foi salva.",
    "Failed to save Airwallex payout account.": "Não foi possível salvar a conta de recebimento da Airwallex.",
  },
  hi: {
    All: "सभी",
    Pending: "लंबित",
    Processing: "प्रसंस्करण में",
    Held: "रुका हुआ",
    Disputed: "विवादित",
    Rejected: "अस्वीकृत",
    Review: "समीक्षा",
    Estimated: "अनुमानित",
    Action: "कार्रवाई",
    Country: "देश",
    Currency: "मुद्रा",
    Missing: "अनुपलब्ध",
    Confirmed: "पुष्ट",
    "Statement #__ARG_0__": "स्टेटमेंट #__ARG_0__",
    "Period: __ARG_0__": "अवधि: __ARG_0__",
    "Last updated __ARG_0__": "आखिरी अपडेट __ARG_0__",
    "__ARG_0__% standard rate": "__ARG_0__% मानक दर",
    "__ARG_0__% local withholding": "__ARG_0__% स्थानीय कर कटौती",
    "team or check our": "टीम से संपर्क करें या हमारी",
    "Ep __ARG_0__: __ARG_1__": "एपि __ARG_0__: __ARG_1__",
    Settlement: "निपटान",
    Back: "वापस",
    "Download PDF": "PDF डाउनलोड करें",
    "Change bank account": "बैंक खाता बदलें",
    "Add bank account": "बैंक खाता जोड़ें",
    "Save bank account changes": "बैंक खाते के बदलाव सहेजें",
    "Save bank account": "बैंक खाता सहेजें",
    "Close form": "फ़ॉर्म बंद करें",
    "Close bank account form": "बैंक खाता फ़ॉर्म बंद करें",
    "Search regions": "क्षेत्र खोजें",
    "No matching regions": "कोई मेल खाने वाला क्षेत्र नहीं",
    "Bank account connected": "बैंक खाता जुड़ चुका है",
    "Add your payout bank account": "अपना भुगतान बैंक खाता जोड़ें",
    "No bank account connected": "कोई बैंक खाता जुड़ा नहीं है",
    "Not added yet": "अभी जोड़ा नहीं गया",
    "No bank account information added yet": "अभी तक बैंक खाता जानकारी नहीं जोड़ी गई है",
    "Account holder": "खाताधारक",
    "Account number": "खाता संख्या",
    "Account Management": "खाता प्रबंधन",
    "Downloading...": "डाउनलोड हो रहा है...",
    "Showing __ARG_0__ of __ARG_1__ statements": "__ARG_1__ में से __ARG_0__ स्टेटमेंट दिखाए जा रहे हैं",
    "Airwallex currently displays this payout form in English for the selected page language.": "चुनी गई पेज भाषा के लिए Airwallex अभी इस भुगतान फ़ॉर्म को अंग्रेज़ी में दिखाता है।",
    "Airwallex beneficiary form is not ready yet.": "Airwallex beneficiary फ़ॉर्म अभी तैयार नहीं है।",
    "Airwallex payout account saved.": "Airwallex भुगतान खाता सहेज लिया गया है।",
    "Failed to save Airwallex payout account.": "Airwallex भुगतान खाता सहेजने में विफल।",
  },
  id: {
    All: "Semua",
    Pending: "Tertunda",
    Processing: "Diproses",
    Held: "Ditahan",
    Disputed: "Disengketakan",
    Rejected: "Ditolak",
    Review: "Tinjau",
    Estimated: "Perkiraan",
    Action: "Aksi",
    Country: "Negara",
    Currency: "Mata uang",
    Missing: "Belum ada",
    Confirmed: "Dikonfirmasi",
    "Statement #__ARG_0__": "Laporan #__ARG_0__",
    "Period: __ARG_0__": "Periode: __ARG_0__",
    "Last updated __ARG_0__": "Terakhir diperbarui __ARG_0__",
    "__ARG_0__% standard rate": "tarif standar __ARG_0__%",
    "__ARG_0__% local withholding": "pemotongan lokal __ARG_0__%",
    "team or check our": "tim atau lihat",
    "Ep __ARG_0__: __ARG_1__": "Ep __ARG_0__: __ARG_1__",
    Settlement: "Penyelesaian",
    Back: "Kembali",
    "Download PDF": "Unduh PDF",
    "Change bank account": "Ubah rekening bank",
    "Add bank account": "Tambahkan rekening bank",
    "Save bank account changes": "Simpan perubahan rekening bank",
    "Save bank account": "Simpan rekening bank",
    "Close form": "Tutup formulir",
    "Close bank account form": "Tutup formulir rekening bank",
    "Search regions": "Cari wilayah",
    "No matching regions": "Tidak ada wilayah yang cocok",
    "Bank account connected": "Rekening bank terhubung",
    "Add your payout bank account": "Tambahkan rekening bank pembayaranmu",
    "No bank account connected": "Belum ada rekening bank yang terhubung",
    "Not added yet": "Belum ditambahkan",
    "No bank account information added yet": "Belum ada informasi rekening bank yang ditambahkan",
    "Account holder": "Pemegang rekening",
    "Account number": "Nomor rekening",
    "Account Management": "Pengelolaan rekening",
    "Downloading...": "Mengunduh...",
    "Showing __ARG_0__ of __ARG_1__ statements": "Menampilkan __ARG_0__ dari __ARG_1__ laporan",
    "Airwallex currently displays this payout form in English for the selected page language.": "Saat ini Airwallex menampilkan formulir payout ini dalam bahasa Inggris untuk bahasa halaman yang dipilih.",
    "Airwallex beneficiary form is not ready yet.": "Formulir beneficiary Airwallex belum siap.",
    "Airwallex payout account saved.": "Rekening payout Airwallex berhasil disimpan.",
    "Failed to save Airwallex payout account.": "Gagal menyimpan rekening payout Airwallex.",
  },
  ko: {
    All: "전체",
    Pending: "대기 중",
    Processing: "처리 중",
    Held: "보류",
    Disputed: "분쟁 중",
    Rejected: "거절됨",
    Review: "검토",
    Estimated: "예상",
    Action: "작업",
    Country: "국가",
    Currency: "통화",
    Missing: "미등록",
    Confirmed: "확인됨",
    "Statement #__ARG_0__": "명세서 #__ARG_0__",
    "Period: __ARG_0__": "기간: __ARG_0__",
    "Last updated __ARG_0__": "마지막 업데이트 __ARG_0__",
    "__ARG_0__% standard rate": "기본 수수료율 __ARG_0__%",
    "__ARG_0__% local withholding": "현지 원천징수 __ARG_0__%",
    "team or check our": "팀에 문의하거나",
    "Ep __ARG_0__: __ARG_1__": "에피소드 __ARG_0__: __ARG_1__",
    Settlement: "정산",
    Back: "뒤로",
    "Download PDF": "PDF 다운로드",
    "Change bank account": "은행 계좌 변경",
    "Add bank account": "은행 계좌 추가",
    "Save bank account changes": "은행 계좌 변경 저장",
    "Save bank account": "은행 계좌 저장",
    "Close form": "양식 닫기",
    "Close bank account form": "은행 계좌 양식 닫기",
    "Search regions": "지역 검색",
    "No matching regions": "일치하는 지역이 없습니다",
    "Bank account connected": "은행 계좌가 연결되었습니다",
    "Add your payout bank account": "정산용 은행 계좌를 추가하세요",
    "No bank account connected": "연결된 은행 계좌가 없습니다",
    "Not added yet": "아직 추가되지 않음",
    "No bank account information added yet": "은행 계좌 정보가 아직 없습니다",
    "Account holder": "예금주",
    "Account number": "계좌번호",
    "Account Management": "계좌 관리",
    "Downloading...": "다운로드 중...",
    "Showing __ARG_0__ of __ARG_1__ statements": "전체 __ARG_1__개 중 __ARG_0__개 명세서 표시",
    "Airwallex currently displays this payout form in English for the selected page language.": "선택한 페이지 언어에서는 현재 Airwallex 정산 양식이 영어로 표시됩니다.",
    "Airwallex beneficiary form is not ready yet.": "Airwallex 수취인 양식이 아직 준비되지 않았습니다.",
    "Airwallex payout account saved.": "Airwallex 정산 계좌가 저장되었습니다.",
    "Failed to save Airwallex payout account.": "Airwallex 정산 계좌를 저장하지 못했습니다.",
  },
  fr: {
    All: "Tous",
    Pending: "En attente",
    Processing: "En cours",
    Held: "Retenu",
    Disputed: "Contesté",
    Rejected: "Rejeté",
    Review: "Examiner",
    Estimated: "Estimé",
    Action: "Action",
    Country: "Pays",
    Currency: "Devise",
    Missing: "Manquant",
    Confirmed: "Confirmé",
    "Statement #__ARG_0__": "Relevé n° __ARG_0__",
    "Period: __ARG_0__": "Période : __ARG_0__",
    "Last updated __ARG_0__": "Dernière mise à jour __ARG_0__",
    "__ARG_0__% standard rate": "taux standard de __ARG_0__%",
    "__ARG_0__% local withholding": "retenue locale de __ARG_0__%",
    "team or check our": "équipe ou consultez notre",
    "Ep __ARG_0__: __ARG_1__": "Ép. __ARG_0__ : __ARG_1__",
    Settlement: "Règlement",
    Back: "Retour",
    "Download PDF": "Télécharger le PDF",
    "Change bank account": "Modifier le compte bancaire",
    "Add bank account": "Ajouter un compte bancaire",
    "Save bank account changes": "Enregistrer les modifications du compte bancaire",
    "Save bank account": "Enregistrer le compte bancaire",
    "Close form": "Fermer le formulaire",
    "Close bank account form": "Fermer le formulaire bancaire",
    "Search regions": "Rechercher des régions",
    "No matching regions": "Aucune région correspondante",
    "Bank account connected": "Compte bancaire connecté",
    "Add your payout bank account": "Ajoutez votre compte bancaire de versement",
    "No bank account connected": "Aucun compte bancaire connecté",
    "Not added yet": "Pas encore ajouté",
    "No bank account information added yet": "Aucune information bancaire n'a encore été ajoutée",
    "Account holder": "Titulaire du compte",
    "Account number": "Numéro de compte",
    "Account Management": "Gestion du compte",
    "Downloading...": "Téléchargement...",
    "Showing __ARG_0__ of __ARG_1__ statements": "Affichage de __ARG_0__ relevés sur __ARG_1__",
    "Airwallex currently displays this payout form in English for the selected page language.": "Airwallex affiche actuellement ce formulaire de paiement en anglais pour la langue sélectionnée.",
    "Airwallex beneficiary form is not ready yet.": "Le formulaire bénéficiaire Airwallex n'est pas encore prêt.",
    "Airwallex payout account saved.": "Le compte de paiement Airwallex a été enregistré.",
    "Failed to save Airwallex payout account.": "Impossible d'enregistrer le compte de paiement Airwallex.",
  },
};

const ANALYTICS_UI_OVERRIDES: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    Views: "观看",
    Retention: "留存",
    Unlocks: "解锁数",
    Completion: "完播率",
    Actions: "操作",
    Gross: "总收入",
    Copyright: "版权归属",
    "Expires: __ARG_0__": "有效期至：__ARG_0__",
    "__ARG_0__% of total revenue": "占总收入的 __ARG_0__%",
    "Effective: __ARG_0__": "生效时间：__ARG_0__",
    Primary: "主要",
  },
  ja: {
    Views: "閲覧数",
    Retention: "維持率",
    Unlocks: "アンロック数",
    Completion: "完了率",
    Actions: "操作",
    Gross: "総収益",
    Copyright: "著作権",
    "Expires: __ARG_0__": "有効期限: __ARG_0__",
    "__ARG_0__% of total revenue": "総収益の __ARG_0__%",
    "Effective: __ARG_0__": "発効日: __ARG_0__",
    Primary: "主要",
  },
  es: {
    Views: "Vistas",
    Retention: "Retención",
    Unlocks: "Desbloqueos",
    Completion: "Finalización",
    Actions: "Acciones",
    Gross: "Ingresos brutos",
    Copyright: "Derechos de autor",
    "Expires: __ARG_0__": "Vence: __ARG_0__",
    "__ARG_0__% of total revenue": "__ARG_0__% de los ingresos totales",
    "Effective: __ARG_0__": "En vigor: __ARG_0__",
    Primary: "Principal",
  },
  pt: {
    Views: "Visualizações",
    Retention: "Retenção",
    Unlocks: "Desbloqueios",
    Completion: "Conclusão",
    Actions: "Ações",
    Gross: "Receita bruta",
    Copyright: "Direitos autorais",
    "Expires: __ARG_0__": "Expira em: __ARG_0__",
    "__ARG_0__% of total revenue": "__ARG_0__% da receita total",
    "Effective: __ARG_0__": "Vigência: __ARG_0__",
    Primary: "Principal",
  },
  hi: {
    Views: "व्यूज़",
    Retention: "रिटेंशन",
    Unlocks: "अनलॉक",
    Completion: "पूर्णता",
    Actions: "कार्रवाइयाँ",
    Gross: "सकल राजस्व",
    Copyright: "कॉपीराइट",
    "Expires: __ARG_0__": "समाप्ति: __ARG_0__",
    "__ARG_0__% of total revenue": "कुल राजस्व का __ARG_0__%",
    "Effective: __ARG_0__": "प्रभावी तिथि: __ARG_0__",
    Primary: "प्रमुख",
  },
  id: {
    Views: "Tayangan",
    Retention: "Retensi",
    Unlocks: "Buka kunci",
    Completion: "Penyelesaian",
    Actions: "Tindakan",
    Gross: "Pendapatan kotor",
    Copyright: "Hak cipta",
    "Expires: __ARG_0__": "Berakhir: __ARG_0__",
    "__ARG_0__% of total revenue": "__ARG_0__% dari total pendapatan",
    "Effective: __ARG_0__": "Berlaku sejak: __ARG_0__",
    Primary: "Utama",
  },
  ko: {
    Views: "조회수",
    Retention: "유지율",
    Unlocks: "잠금 해제 수",
    Completion: "완료율",
    Actions: "작업",
    Gross: "총수익",
    Copyright: "저작권",
    "Expires: __ARG_0__": "만료일: __ARG_0__",
    "__ARG_0__% of total revenue": "총수익의 __ARG_0__%",
    "Effective: __ARG_0__": "발효일: __ARG_0__",
    Primary: "주요",
  },
  fr: {
    Views: "Vues",
    Retention: "Rétention",
    Unlocks: "Déblocages",
    Completion: "Achèvement",
    Actions: "Actions",
    Gross: "Revenus bruts",
    Copyright: "Droits d'auteur",
    "Expires: __ARG_0__": "Expire le : __ARG_0__",
    "__ARG_0__% of total revenue": "__ARG_0__% du revenu total",
    "Effective: __ARG_0__": "Entrée en vigueur : __ARG_0__",
    Primary: "Principal",
  },
};

const AIRWALLEX_RUNTIME_OVERRIDES: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
    FAQ: "常见问题",
    "350 Fifth Avenue, New York, NY": "纽约州纽约市第五大道 350 号",
    English: "英语",
    Chinese: "中文",
    Japanese: "日语",
    Spanish: "西班牙语",
    Portuguese: "葡萄牙语",
    Hindi: "印地语",
    Indonesian: "印度尼西亚语",
    Korean: "韩语",
    French: "法语",
    "LLC": "有限责任公司（LLC）",
    Partnership: "合伙企业",
    Other: "其他",
    "Total Plays": "总播放量",
    "All published creator titles combined.": "统计所有已发布作品的总播放表现。",
    "Avg. Watch Time": "平均观看时长",
    "Average engagement depth across recent viewers.": "反映近期观众的平均观看深度。",
    "New Followers": "新增关注者",
    "Recent follower growth tied to active titles.": "近期由在更作品带来的关注增长。",
    "Monthly Revenue": "本月收入",
    "Current month earnings shown in USD.": "按美元展示当月累计收入。",
    "Initializing Airwallex...": "正在初始化 Airwallex...",
    "Requesting embedded auth session...": "正在请求嵌入式授权会话...",
    "Auth code request timed out after __ARG_0__s": "授权码请求在 __ARG_0__ 秒后超时",
    "Loading Airwallex SDK...": "正在加载 Airwallex SDK...",
    "SDK module import timed out after __ARG_0__s": "SDK 模块导入在 __ARG_0__ 秒后超时",
    "Initializing SDK...": "正在初始化 SDK...",
    "SDK initialization timed out after __ARG_0__s": "SDK 初始化在 __ARG_0__ 秒后超时",
    "Creating beneficiary form...": "正在创建收款账户表单...",
    "Beneficiary form creation timed out after __ARG_0__s": "收款账户表单创建在 __ARG_0__ 秒后超时",
    "Airwallex beneficiary component was not created.": "未能创建 Airwallex 收款账户组件。",
    "Beneficiary form ready.": "收款账户表单已就绪。",
    "Loading beneficiary fields...": "正在加载收款账户字段...",
    "Beneficiary form mounted.": "收款账户表单已挂载。",
    "Airwallex beneficiary container is not mounted.": "Airwallex 收款账户容器尚未挂载。",
    "Mounting beneficiary form...": "正在挂载收款账户表单...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "Airwallex 收款账户 iframe 未显示，可能是网络异常或浏览器扩展拦截了嵌入组件。",
    "Waiting for Airwallex form to finish loading...": "正在等待 Airwallex 表单完成加载...",
    "Airwallex did not return beneficiary values.": "Airwallex 未返回收款账户信息。",
    "Saving...": "保存中...",
  },
  ja: {
    FAQ: "よくある質問",
    "350 Fifth Avenue, New York, NY": "ニューヨーク州ニューヨーク市フィフスアベニュー350番地",
    English: "英語",
    Chinese: "中国語",
    Japanese: "日本語",
    Spanish: "スペイン語",
    Portuguese: "ポルトガル語",
    Hindi: "ヒンディー語",
    Indonesian: "インドネシア語",
    Korean: "韓国語",
    French: "フランス語",
    "LLC": "合同会社（LLC）",
    Partnership: "パートナーシップ",
    Other: "その他",
    "Total Plays": "総再生回数",
    "All published creator titles combined.": "公開済み作品すべての合計パフォーマンスです。",
    "Avg. Watch Time": "平均視聴時間",
    "Average engagement depth across recent viewers.": "最近の視聴者がどれだけ深く視聴しているかを示します。",
    "New Followers": "新規フォロワー",
    "Recent follower growth tied to active titles.": "公開中作品に紐づく直近のフォロワー増加です。",
    "Monthly Revenue": "今月の収益",
    "Current month earnings shown in USD.": "当月の収益を米ドルで表示しています。",
    "Initializing Airwallex...": "Airwallex を初期化しています...",
    "Requesting embedded auth session...": "埋め込み認証セッションをリクエストしています...",
    "Auth code request timed out after __ARG_0__s": "認証コードの取得が __ARG_0__ 秒でタイムアウトしました",
    "Loading Airwallex SDK...": "Airwallex SDK を読み込んでいます...",
    "SDK module import timed out after __ARG_0__s": "SDK モジュールの読み込みが __ARG_0__ 秒でタイムアウトしました",
    "Initializing SDK...": "SDK を初期化しています...",
    "SDK initialization timed out after __ARG_0__s": "SDK の初期化が __ARG_0__ 秒でタイムアウトしました",
    "Creating beneficiary form...": "受取口座フォームを作成しています...",
    "Beneficiary form creation timed out after __ARG_0__s": "受取口座フォームの作成が __ARG_0__ 秒でタイムアウトしました",
    "Airwallex beneficiary component was not created.": "Airwallex の受取口座コンポーネントを作成できませんでした。",
    "Beneficiary form ready.": "受取口座フォームの準備ができました。",
    "Loading beneficiary fields...": "受取口座フォームの項目を読み込んでいます...",
    "Beneficiary form mounted.": "受取口座フォームを表示しました。",
    "Airwallex beneficiary container is not mounted.": "Airwallex の受取口座コンテナがマウントされていません。",
    "Mounting beneficiary form...": "受取口座フォームを表示しています...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "Airwallex の受取口座 iframe が表示されませんでした。ネットワーク障害、またはブラウザ拡張によるブロックの可能性があります。",
    "Waiting for Airwallex form to finish loading...": "Airwallex フォームの読み込み完了を待っています...",
    "Airwallex did not return beneficiary values.": "Airwallex から受取口座情報が返されませんでした。",
    "Saving...": "保存中...",
  },
  es: {
    FAQ: "Preguntas frecuentes",
    "350 Fifth Avenue, New York, NY": "350 Fifth Avenue, Nueva York, NY",
    English: "Inglés",
    Chinese: "Chino",
    Japanese: "Japonés",
    Spanish: "Español",
    Portuguese: "Portugués",
    Hindi: "Hindi",
    Indonesian: "Indonesio",
    Korean: "Coreano",
    French: "Francés",
    "LLC": "LLC",
    Partnership: "Sociedad",
    Other: "Otro",
    "Total Plays": "Reproducciones totales",
    "All published creator titles combined.": "Suma el rendimiento de todos los títulos publicados.",
    "Avg. Watch Time": "Tiempo medio de reproducción",
    "Average engagement depth across recent viewers.": "Mide la profundidad media de consumo entre los espectadores recientes.",
    "New Followers": "Nuevos seguidores",
    "Recent follower growth tied to active titles.": "Crecimiento reciente de seguidores impulsado por los títulos activos.",
    "Monthly Revenue": "Ingresos mensuales",
    "Current month earnings shown in USD.": "Muestra los ingresos acumulados del mes en USD.",
    "Initializing Airwallex...": "Inicializando Airwallex...",
    "Requesting embedded auth session...": "Solicitando la sesión de autenticación integrada...",
    "Auth code request timed out after __ARG_0__s": "La solicitud del código de autorización agotó el tiempo de espera tras __ARG_0__ s",
    "Loading Airwallex SDK...": "Cargando el SDK de Airwallex...",
    "SDK module import timed out after __ARG_0__s": "La importación del módulo SDK agotó el tiempo de espera tras __ARG_0__ s",
    "Initializing SDK...": "Inicializando el SDK...",
    "SDK initialization timed out after __ARG_0__s": "La inicialización del SDK agotó el tiempo de espera tras __ARG_0__ s",
    "Creating beneficiary form...": "Creando el formulario del beneficiario...",
    "Beneficiary form creation timed out after __ARG_0__s": "La creación del formulario del beneficiario agotó el tiempo de espera tras __ARG_0__ s",
    "Airwallex beneficiary component was not created.": "No se pudo crear el componente de beneficiario de Airwallex.",
    "Beneficiary form ready.": "El formulario del beneficiario está listo.",
    "Loading beneficiary fields...": "Cargando los campos del beneficiario...",
    "Beneficiary form mounted.": "El formulario del beneficiario ya está montado.",
    "Airwallex beneficiary container is not mounted.": "El contenedor del beneficiario de Airwallex no está montado.",
    "Mounting beneficiary form...": "Montando el formulario del beneficiario...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "El iframe del beneficiario de Airwallex no apareció. Puede deberse a un problema de red o a una extensión del navegador que bloquea el componente embebido.",
    "Waiting for Airwallex form to finish loading...": "Esperando a que el formulario de Airwallex termine de cargar...",
    "Airwallex did not return beneficiary values.": "Airwallex no devolvió los datos del beneficiario.",
    "Saving...": "Guardando...",
  },
  pt: {
    FAQ: "Perguntas frequentes",
    "350 Fifth Avenue, New York, NY": "350 Fifth Avenue, Nova York, NY",
    English: "Inglês",
    Chinese: "Chinês",
    Japanese: "Japonês",
    Spanish: "Espanhol",
    Portuguese: "Português",
    Hindi: "Hindi",
    Indonesian: "Indonésio",
    Korean: "Coreano",
    French: "Francês",
    "LLC": "LLC",
    Partnership: "Sociedade",
    Other: "Outro",
    "Total Plays": "Reproduções totais",
    "All published creator titles combined.": "Soma o desempenho de todos os títulos publicados.",
    "Avg. Watch Time": "Tempo médio de exibição",
    "Average engagement depth across recent viewers.": "Mostra a profundidade média de engajamento dos espectadores recentes.",
    "New Followers": "Novos seguidores",
    "Recent follower growth tied to active titles.": "Crescimento recente de seguidores ligado aos títulos ativos.",
    "Monthly Revenue": "Receita mensal",
    "Current month earnings shown in USD.": "Exibe o acumulado do mês em USD.",
    "Initializing Airwallex...": "Inicializando a Airwallex...",
    "Requesting embedded auth session...": "Solicitando a sessão de autenticação incorporada...",
    "Auth code request timed out after __ARG_0__s": "A solicitação do código de autenticação expirou após __ARG_0__ s",
    "Loading Airwallex SDK...": "Carregando o SDK da Airwallex...",
    "SDK module import timed out after __ARG_0__s": "A importação do módulo SDK expirou após __ARG_0__ s",
    "Initializing SDK...": "Inicializando o SDK...",
    "SDK initialization timed out after __ARG_0__s": "A inicialização do SDK expirou após __ARG_0__ s",
    "Creating beneficiary form...": "Criando o formulário do beneficiário...",
    "Beneficiary form creation timed out after __ARG_0__s": "A criação do formulário do beneficiário expirou após __ARG_0__ s",
    "Airwallex beneficiary component was not created.": "Não foi possível criar o componente de beneficiário da Airwallex.",
    "Beneficiary form ready.": "O formulário do beneficiário está pronto.",
    "Loading beneficiary fields...": "Carregando os campos do beneficiário...",
    "Beneficiary form mounted.": "O formulário do beneficiário foi montado.",
    "Airwallex beneficiary container is not mounted.": "O contêiner do beneficiário Airwallex não foi montado.",
    "Mounting beneficiary form...": "Montando o formulário do beneficiário...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "O iframe do beneficiário Airwallex não apareceu. Isso pode ter sido causado por um problema de rede ou por uma extensão do navegador bloqueando o componente incorporado.",
    "Waiting for Airwallex form to finish loading...": "Aguardando o formulário da Airwallex terminar de carregar...",
    "Airwallex did not return beneficiary values.": "A Airwallex não retornou os dados do beneficiário.",
    "Saving...": "Salvando...",
  },
  hi: {
    FAQ: "अक्सर पूछे जाने वाले सवाल",
    "350 Fifth Avenue, New York, NY": "350 फिफ्थ एवेन्यू, न्यूयॉर्क, एनवाई",
    English: "अंग्रेज़ी",
    Chinese: "चीनी",
    Japanese: "जापानी",
    Spanish: "स्पेनिश",
    Portuguese: "पुर्तगाली",
    Hindi: "हिंदी",
    Indonesian: "इंडोनेशियाई",
    Korean: "कोरियाई",
    French: "फ़्रेंच",
    "LLC": "एलएलसी",
    Partnership: "साझेदारी",
    Other: "अन्य",
    "Total Plays": "कुल प्ले",
    "All published creator titles combined.": "सभी प्रकाशित शीर्षकों का संयुक्त प्रदर्शन।",
    "Avg. Watch Time": "औसत देखने का समय",
    "Average engagement depth across recent viewers.": "हाल के दर्शकों की औसत एंगेजमेंट गहराई दिखाता है।",
    "New Followers": "नए फ़ॉलोअर",
    "Recent follower growth tied to active titles.": "सक्रिय शीर्षकों से जुड़ी हाल की फ़ॉलोअर वृद्धि।",
    "Monthly Revenue": "मासिक राजस्व",
    "Current month earnings shown in USD.": "मौजूदा महीने की कमाई USD में दिखाई गई है।",
    "Initializing Airwallex...": "Airwallex प्रारंभ किया जा रहा है...",
    "Requesting embedded auth session...": "एम्बेडेड ऑथ सेशन का अनुरोध किया जा रहा है...",
    "Auth code request timed out after __ARG_0__s": "__ARG_0__ सेकंड बाद ऑथ कोड अनुरोध का समय समाप्त हो गया",
    "Loading Airwallex SDK...": "Airwallex SDK लोड हो रहा है...",
    "SDK module import timed out after __ARG_0__s": "__ARG_0__ सेकंड बाद SDK मॉड्यूल इम्पोर्ट का समय समाप्त हो गया",
    "Initializing SDK...": "SDK प्रारंभ किया जा रहा है...",
    "SDK initialization timed out after __ARG_0__s": "__ARG_0__ सेकंड बाद SDK प्रारंभ करने का समय समाप्त हो गया",
    "Creating beneficiary form...": "beneficiary फ़ॉर्म बनाया जा रहा है...",
    "Beneficiary form creation timed out after __ARG_0__s": "__ARG_0__ सेकंड बाद beneficiary फ़ॉर्म बनाने का समय समाप्त हो गया",
    "Airwallex beneficiary component was not created.": "Airwallex beneficiary कॉम्पोनेंट बनाया नहीं जा सका।",
    "Beneficiary form ready.": "beneficiary फ़ॉर्म तैयार है।",
    "Loading beneficiary fields...": "beneficiary फ़ील्ड लोड हो रही हैं...",
    "Beneficiary form mounted.": "beneficiary फ़ॉर्म माउंट हो गया है।",
    "Airwallex beneficiary container is not mounted.": "Airwallex beneficiary कंटेनर माउंट नहीं हुआ है।",
    "Mounting beneficiary form...": "beneficiary फ़ॉर्म माउंट किया जा रहा है...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "Airwallex beneficiary iframe दिखाई नहीं दिया। यह नेटवर्क समस्या या ब्राउज़र एक्सटेंशन द्वारा एम्बेडेड कॉम्पोनेंट ब्लॉक किए जाने के कारण हो सकता है।",
    "Waiting for Airwallex form to finish loading...": "Airwallex फ़ॉर्म के पूरी तरह लोड होने का इंतज़ार किया जा रहा है...",
    "Airwallex did not return beneficiary values.": "Airwallex ने beneficiary विवरण वापस नहीं किया।",
    "Saving...": "सहेजा जा रहा है...",
  },
  id: {
    FAQ: "Pertanyaan umum",
    "350 Fifth Avenue, New York, NY": "Jl. Jenderal Sudirman No. 88, Jakarta",
    English: "Bahasa Inggris",
    Chinese: "Bahasa Mandarin",
    Japanese: "Bahasa Jepang",
    Spanish: "Bahasa Spanyol",
    Portuguese: "Bahasa Portugis",
    Hindi: "Bahasa Hindi",
    Indonesian: "Bahasa Indonesia",
    Korean: "Bahasa Korea",
    French: "Bahasa Prancis",
    "LLC": "PT / LLC",
    Partnership: "Kemitraan",
    Other: "Lainnya",
    "Total Plays": "Total tayangan",
    "All published creator titles combined.": "Gabungan performa semua judul yang sudah dipublikasikan.",
    "Avg. Watch Time": "Rata-rata waktu tonton",
    "Average engagement depth across recent viewers.": "Menunjukkan kedalaman engagement rata-rata dari penonton terbaru.",
    "New Followers": "Pengikut baru",
    "Recent follower growth tied to active titles.": "Pertumbuhan pengikut terbaru yang berasal dari judul aktif.",
    "Monthly Revenue": "Pendapatan bulanan",
    "Current month earnings shown in USD.": "Pendapatan bulan berjalan ditampilkan dalam USD.",
    "Initializing Airwallex...": "Menginisialisasi Airwallex...",
    "Requesting embedded auth session...": "Meminta sesi autentikasi tersemat...",
    "Auth code request timed out after __ARG_0__s": "Permintaan kode autentikasi habis waktu setelah __ARG_0__ dtk",
    "Loading Airwallex SDK...": "Memuat SDK Airwallex...",
    "SDK module import timed out after __ARG_0__s": "Impor modul SDK habis waktu setelah __ARG_0__ dtk",
    "Initializing SDK...": "Menginisialisasi SDK...",
    "SDK initialization timed out after __ARG_0__s": "Inisialisasi SDK habis waktu setelah __ARG_0__ dtk",
    "Creating beneficiary form...": "Membuat formulir beneficiary...",
    "Beneficiary form creation timed out after __ARG_0__s": "Pembuatan formulir beneficiary habis waktu setelah __ARG_0__ dtk",
    "Airwallex beneficiary component was not created.": "Komponen beneficiary Airwallex gagal dibuat.",
    "Beneficiary form ready.": "Formulir beneficiary siap.",
    "Loading beneficiary fields...": "Memuat kolom beneficiary...",
    "Beneficiary form mounted.": "Formulir beneficiary berhasil dipasang.",
    "Airwallex beneficiary container is not mounted.": "Kontainer beneficiary Airwallex belum dipasang.",
    "Mounting beneficiary form...": "Memasang formulir beneficiary...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "Iframe beneficiary Airwallex tidak muncul. Hal ini bisa disebabkan masalah jaringan atau ekstensi browser yang memblokir komponen tersemat.",
    "Waiting for Airwallex form to finish loading...": "Menunggu formulir Airwallex selesai dimuat...",
    "Airwallex did not return beneficiary values.": "Airwallex tidak mengembalikan data beneficiary.",
    "Saving...": "Menyimpan...",
  },
  ko: {
    FAQ: "자주 묻는 질문",
    "350 Fifth Avenue, New York, NY": "서울특별시 강남구 테헤란로 521",
    English: "영어",
    Chinese: "중국어",
    Japanese: "일본어",
    Spanish: "스페인어",
    Portuguese: "포르투갈어",
    Hindi: "힌디어",
    Indonesian: "인도네시아어",
    Korean: "한국어",
    French: "프랑스어",
    "LLC": "유한책임회사(LLC)",
    Partnership: "파트너십",
    Other: "기타",
    "Total Plays": "총 재생 수",
    "All published creator titles combined.": "게시된 모든 작품의 합산 성과입니다.",
    "Avg. Watch Time": "평균 시청 시간",
    "Average engagement depth across recent viewers.": "최근 시청자의 평균 몰입도를 보여줍니다.",
    "New Followers": "신규 팔로워",
    "Recent follower growth tied to active titles.": "운영 중인 작품이 이끈 최근 팔로워 증가입니다.",
    "Monthly Revenue": "월간 수익",
    "Current month earnings shown in USD.": "이번 달 누적 수익을 USD로 표시합니다.",
    "Initializing Airwallex...": "Airwallex를 초기화하는 중입니다...",
    "Requesting embedded auth session...": "임베디드 인증 세션을 요청하는 중입니다...",
    "Auth code request timed out after __ARG_0__s": "__ARG_0__초 후 인증 코드 요청 시간이 초과되었습니다",
    "Loading Airwallex SDK...": "Airwallex SDK를 불러오는 중입니다...",
    "SDK module import timed out after __ARG_0__s": "__ARG_0__초 후 SDK 모듈 가져오기가 시간 초과되었습니다",
    "Initializing SDK...": "SDK를 초기화하는 중입니다...",
    "SDK initialization timed out after __ARG_0__s": "__ARG_0__초 후 SDK 초기화가 시간 초과되었습니다",
    "Creating beneficiary form...": "수취인 양식을 만드는 중입니다...",
    "Beneficiary form creation timed out after __ARG_0__s": "__ARG_0__초 후 수취인 양식 생성이 시간 초과되었습니다",
    "Airwallex beneficiary component was not created.": "Airwallex 수취인 컴포넌트를 생성하지 못했습니다.",
    "Beneficiary form ready.": "수취인 양식이 준비되었습니다.",
    "Loading beneficiary fields...": "수취인 항목을 불러오는 중입니다...",
    "Beneficiary form mounted.": "수취인 양식이 표시되었습니다.",
    "Airwallex beneficiary container is not mounted.": "Airwallex 수취인 컨테이너가 마운트되지 않았습니다.",
    "Mounting beneficiary form...": "수취인 양식을 표시하는 중입니다...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "Airwallex 수취인 iframe이 나타나지 않았습니다. 네트워크 문제이거나 브라우저 확장 프로그램이 임베드 컴포넌트를 차단했을 수 있습니다.",
    "Waiting for Airwallex form to finish loading...": "Airwallex 양식이 모두 로드될 때까지 기다리는 중입니다...",
    "Airwallex did not return beneficiary values.": "Airwallex가 수취인 정보를 반환하지 않았습니다.",
    "Saving...": "저장 중...",
  },
  fr: {
    FAQ: "Questions fréquentes",
    "350 Fifth Avenue, New York, NY": "12 avenue des Arts, Paris",
    English: "Anglais",
    Chinese: "Chinois",
    Japanese: "Japonais",
    Spanish: "Espagnol",
    Portuguese: "Portugais",
    Hindi: "Hindi",
    Indonesian: "Indonésien",
    Korean: "Coréen",
    French: "Français",
    "LLC": "SARL / LLC",
    Partnership: "Partenariat",
    Other: "Autre",
    "Total Plays": "Lectures totales",
    "All published creator titles combined.": "Cumule les performances de tous les titres publiés.",
    "Avg. Watch Time": "Durée moyenne de visionnage",
    "Average engagement depth across recent viewers.": "Indique la profondeur moyenne d'engagement des spectateurs récents.",
    "New Followers": "Nouveaux abonnés",
    "Recent follower growth tied to active titles.": "Croissance récente des abonnés liée aux titres actifs.",
    "Monthly Revenue": "Revenus mensuels",
    "Current month earnings shown in USD.": "Affiche les revenus du mois en USD.",
    "Initializing Airwallex...": "Initialisation d'Airwallex...",
    "Requesting embedded auth session...": "Demande de session d'authentification intégrée...",
    "Auth code request timed out after __ARG_0__s": "La demande de code d'authentification a expiré après __ARG_0__ s",
    "Loading Airwallex SDK...": "Chargement du SDK Airwallex...",
    "SDK module import timed out after __ARG_0__s": "L'importation du module SDK a expiré après __ARG_0__ s",
    "Initializing SDK...": "Initialisation du SDK...",
    "SDK initialization timed out after __ARG_0__s": "L'initialisation du SDK a expiré après __ARG_0__ s",
    "Creating beneficiary form...": "Création du formulaire bénéficiaire...",
    "Beneficiary form creation timed out after __ARG_0__s": "La création du formulaire bénéficiaire a expiré après __ARG_0__ s",
    "Airwallex beneficiary component was not created.": "Le composant bénéficiaire Airwallex n'a pas pu être créé.",
    "Beneficiary form ready.": "Le formulaire bénéficiaire est prêt.",
    "Loading beneficiary fields...": "Chargement des champs bénéficiaires...",
    "Beneficiary form mounted.": "Le formulaire bénéficiaire est affiché.",
    "Airwallex beneficiary container is not mounted.": "Le conteneur bénéficiaire Airwallex n'est pas monté.",
    "Mounting beneficiary form...": "Affichage du formulaire bénéficiaire...",
    "Airwallex beneficiary iframe did not appear. This may be caused by a network issue or browser extension blocking the embedded component.": "L'iframe bénéficiaire Airwallex ne s'est pas affichée. Cela peut être dû à un problème réseau ou à une extension du navigateur qui bloque le composant intégré.",
    "Waiting for Airwallex form to finish loading...": "En attente de la fin du chargement du formulaire Airwallex...",
    "Airwallex did not return beneficiary values.": "Airwallex n'a pas renvoyé les informations du bénéficiaire.",
    "Saving...": "Enregistrement...",
  },
};

for (const [locale, entries] of Object.entries(ANALYTICS_UI_OVERRIDES) as Array<[SupportedLocale, Record<string, string>]>) {
  TRANSLATION_OVERRIDES[locale] = {
    ...(TRANSLATION_OVERRIDES[locale] || {}),
    ...entries,
  };
}

for (const [locale, entries] of Object.entries(AIRWALLEX_RUNTIME_OVERRIDES) as Array<[SupportedLocale, Record<string, string>]>) {
  TRANSLATION_OVERRIDES[locale] = {
    ...(TRANSLATION_OVERRIDES[locale] || {}),
    ...entries,
  };
}

const TEXT_NODE_ORIGINALS = new WeakMap<Text, string>();
const ELEMENT_ATTR_ORIGINALS = new WeakMap<Element, Partial<Record<"placeholder" | "title" | "aria-label" | "value", string>>>();

const TEMPLATE_RULES: Array<{ pattern: RegExp; template: string }> = [
  { pattern: /^Step (\d+)$/i, template: "Step __ARG_0__" },
  { pattern: /^Step (\d+) of (\d+): (.+)$/i, template: "Step __ARG_0__ of __ARG_1__: __ARG_2__" },
  { pattern: /^Portfolio Link (\d+)$/i, template: "Portfolio Link __ARG_0__" },
  { pattern: /^Select (.+)$/i, template: "Select __ARG_0__" },
  { pattern: /^Modified (\d+) hours ago$/i, template: "Modified __ARG_0__ hours ago" },
  { pattern: /^Updated (\d+) days ago$/i, template: "Updated __ARG_0__ days ago" },
  { pattern: /^Updated ([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})$/i, template: "Updated __ARG_0__" },
  { pattern: /^Saved (\d+)m ago$/i, template: "Saved __ARG_0__m ago" },
  { pattern: /^Saved (\d+)h ago$/i, template: "Saved __ARG_0__h ago" },
  { pattern: /^Saved (\d+)d ago$/i, template: "Saved __ARG_0__d ago" },
  { pattern: /^(\d+)h ago$/i, template: "__ARG_0__h ago" },
  { pattern: /^(\d+)d ago$/i, template: "__ARG_0__d ago" },
  { pattern: /^(\d+)% complete$/i, template: "__ARG_0__% complete" },
  { pattern: /^Showing (\d+) to (\d+) of ([\d,]+) entries$/i, template: "Showing __ARG_0__ to __ARG_1__ of __ARG_2__ entries" },
  { pattern: /^Progress:\s*(\d+)%$/i, template: "Progress: __ARG_0__%" },
  { pattern: /^Uploading (\d+)%$/i, template: "Uploading __ARG_0__%" },
  { pattern: /^Uploading source (\d+)%$/i, template: "Uploading source __ARG_0__%" },
  { pattern: /^Step (\d+) of (\d+)$/i, template: "Step __ARG_0__ of __ARG_1__" },
  { pattern: /^Episode (\d+)$/i, template: "Episode __ARG_0__" },
  { pattern: /^Delete episode (\d+)$/i, template: "Delete episode __ARG_0__" },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function interpolateTemplate(template: string, args: Array<string | number>) {
  return template.replace(/__ARG_(\d+)__/g, (_, index) => String(args[Number(index)] ?? ""));
}

function translateExact(value: string, locale: SupportedLocale) {
  if (locale === "en" || !value) return value;
  return TRANSLATION_OVERRIDES[locale]?.[value] || TRANSLATIONS[locale]?.[value] || value;
}

function translateTemplate(source: string, locale: SupportedLocale) {
  const trimmed = source.trim();
  if (!trimmed || locale === "en") return source;

  for (const rule of TEMPLATE_RULES) {
    const match = trimmed.match(rule.pattern);
    if (!match) continue;

    const translatedTemplate = translateExact(rule.template, locale);
    if (!translatedTemplate || translatedTemplate === rule.template) continue;

    const next = translatedTemplate.replace(/__ARG_(\d+)__/g, (_, index) => match[Number(index) + 1] || "");
    return preserveWhitespace(source, next);
  }

  return source;
}

export function translateCreatorText(
  value: string,
  locale: SupportedLocale,
  args: Array<string | number> = []
) {
  if (!value) return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  if (locale === "en") {
    return preserveWhitespace(value, interpolateTemplate(trimmed, args));
  }

  const exact = translateExact(trimmed, locale);
  if (exact !== trimmed) {
    return preserveWhitespace(value, interpolateTemplate(exact, args));
  }

  return interpolateTemplate(translateTemplate(value, locale), args);
}

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("[data-creator-i18n-controlled='true']")) return true;

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

function translateTextNode(node: Text, locale: SupportedLocale) {
  if (shouldSkipTextNode(node)) return;

  const current = node.nodeValue || "";
  const storedOriginal = TEXT_NODE_ORIGINALS.get(node);

  if (storedOriginal === undefined) {
    TEXT_NODE_ORIGINALS.set(node, current);
  } else if (locale !== "en") {
    const translatedFromOriginal = translateCreatorText(storedOriginal, locale);
    if (current !== storedOriginal && current !== translatedFromOriginal) {
      TEXT_NODE_ORIGINALS.set(node, current);
    }
  }

  const original = TEXT_NODE_ORIGINALS.get(node) || current;
  const next = translateCreatorText(original, locale);
  if (next !== current) {
    node.nodeValue = next;
  }
}

function translateElementAttributes(element: Element, locale: SupportedLocale) {
  if (element.closest("[data-creator-i18n-controlled='true']")) return;

  const attrNames: Array<"placeholder" | "title" | "aria-label"> = ["placeholder", "title", "aria-label"];
  const originals = ELEMENT_ATTR_ORIGINALS.get(element) || {};

  attrNames.forEach((attrName) => {
    const attrValue = element.getAttribute(attrName);
    if (attrValue !== null && originals[attrName] === undefined) {
      originals[attrName] = attrValue;
    } else if (attrValue !== null && originals[attrName] !== undefined && locale !== "en") {
      const translatedFromOriginal = translateCreatorText(originals[attrName] || "", locale);
      if (attrValue !== originals[attrName] && attrValue !== translatedFromOriginal) {
        originals[attrName] = attrValue;
      }
    }

    if (originals[attrName] !== undefined) {
      const next = translateCreatorText(originals[attrName] || "", locale);
      if (element.getAttribute(attrName) !== next) {
        element.setAttribute(attrName, next);
      }
    }
  });

  if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
    if (originals.value === undefined) {
      originals.value = element.value;
    } else if (locale !== "en") {
      const translatedFromOriginal = translateCreatorText(originals.value || "", locale);
      if (element.value !== originals.value && element.value !== translatedFromOriginal) {
        originals.value = element.value;
      }
    }

    const nextValue = translateCreatorText(originals.value || "", locale);
    if (element.value !== nextValue) {
      element.value = nextValue;
    }
  }

  ELEMENT_ATTR_ORIGINALS.set(element, originals);
}

export function applyCreatorTranslations(root: ParentNode, locale: SupportedLocale) {
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

export function getCreatorIntlLocale(locale: SupportedLocale) {
  switch (locale) {
    case "zh":
      return "zh-CN";
    case "ja":
      return "ja-JP";
    case "es":
      return "es-ES";
    case "pt":
      return "pt-BR";
    case "hi":
      return "hi-IN";
    case "id":
      return "id-ID";
    case "ko":
      return "ko-KR";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
}

function parseDateInput(value: DateInput) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCreatorNumber(value: number, locale: SupportedLocale, options?: Intl.NumberFormatOptions) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(getCreatorIntlLocale(locale), options).format(safeValue);
}

export function formatCreatorCurrency(
  value: number,
  locale: SupportedLocale,
  currency = "USD",
  options?: Intl.NumberFormatOptions
) {
  return formatCreatorNumber(value, locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

export function formatCreatorDate(
  value: DateInput,
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  fallback = "-"
) {
  const date = parseDateInput(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(getCreatorIntlLocale(locale), options).format(date);
}

export function formatCreatorRelativeTime(
  value: DateInput,
  locale: SupportedLocale,
  style: RelativeTimeStyle = "short",
  fallback = "-"
) {
  const date = parseDateInput(value);
  if (!date) return fallback;

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 604800, divisor: 86400, unit: "day" },
    { limit: 2629800, divisor: 604800, unit: "week" },
    { limit: 31557600, divisor: 2629800, unit: "month" },
    { limit: Number.POSITIVE_INFINITY, divisor: 31557600, unit: "year" },
  ];

  const formatter = new Intl.RelativeTimeFormat(getCreatorIntlLocale(locale), {
    numeric: "auto",
    style,
  });

  const abs = Math.abs(diffSeconds);
  const target = units.find((item) => abs < item.limit) || units[units.length - 1];
  return formatter.format(Math.round(diffSeconds / target.divisor), target.unit);
}

export function useCreatorI18n() {
  const locale = useLocale();

  const t = useCallback<CreatorTranslateFn>(
    (value, ...args) => translateCreatorText(value, locale, args),
    [locale]
  );

  return useMemo(
    () => ({
      locale,
      lang: getCreatorIntlLocale(locale),
      t,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatCreatorNumber(value, locale, options),
      formatCurrency: (value: number, currency = "USD", options?: Intl.NumberFormatOptions) =>
        formatCreatorCurrency(value, locale, currency, options),
      formatDate: (value: DateInput, options?: Intl.DateTimeFormatOptions, fallback?: string) =>
        formatCreatorDate(value, locale, options, fallback),
      formatRelativeTime: (value: DateInput, style?: RelativeTimeStyle, fallback?: string) =>
        formatCreatorRelativeTime(value, locale, style, fallback),
    }),
    [locale, t]
  );
}

export function CreatorI18nProvider({
  locale,
  children,
}: {
  locale: SupportedLocale;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current || !isBrowser()) return undefined;

    let frame = 0;
    const root = rootRef.current;

    const scheduleTranslate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyCreatorTranslations(root, locale);
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
  }, [locale]);

  const lang = useMemo(() => getCreatorIntlLocale(locale), [locale]);

  return (
    <div ref={rootRef} data-creator-i18n-root lang={lang}>
      {children}
    </div>
  );
}

export default CreatorI18nProvider;
