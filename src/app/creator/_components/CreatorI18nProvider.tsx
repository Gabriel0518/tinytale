"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SupportedLocale } from "@/lib/i18n";
import translationMap from "../_lib/creator-translations.generated.json";

type TranslationTable = Partial<Record<SupportedLocale, Record<string, string>>>;

const TRANSLATIONS = translationMap as TranslationTable;

const TRANSLATION_OVERRIDES: Partial<Record<SupportedLocale, Record<string, string>>> = {
  zh: {
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
    "Step 01": "第 1 步",
    "Step 02": "第 2 步",
    "Step 03": "第 3 步",
    "Step 04": "第 4 步",
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
    Urgent: "紧急",
    Open: "处理中",
    "In Progress": "跟进中",
    "Waiting Support": "等待平台处理",
    "Waiting You": "等待你处理",
    Resolved: "已解决",
    Closed: "已关闭",
  },
};

const TEXT_NODE_ORIGINALS = new WeakMap<Text, string>();
const ELEMENT_ATTR_ORIGINALS = new WeakMap<Element, Partial<Record<"placeholder" | "title" | "aria-label" | "value", string>>>();

const TEMPLATE_RULES: Array<{ pattern: RegExp; template: string }> = [
  { pattern: /^Step (\d+)$/i, template: "Step __ARG_0__" },
  { pattern: /^Modified (\d+) hours ago$/i, template: "Modified __ARG_0__ hours ago" },
  { pattern: /^Updated (\d+) days ago$/i, template: "Updated __ARG_0__ days ago" },
  { pattern: /^Updated ([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})$/i, template: "Updated __ARG_0__" },
  { pattern: /^(\d+)h ago$/i, template: "__ARG_0__h ago" },
  { pattern: /^(\d+)d ago$/i, template: "__ARG_0__d ago" },
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

function translateText(value: string, locale: SupportedLocale) {
  if (locale === "en" || !value) return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const exact = translateExact(trimmed, locale);
  if (exact !== trimmed) {
    return preserveWhitespace(value, exact);
  }

  return translateTemplate(value, locale);
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
  if (!TEXT_NODE_ORIGINALS.has(node)) {
    TEXT_NODE_ORIGINALS.set(node, current);
  }

  const original = TEXT_NODE_ORIGINALS.get(node) || current;
  const next = translateText(original, locale);
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
    }

    if (originals[attrName] !== undefined) {
      const next = translateText(originals[attrName] || "", locale);
      if (element.getAttribute(attrName) !== next) {
        element.setAttribute(attrName, next);
      }
    }
  });

  if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
    if (originals.value === undefined) {
      originals.value = element.value;
    }

    const nextValue = translateText(originals.value || "", locale);
    if (element.value !== nextValue) {
      element.value = nextValue;
    }
  }

  ELEMENT_ATTR_ORIGINALS.set(element, originals);
}

function applyTranslations(root: ParentNode, locale: SupportedLocale) {
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

export default function CreatorI18nProvider({
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
        applyTranslations(root, locale);
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

  const lang = useMemo(() => {
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
        return "en";
    }
  }, [locale]);

  return (
    <div ref={rootRef} data-creator-i18n-root lang={lang}>
      {children}
    </div>
  );
}
