"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { contactApi } from "@/lib/api";
import { detectClientLocale, SupportedLocale } from "@/lib/i18n";

type TabKey = "about" | "privacy" | "terms" | "faq";

type HelpCopy = {
  tabs: Record<TabKey, string>;
  sidebar: {
    about: { id: string; label: string }[];
    privacy: { id: string; label: string }[];
    terms: { id: string; label: string }[];
    faq: { id: string; label: string }[];
  };
  heroTitle: string;
  heroSubtitle: string;
  about: {
    missionTitle: string;
    missionText: string;
    storyTitle: string;
    storyParas: string[];
    statsTitle: string;
    statsLabels: string[];
    teamTitle: string;
    teamRoles: string[];
  };
  privacy: {
    lastUpdated: string;
    introTitle: string;
    intro: string;
    collectTitle: string;
    collect: string[];
    useTitle: string;
    use: string;
    shareTitle: string;
    share: string;
    securityTitle: string;
    security: string;
    rightsTitle: string;
    rights: string;
  };
  terms: {
    lastUpdated: string;
    introTitle: string;
    intro: string;
    accountTitle: string;
    account: string;
    contentTitle: string;
    content: string;
    coinsTitle: string;
    coins: string;
    conductTitle: string;
    conduct: string;
    terminationTitle: string;
    termination: string;
  };
  faq: {
    sections: {
      id: string;
      title: string;
      items: { q: string; a: string }[];
    }[];
  };
  contact: {
    title: string;
    subtitle: string;
    emailSupport: string;
    emailValue: string;
    emailHint: string;
    liveChat: string;
    liveChatValue: string;
    liveChatHint: string;
    hq: string;
    hqValue: string;
    hqHint: string;
    types: { general: string; technical: string; business: string };
    placeholders: { name: string; email: string; subject: string; message: string };
    sending: string;
    sent: string;
    send: string;
    failed: string;
  };
};

const TEAM_NAMES = ["Sarah Chen", "Marcus Liu", "Emily Park", "David Kim"];

const COPY: Record<SupportedLocale, HelpCopy> = {
  en: {
    tabs: { about: "About Us", privacy: "Privacy Policy", terms: "Terms of Service", faq: "FAQ" },
    sidebar: {
      about: [
        { id: "mission", label: "Our Mission" },
        { id: "story", label: "Our Story" },
        { id: "stats", label: "By the Numbers" },
        { id: "team", label: "Leadership" },
      ],
      privacy: [
        { id: "pp-intro", label: "Introduction" },
        { id: "pp-collect", label: "Information We Collect" },
        { id: "pp-use", label: "How We Use Data" },
        { id: "pp-share", label: "Data Sharing" },
        { id: "pp-security", label: "Security" },
        { id: "pp-rights", label: "Your Rights" },
      ],
      terms: [
        { id: "tos-intro", label: "Introduction" },
        { id: "tos-account", label: "Account Terms" },
        { id: "tos-content", label: "Content & Licensing" },
        { id: "tos-coins", label: "Virtual Currency" },
        { id: "tos-conduct", label: "User Conduct" },
        { id: "tos-termination", label: "Termination" },
      ],
      faq: [
        { id: "faq-account", label: "Account & Login" },
        { id: "faq-coins", label: "Coins & Payment" },
        { id: "faq-content", label: "Watching & Content" },
        { id: "faq-vip", label: "VIP Membership" },
      ],
    },
    heroTitle: "Information & Help Center",
    heroSubtitle: "Everything you need to know about TinyTale. Our mission, policies, and answers to your questions.",
    about: {
      missionTitle: "Our Mission",
      missionText: "At TinyTale, we believe everyone deserves access to captivating stories. We bring premium short dramas to global audiences, break language barriers, and redefine mobile entertainment.",
      storyTitle: "Our Story",
      storyParas: [
        "Founded in 2023 in San Francisco, TinyTale started with a simple idea: great stories should fit modern life.",
        "We built a platform focused on short-form drama that stays emotional, cinematic, and binge-worthy.",
        "Today we serve millions of viewers across 45+ countries with 500+ original titles, and we're still growing.",
      ],
      statsTitle: "By the Numbers",
      statsLabels: ["Global Users", "Original Dramas", "Countries", "Hours Watched"],
      teamTitle: "Leadership",
      teamRoles: ["CEO & Co-Founder", "CTO", "VP of Content", "Head of Design"],
    },
    privacy: {
      lastUpdated: "Last updated: January 15, 2026",
      introTitle: "Introduction",
      intro: "This Privacy Policy explains how TinyTale Inc. collects, uses, and shares your information when you use our website, mobile applications, and related services.",
      collectTitle: "Information We Collect",
      collect: [
        "We collect information you provide directly, including account data, contact details, payment details, and viewing preferences.",
        "We also collect technical data automatically, such as device information, IP address, browser, and interaction data.",
      ],
      useTitle: "How We Use Data",
      use: "We use data to operate and improve our services, process payments, personalize recommendations, provide support, and keep the platform secure.",
      shareTitle: "Data Sharing",
      share: "We do not sell your personal information. We share data only with trusted service providers, legal authorities when required, and for safety or legal compliance.",
      securityTitle: "Security",
      security: "We apply industry-standard security measures, including encryption for payments and regular security reviews.",
      rightsTitle: "Your Rights",
      rights: "Depending on your region, you may request access, correction, deletion, or export of your personal data, and object to specific processing activities.",
    },
    terms: {
      lastUpdated: "Last updated: January 15, 2026",
      introTitle: "Introduction",
      intro: "These Terms of Service govern your use of TinyTale services. By using TinyTale, you agree to these terms.",
      accountTitle: "Account Terms",
      account: "You must meet the age requirements in your region and keep your account credentials secure. You're responsible for activity under your account.",
      contentTitle: "Content & Licensing",
      content: "All platform content is protected by intellectual property laws. You receive a limited, personal, non-commercial license to access and view content.",
      coinsTitle: "Virtual Currency",
      coins: "TinyTale Coins are virtual items with no cash value. Purchase terms and refund rules follow applicable law and platform policy.",
      conductTitle: "User Conduct",
      conduct: "You may not misuse the platform, harm others, distribute malicious content, or attempt unauthorized access to our systems.",
      terminationTitle: "Termination",
      termination: "We may suspend or terminate accounts for policy violations or legal reasons. Access ends immediately after termination.",
    },
    faq: {
      sections: [
        {
          id: "faq-account",
          title: "Account & Login",
          items: [
            { q: "How do I create an account?", a: "Tap Sign Up on the login page. You can register with email or use Google sign-in." },
            { q: "I forgot my password. How do I reset it?", a: "Use Forgot password on the login page. We'll send a verification code to your email." },
            { q: "How do I delete my account?", a: "Go to Settings > Delete Account. This action is irreversible." },
          ],
        },
        {
          id: "faq-coins",
          title: "Coins & Payment",
          items: [
            { q: "What are coins and how do they work?", a: "Coins are used to unlock premium episodes. Different episodes can require different amounts." },
            { q: "How do I recharge coins?", a: "Open Profile > Coins, choose a package, and complete payment via Stripe." },
            { q: "Can I get a refund?", a: "Refund eligibility depends on local law and purchase usage status. Contact support for help." },
          ],
        },
        {
          id: "faq-content",
          title: "Watching & Content",
          items: [
            { q: "Are all episodes free?", a: "Some early episodes may be free. Premium episodes require coins or VIP access." },
            { q: "Can I download episodes for offline viewing?", a: "Offline viewing is available for eligible plans and selected content." },
            { q: "How do I report a playback problem?", a: "Use the report option in player or submit the contact form below." },
          ],
        },
        {
          id: "faq-vip",
          title: "VIP Membership",
          items: [
            { q: "What benefits does VIP include?", a: "VIP includes broad content access, better viewing experience, and periodic benefits depending on plan." },
            { q: "How do I cancel my subscription?", a: "Go to Settings > Subscription and choose Cancel Subscription." },
            { q: "Can I switch between monthly and annual plans?", a: "Yes. Go to Settings > Subscription to change plans." },
          ],
        },
      ],
    },
    contact: {
      title: "Contact Us",
      subtitle: "Have a question or feedback? We'd love to hear from you.",
      emailSupport: "Email Support",
      emailValue: "support@tinytale.com",
      emailHint: "Response within 24 hours",
      liveChat: "Live Chat",
      liveChatValue: "Available 9 AM – 9 PM EST",
      liveChatHint: "Average wait time: 2 minutes",
      hq: "Headquarters",
      hqValue: "San Francisco, California",
      hqHint: "With offices in LA, Seoul & Singapore",
      types: { general: "General", technical: "Technical", business: "Business" },
      placeholders: {
        name: "Your Name",
        email: "Email Address",
        subject: "Subject",
        message: "Your message...",
      },
      sending: "Sending...",
      sent: "Sent Successfully!",
      send: "Send Message",
      failed: "Failed to send. Please try again.",
    },
  },
  zh: {
    tabs: { about: "关于我们", privacy: "隐私政策", terms: "服务条款", faq: "常见问题" },
    sidebar: {
      about: [{ id: "mission", label: "我们的使命" }, { id: "story", label: "我们的故事" }, { id: "stats", label: "数据概览" }, { id: "team", label: "管理团队" }],
      privacy: [{ id: "pp-intro", label: "引言" }, { id: "pp-collect", label: "我们收集的信息" }, { id: "pp-use", label: "信息用途" }, { id: "pp-share", label: "信息共享" }, { id: "pp-security", label: "安全" }, { id: "pp-rights", label: "你的权利" }],
      terms: [{ id: "tos-intro", label: "引言" }, { id: "tos-account", label: "账号条款" }, { id: "tos-content", label: "内容与授权" }, { id: "tos-coins", label: "虚拟货币" }, { id: "tos-conduct", label: "用户行为" }, { id: "tos-termination", label: "终止" }],
      faq: [{ id: "faq-account", label: "账号与登录" }, { id: "faq-coins", label: "金币与支付" }, { id: "faq-content", label: "观看与内容" }, { id: "faq-vip", label: "VIP会员" }],
    },
    heroTitle: "信息与帮助中心",
    heroSubtitle: "在这里了解 TinyTale 的使命、政策与常见问题解答。",
    about: {
      missionTitle: "我们的使命",
      missionText: "TinyTale 致力于让每个人都能轻松获得优质故事体验，将精品短剧带给全球观众，打破语言壁垒，重塑移动端观影方式。",
      storyTitle: "我们的故事",
      storyParas: ["2023 年，我们在旧金山创立 TinyTale，目标是让好故事更适配现代生活节奏。", "我们专注打造短剧平台，让内容依旧有情绪、有品质、易追更。", "如今我们在 45+ 国家服务数百万用户，拥有 500+ 原创短剧，并持续扩展。"],
      statsTitle: "数据概览",
      statsLabels: ["全球用户", "原创短剧", "覆盖国家", "观看时长"],
      teamTitle: "管理团队",
      teamRoles: ["CEO 与联合创始人", "CTO", "内容副总裁", "设计负责人"],
    },
    privacy: {
      lastUpdated: "最后更新：2026年1月15日",
      introTitle: "引言",
      intro: "本隐私政策说明 TinyTale 在你使用网站、移动应用及相关服务时如何收集、使用和共享信息。",
      collectTitle: "我们收集的信息",
      collect: ["我们会收集你主动提供的信息，如账号资料、联系方式、支付信息与观看偏好。", "我们也会自动收集技术信息，如设备信息、IP 地址、浏览器类型和交互行为。"],
      useTitle: "信息用途",
      use: "我们使用数据来提供和优化服务、处理支付、个性化推荐、提供支持并保障平台安全。",
      shareTitle: "信息共享",
      share: "我们不会出售你的个人信息。仅在必要场景下与服务提供商或依法要求的机构共享数据。",
      securityTitle: "安全",
      security: "我们采用行业标准安全措施，包括支付加密与定期安全审计。",
      rightsTitle: "你的权利",
      rights: "根据地区法规，你可申请访问、更正、删除或导出个人数据，并对特定处理行为提出异议。",
    },
    terms: {
      lastUpdated: "最后更新：2026年1月15日",
      introTitle: "引言",
      intro: "本条款规范你对 TinyTale 的使用。使用本服务即表示你同意这些条款。",
      accountTitle: "账号条款",
      account: "你需满足所在地区年龄要求，并妥善保管账号凭证。账号下发生的行为由你负责。",
      contentTitle: "内容与授权",
      content: "平台内容受知识产权保护。你仅获得个人、非商业用途下的有限访问和观看许可。",
      coinsTitle: "虚拟货币",
      coins: "TinyTale 金币为虚拟权益，不具备现金价值。购买与退款规则遵循平台政策及适用法律。",
      conductTitle: "用户行为",
      conduct: "不得滥用平台、侵害他人、传播恶意内容或尝试未授权访问系统。",
      terminationTitle: "终止",
      termination: "如发生违规或法律原因，我们可暂停或终止账号，终止后访问权限将立即失效。",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "账号与登录", items: [{ q: "如何注册账号？", a: "在登录页点击注册，可通过邮箱或 Google 快速登录。" }, { q: "忘记密码怎么办？", a: "在登录页点击忘记密码，我们会向邮箱发送验证码。" }, { q: "如何删除账号？", a: "前往设置 > 删除账号。该操作不可恢复。" }] },
        { id: "faq-coins", title: "金币与支付", items: [{ q: "金币有什么用？", a: "金币用于解锁付费剧集，不同剧集消耗可能不同。" }, { q: "如何充值金币？", a: "进入个人中心 > 金币，选择套餐并通过 Stripe 支付。" }, { q: "可以退款吗？", a: "是否可退取决于当地法规与使用状态，请联系支持。" }] },
        { id: "faq-content", title: "观看与内容", items: [{ q: "所有剧集都免费吗？", a: "部分前几集免费，后续剧集需金币或 VIP 权益。" }, { q: "可以离线观看吗？", a: "离线下载取决于套餐权限与内容可用性。" }, { q: "播放有问题怎么反馈？", a: "可在播放器内反馈，或通过下方表单联系我们。" }] },
        { id: "faq-vip", title: "VIP会员", items: [{ q: "VIP 有什么权益？", a: "VIP 可享受更完整内容访问、更好观看体验和周期性福利。" }, { q: "如何取消订阅？", a: "前往设置 > 订阅，点击取消订阅。" }, { q: "月付和年付可以切换吗？", a: "可以，在设置 > 订阅中切换。" }] },
      ],
    },
    contact: {
      title: "联系我们",
      subtitle: "有任何问题或建议，欢迎随时联系。",
      emailSupport: "邮件支持",
      emailValue: "support@tinytale.com",
      emailHint: "24小时内回复",
      liveChat: "在线客服",
      liveChatValue: "美东时间 9:00 - 21:00",
      liveChatHint: "平均等待约 2 分钟",
      hq: "总部",
      hqValue: "美国加州旧金山",
      hqHint: "在洛杉矶、首尔、新加坡设有办公室",
      types: { general: "常规", technical: "技术", business: "商务" },
      placeholders: { name: "你的姓名", email: "邮箱地址", subject: "主题", message: "请输入你的问题..." },
      sending: "发送中...",
      sent: "发送成功！",
      send: "发送消息",
      failed: "发送失败，请稍后再试。",
    },
  },
  ja: {
    tabs: { about: "会社情報", privacy: "プライバシーポリシー", terms: "利用規約", faq: "FAQ" },
    sidebar: {
      about: [{ id: "mission", label: "ミッション" }, { id: "story", label: "ストーリー" }, { id: "stats", label: "実績" }, { id: "team", label: "リーダーシップ" }],
      privacy: [{ id: "pp-intro", label: "はじめに" }, { id: "pp-collect", label: "収集する情報" }, { id: "pp-use", label: "利用目的" }, { id: "pp-share", label: "情報共有" }, { id: "pp-security", label: "セキュリティ" }, { id: "pp-rights", label: "ユーザーの権利" }],
      terms: [{ id: "tos-intro", label: "はじめに" }, { id: "tos-account", label: "アカウント" }, { id: "tos-content", label: "コンテンツとライセンス" }, { id: "tos-coins", label: "仮想通貨" }, { id: "tos-conduct", label: "利用ルール" }, { id: "tos-termination", label: "利用停止" }],
      faq: [{ id: "faq-account", label: "アカウントとログイン" }, { id: "faq-coins", label: "コインと支払い" }, { id: "faq-content", label: "視聴とコンテンツ" }, { id: "faq-vip", label: "VIP会員" }],
    },
    heroTitle: "情報・ヘルプセンター",
    heroSubtitle: "TinyTale の概要、ポリシー、よくある質問をまとめています。",
    about: {
      missionTitle: "私たちのミッション",
      missionText: "TinyTale は、世界中のユーザーに高品質な短編ドラマを届け、言語の壁を越えた視聴体験を提供します。",
      storyTitle: "私たちのストーリー",
      storyParas: ["2023年、サンフランシスコで TinyTale を立ち上げました。", "短尺でも感情豊かで没入できるドラマ体験を目指しています。", "現在は45か国以上で数百万人に利用され、500本以上のオリジナル作品を配信しています。"],
      statsTitle: "主な実績",
      statsLabels: ["グローバルユーザー", "オリジナル作品", "対応国", "総視聴時間"],
      teamTitle: "リーダーシップ",
      teamRoles: ["CEO兼共同創業者", "CTO", "コンテンツ責任者", "デザイン責任者"],
    },
    privacy: {
      lastUpdated: "最終更新: 2026年1月15日",
      introTitle: "はじめに",
      intro: "本ポリシーは、TinyTale のサービス利用時における情報の収集・利用・共有方法を説明します。",
      collectTitle: "収集する情報",
      collect: ["アカウント情報、連絡先、支払い情報、視聴設定など、ユーザーが入力する情報を収集します。", "端末情報、IP、ブラウザ情報、利用ログなどの技術情報も自動収集します。"],
      useTitle: "利用目的",
      use: "サービス提供・改善、決済処理、レコメンド最適化、サポート対応、セキュリティ維持に利用します。",
      shareTitle: "情報共有",
      share: "個人情報を販売することはありません。必要に応じて委託先や法令に基づく機関へ提供する場合があります。",
      securityTitle: "セキュリティ",
      security: "決済暗号化を含む業界標準の対策を実施し、定期的に安全性を見直しています。",
      rightsTitle: "ユーザーの権利",
      rights: "地域法に応じて、データへのアクセス、修正、削除、エクスポート等を請求できます。",
    },
    terms: {
      lastUpdated: "最終更新: 2026年1月15日",
      introTitle: "はじめに",
      intro: "本規約は TinyTale の利用条件を定めます。利用により同意したものとみなされます。",
      accountTitle: "アカウント",
      account: "利用可能年齢の条件を満たし、認証情報を適切に管理してください。アカウント活動は本人責任です。",
      contentTitle: "コンテンツとライセンス",
      content: "コンテンツは知的財産法で保護されています。個人・非商用の範囲で閲覧ライセンスを付与します。",
      coinsTitle: "仮想通貨",
      coins: "TinyTale コインは現金価値を持たない仮想アイテムです。購入と返金は法令とポリシーに従います。",
      conductTitle: "利用ルール",
      conduct: "不正利用、他者への迷惑行為、悪意ある配布、無断アクセスは禁止です。",
      terminationTitle: "利用停止",
      termination: "規約違反や法的理由により、アカウント停止・終了を行う場合があります。",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "アカウントとログイン", items: [{ q: "アカウント作成方法は？", a: "ログイン画面で登録を選択し、メールまたは Google で登録できます。" }, { q: "パスワードを忘れた場合は？", a: "ログイン画面のパスワード再設定から、メール認証コードで再設定できます。" }, { q: "アカウント削除方法は？", a: "設定 > アカウント削除から実行できます（取り消し不可）。" }] },
        { id: "faq-coins", title: "コインと支払い", items: [{ q: "コインの使い道は？", a: "プレミアム話数の解放に使います。必要数は作品ごとに異なります。" }, { q: "コインの購入方法は？", a: "プロフィール > コインからパッケージを選び、Stripeで支払います。" }, { q: "返金はできますか？", a: "返金可否は地域法と利用状況によります。サポートへご相談ください。" }] },
        { id: "faq-content", title: "視聴とコンテンツ", items: [{ q: "全話無料ですか？", a: "一部序盤話は無料、以降はコインまたはVIPで視聴可能です。" }, { q: "オフライン視聴は可能ですか？", a: "対象プランと対象作品で利用できます。" }, { q: "再生トラブルの報告方法は？", a: "プレイヤー内の報告機能または下記フォームをご利用ください。" }] },
        { id: "faq-vip", title: "VIP会員", items: [{ q: "VIP特典は？", a: "より広い視聴範囲、快適な体験、プランに応じた特典が含まれます。" }, { q: "解約方法は？", a: "設定 > サブスクリプションから解約できます。" }, { q: "月額と年額の切替は？", a: "設定 > サブスクリプションで切替可能です。" }] },
      ],
    },
    contact: {
      title: "お問い合わせ",
      subtitle: "ご質問・ご意見があればお気軽にご連絡ください。",
      emailSupport: "メールサポート",
      emailValue: "support@tinytale.com",
      emailHint: "24時間以内に返信",
      liveChat: "ライブチャット",
      liveChatValue: "EST 9:00 - 21:00",
      liveChatHint: "平均待ち時間 約2分",
      hq: "本社",
      hqValue: "サンフランシスコ",
      hqHint: "LA・ソウル・シンガポールにも拠点あり",
      types: { general: "一般", technical: "技術", business: "ビジネス" },
      placeholders: { name: "お名前", email: "メールアドレス", subject: "件名", message: "お問い合わせ内容..." },
      sending: "送信中...",
      sent: "送信しました！",
      send: "送信",
      failed: "送信に失敗しました。再度お試しください。",
    },
  },
  es: {
    tabs: { about: "Sobre nosotros", privacy: "Política de privacidad", terms: "Términos del servicio", faq: "FAQ" },
    sidebar: {
      about: [{ id: "mission", label: "Nuestra misión" }, { id: "story", label: "Nuestra historia" }, { id: "stats", label: "En números" }, { id: "team", label: "Liderazgo" }],
      privacy: [{ id: "pp-intro", label: "Introducción" }, { id: "pp-collect", label: "Información que recopilamos" }, { id: "pp-use", label: "Cómo usamos los datos" }, { id: "pp-share", label: "Compartición de datos" }, { id: "pp-security", label: "Seguridad" }, { id: "pp-rights", label: "Tus derechos" }],
      terms: [{ id: "tos-intro", label: "Introducción" }, { id: "tos-account", label: "Cuenta" }, { id: "tos-content", label: "Contenido y licencia" }, { id: "tos-coins", label: "Moneda virtual" }, { id: "tos-conduct", label: "Conducta" }, { id: "tos-termination", label: "Terminación" }],
      faq: [{ id: "faq-account", label: "Cuenta y acceso" }, { id: "faq-coins", label: "Monedas y pagos" }, { id: "faq-content", label: "Visualización y contenido" }, { id: "faq-vip", label: "Membresía VIP" }],
    },
    heroTitle: "Centro de información y ayuda",
    heroSubtitle: "Todo lo que necesitas saber sobre TinyTale en un solo lugar.",
    about: {
      missionTitle: "Nuestra misión",
      missionText: "En TinyTale queremos llevar historias cortas de alta calidad a usuarios de todo el mundo y mejorar la experiencia de entretenimiento móvil.",
      storyTitle: "Nuestra historia",
      storyParas: ["TinyTale nació en 2023 en San Francisco con una idea simple: grandes historias para el ritmo actual.", "Creamos una plataforma de drama corto emocional, ágil y adictiva.", "Hoy llegamos a millones de usuarios en más de 45 países con más de 500 títulos originales."],
      statsTitle: "En números",
      statsLabels: ["Usuarios globales", "Dramas originales", "Países", "Horas vistas"],
      teamTitle: "Liderazgo",
      teamRoles: ["CEO y cofundadora", "CTO", "VP de contenido", "Líder de diseño"],
    },
    privacy: {
      lastUpdated: "Última actualización: 15 de enero de 2026",
      introTitle: "Introducción",
      intro: "Esta política explica cómo TinyTale recopila, usa y comparte información cuando utilizas nuestros servicios.",
      collectTitle: "Información que recopilamos",
      collect: ["Recopilamos datos que proporcionas: cuenta, contacto, pago y preferencias.", "También recopilamos datos técnicos automáticamente: dispositivo, IP, navegador e interacción."],
      useTitle: "Cómo usamos los datos",
      use: "Usamos datos para operar y mejorar el servicio, procesar pagos, personalizar recomendaciones y brindar soporte.",
      shareTitle: "Compartición de datos",
      share: "No vendemos datos personales. Solo compartimos con proveedores confiables o cuando la ley lo exige.",
      securityTitle: "Seguridad",
      security: "Aplicamos medidas de seguridad estándar, incluido cifrado y revisiones periódicas.",
      rightsTitle: "Tus derechos",
      rights: "Según tu región, puedes solicitar acceso, corrección, eliminación o exportación de tus datos.",
    },
    terms: {
      lastUpdated: "Última actualización: 15 de enero de 2026",
      introTitle: "Introducción",
      intro: "Estos términos regulan el uso de TinyTale. Al usar la plataforma, aceptas estos términos.",
      accountTitle: "Cuenta",
      account: "Debes cumplir requisitos de edad y proteger tus credenciales. Eres responsable de la actividad de tu cuenta.",
      contentTitle: "Contenido y licencia",
      content: "El contenido está protegido por propiedad intelectual. Se otorga una licencia personal y no comercial.",
      coinsTitle: "Moneda virtual",
      coins: "Las monedas TinyTale son virtuales y sin valor en efectivo. Las reglas de compra y reembolso siguen la ley aplicable.",
      conductTitle: "Conducta",
      conduct: "Está prohibido abusar de la plataforma, dañar a otros o intentar acceso no autorizado.",
      terminationTitle: "Terminación",
      termination: "Podemos suspender o cerrar cuentas por incumplimientos o motivos legales.",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "Cuenta y acceso", items: [{ q: "¿Cómo creo una cuenta?", a: "En la pantalla de inicio de sesión, pulsa registrarte con email o Google." }, { q: "¿Olvidé mi contraseña?", a: "Usa la opción de restablecimiento y recibe un código en tu correo." }, { q: "¿Cómo elimino mi cuenta?", a: "Ve a Configuración > Eliminar cuenta (acción irreversible)." }] },
        { id: "faq-coins", title: "Monedas y pagos", items: [{ q: "¿Para qué sirven las monedas?", a: "Sirven para desbloquear episodios premium." }, { q: "¿Cómo recargo monedas?", a: "Ve a Perfil > Monedas y paga con Stripe." }, { q: "¿Puedo pedir reembolso?", a: "Depende de la ley local y uso de la compra; contacta soporte." }] },
        { id: "faq-content", title: "Visualización y contenido", items: [{ q: "¿Todo es gratis?", a: "Algunos episodios iniciales son gratis; otros requieren monedas o VIP." }, { q: "¿Hay modo offline?", a: "Está disponible en planes y contenidos elegibles." }, { q: "¿Cómo reporto problemas de reproducción?", a: "Usa reportar en el reproductor o el formulario de contacto." }] },
        { id: "faq-vip", title: "Membresía VIP", items: [{ q: "¿Qué incluye VIP?", a: "Incluye mayor acceso, mejor experiencia y beneficios según plan." }, { q: "¿Cómo cancelo mi suscripción?", a: "En Configuración > Suscripción." }, { q: "¿Puedo cambiar plan mensual/anual?", a: "Sí, desde Configuración > Suscripción." }] },
      ],
    },
    contact: {
      title: "Contáctanos",
      subtitle: "¿Tienes preguntas o sugerencias? Queremos escucharte.",
      emailSupport: "Soporte por correo",
      emailValue: "support@tinytale.com",
      emailHint: "Respuesta en 24 horas",
      liveChat: "Chat en vivo",
      liveChatValue: "Disponible 9:00 - 21:00 EST",
      liveChatHint: "Espera media: 2 minutos",
      hq: "Sede",
      hqValue: "San Francisco, California",
      hqHint: "Con oficinas en LA, Seúl y Singapur",
      types: { general: "General", technical: "Técnico", business: "Negocios" },
      placeholders: { name: "Tu nombre", email: "Correo", subject: "Asunto", message: "Tu mensaje..." },
      sending: "Enviando...",
      sent: "¡Enviado con éxito!",
      send: "Enviar mensaje",
      failed: "No se pudo enviar. Inténtalo de nuevo.",
    },
  },
  pt: {
    tabs: { about: "Sobre nós", privacy: "Política de privacidade", terms: "Termos de serviço", faq: "FAQ" },
    sidebar: {
      about: [{ id: "mission", label: "Nossa missão" }, { id: "story", label: "Nossa história" }, { id: "stats", label: "Em números" }, { id: "team", label: "Liderança" }],
      privacy: [{ id: "pp-intro", label: "Introdução" }, { id: "pp-collect", label: "Informações coletadas" }, { id: "pp-use", label: "Uso dos dados" }, { id: "pp-share", label: "Compartilhamento" }, { id: "pp-security", label: "Segurança" }, { id: "pp-rights", label: "Seus direitos" }],
      terms: [{ id: "tos-intro", label: "Introdução" }, { id: "tos-account", label: "Conta" }, { id: "tos-content", label: "Conteúdo e licença" }, { id: "tos-coins", label: "Moeda virtual" }, { id: "tos-conduct", label: "Conduta" }, { id: "tos-termination", label: "Encerramento" }],
      faq: [{ id: "faq-account", label: "Conta e login" }, { id: "faq-coins", label: "Moedas e pagamento" }, { id: "faq-content", label: "Assistir e conteúdo" }, { id: "faq-vip", label: "Assinatura VIP" }],
    },
    heroTitle: "Central de informação e ajuda",
    heroSubtitle: "Tudo o que você precisa saber sobre a TinyTale em um só lugar.",
    about: {
      missionTitle: "Nossa missão",
      missionText: "Na TinyTale, queremos levar dramas curtos premium para públicos globais e melhorar a experiência de entretenimento mobile.",
      storyTitle: "Nossa história",
      storyParas: ["A TinyTale nasceu em 2023, em San Francisco, com a ideia de adaptar boas histórias ao ritmo atual.", "Criamos uma plataforma de drama curto com emoção e alta qualidade.", "Hoje atendemos milhões de usuários em mais de 45 países e 500+ títulos originais."],
      statsTitle: "Em números",
      statsLabels: ["Usuários globais", "Dramas originais", "Países", "Horas assistidas"],
      teamTitle: "Liderança",
      teamRoles: ["CEO e cofundadora", "CTO", "VP de conteúdo", "Líder de design"],
    },
    privacy: {
      lastUpdated: "Última atualização: 15 de janeiro de 2026",
      introTitle: "Introdução",
      intro: "Esta política explica como a TinyTale coleta, usa e compartilha informações ao usar nossos serviços.",
      collectTitle: "Informações coletadas",
      collect: ["Coletamos dados fornecidos por você: conta, contato, pagamento e preferências.", "Também coletamos dados técnicos automaticamente: dispositivo, IP, navegador e interação."],
      useTitle: "Uso dos dados",
      use: "Usamos os dados para operar e melhorar o serviço, processar pagamentos, personalizar recomendações e oferecer suporte.",
      shareTitle: "Compartilhamento",
      share: "Não vendemos dados pessoais. Compartilhamos apenas com parceiros confiáveis ou quando exigido por lei.",
      securityTitle: "Segurança",
      security: "Aplicamos medidas de segurança padrão do setor, com criptografia e revisões periódicas.",
      rightsTitle: "Seus direitos",
      rights: "Dependendo da sua região, você pode solicitar acesso, correção, exclusão ou exportação dos seus dados.",
    },
    terms: {
      lastUpdated: "Última atualização: 15 de janeiro de 2026",
      introTitle: "Introdução",
      intro: "Estes termos regulam o uso da TinyTale. Ao usar a plataforma, você concorda com eles.",
      accountTitle: "Conta",
      account: "Você deve cumprir requisitos de idade e proteger suas credenciais. A atividade da conta é sua responsabilidade.",
      contentTitle: "Conteúdo e licença",
      content: "Todo conteúdo é protegido por propriedade intelectual. A licença é pessoal e não comercial.",
      coinsTitle: "Moeda virtual",
      coins: "Moedas TinyTale são virtuais e sem valor em dinheiro. Compras e reembolsos seguem lei aplicável e políticas.",
      conductTitle: "Conduta",
      conduct: "É proibido uso indevido da plataforma, danos a terceiros ou acesso não autorizado.",
      terminationTitle: "Encerramento",
      termination: "Podemos suspender ou encerrar contas por violação de políticas ou motivos legais.",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "Conta e login", items: [{ q: "Como criar conta?", a: "Na tela de login, toque em cadastrar usando email ou Google." }, { q: "Esqueci minha senha", a: "Use redefinir senha para receber código no email." }, { q: "Como excluir conta?", a: "Em Configurações > Excluir conta (ação irreversível)." }] },
        { id: "faq-coins", title: "Moedas e pagamento", items: [{ q: "Para que servem as moedas?", a: "Moedas desbloqueiam episódios premium." }, { q: "Como recarregar moedas?", a: "Acesse Perfil > Moedas e pague via Stripe." }, { q: "Posso pedir reembolso?", a: "Depende da lei local e do uso da compra; fale com suporte." }] },
        { id: "faq-content", title: "Assistir e conteúdo", items: [{ q: "Tudo é grátis?", a: "Alguns episódios iniciais são grátis; os demais exigem moedas ou VIP." }, { q: "Tem modo offline?", a: "Disponível em planos e conteúdos elegíveis." }, { q: "Como reportar problema no player?", a: "Use reportar no player ou formulário de contato abaixo." }] },
        { id: "faq-vip", title: "Assinatura VIP", items: [{ q: "Quais benefícios do VIP?", a: "Inclui maior acesso, melhor experiência e benefícios conforme o plano." }, { q: "Como cancelar assinatura?", a: "Em Configurações > Assinatura." }, { q: "Posso trocar mensal/anual?", a: "Sim, em Configurações > Assinatura." }] },
      ],
    },
    contact: {
      title: "Fale conosco",
      subtitle: "Tem dúvidas ou feedback? Vamos adorar ouvir você.",
      emailSupport: "Suporte por email",
      emailValue: "support@tinytale.com",
      emailHint: "Resposta em 24 horas",
      liveChat: "Chat ao vivo",
      liveChatValue: "Disponível 9h – 21h EST",
      liveChatHint: "Tempo médio de espera: 2 minutos",
      hq: "Sede",
      hqValue: "San Francisco, Califórnia",
      hqHint: "Com escritórios em LA, Seul e Singapura",
      types: { general: "Geral", technical: "Técnico", business: "Comercial" },
      placeholders: { name: "Seu nome", email: "Email", subject: "Assunto", message: "Sua mensagem..." },
      sending: "Enviando...",
      sent: "Enviado com sucesso!",
      send: "Enviar mensagem",
      failed: "Falha ao enviar. Tente novamente.",
    },
  },
  hi: {
    tabs: { about: "हमारे बारे में", privacy: "गोपनीयता नीति", terms: "सेवा की शर्तें", faq: "अक्सर पूछे जाने वाले प्रश्न" },
    sidebar: {
      about: [{ id: "mission", label: "हमारा मिशन" }, { id: "story", label: "हमारी कहानी" }, { id: "stats", label: "मुख्य आँकड़े" }, { id: "team", label: "लीडरशिप" }],
      privacy: [{ id: "pp-intro", label: "परिचय" }, { id: "pp-collect", label: "हम क्या डेटा लेते हैं" }, { id: "pp-use", label: "डेटा का उपयोग" }, { id: "pp-share", label: "डेटा साझा करना" }, { id: "pp-security", label: "सुरक्षा" }, { id: "pp-rights", label: "आपके अधिकार" }],
      terms: [{ id: "tos-intro", label: "परिचय" }, { id: "tos-account", label: "अकाउंट नियम" }, { id: "tos-content", label: "कंटेंट और लाइसेंस" }, { id: "tos-coins", label: "वर्चुअल करेंसी" }, { id: "tos-conduct", label: "यूज़र व्यवहार" }, { id: "tos-termination", label: "समापन" }],
      faq: [{ id: "faq-account", label: "अकाउंट और लॉगिन" }, { id: "faq-coins", label: "कॉइन और पेमेंट" }, { id: "faq-content", label: "देखना और कंटेंट" }, { id: "faq-vip", label: "VIP सदस्यता" }],
    },
    heroTitle: "जानकारी और हेल्प सेंटर",
    heroSubtitle: "TinyTale के बारे में ज़रूरी जानकारी, नीतियाँ और सामान्य सवालों के जवाब यहाँ मिलेंगे।",
    about: {
      missionTitle: "हमारा मिशन",
      missionText: "TinyTale का उद्देश्य दुनिया भर के दर्शकों तक उच्च गुणवत्ता वाले शॉर्ट ड्रामा पहुँचाना और मोबाइल एंटरटेनमेंट अनुभव को बेहतर बनाना है।",
      storyTitle: "हमारी कहानी",
      storyParas: ["TinyTale की शुरुआत 2023 में सैन फ्रांसिस्को में हुई।", "हमने तेज़ जीवनशैली के लिए प्रभावशाली शॉर्ट-फॉर्म ड्रामा प्लेटफॉर्म बनाया।", "आज हम 45+ देशों में लाखों दर्शकों तक 500+ ओरिजिनल टाइटल पहुंचाते हैं।"],
      statsTitle: "मुख्य आँकड़े",
      statsLabels: ["वैश्विक उपयोगकर्ता", "ओरिजिनल ड्रामा", "देश", "देखने के घंटे"],
      teamTitle: "लीडरशिप",
      teamRoles: ["CEO और सह-संस्थापक", "CTO", "VP कंटेंट", "हेड ऑफ डिज़ाइन"],
    },
    privacy: {
      lastUpdated: "अंतिम अपडेट: 15 जनवरी 2026",
      introTitle: "परिचय",
      intro: "यह नीति बताती है कि TinyTale आपके डेटा को कैसे एकत्र, उपयोग और साझा करता है।",
      collectTitle: "हम क्या डेटा लेते हैं",
      collect: ["अकाउंट, संपर्क, भुगतान और पसंद जैसी जानकारी जो आप देते हैं।", "डिवाइस, IP, ब्राउज़र और उपयोग व्यवहार जैसे तकनीकी डेटा भी स्वचालित रूप से।"],
      useTitle: "डेटा का उपयोग",
      use: "सेवा संचालन, भुगतान, सिफारिश, सपोर्ट और सुरक्षा सुधार के लिए डेटा उपयोग किया जाता है।",
      shareTitle: "डेटा साझा करना",
      share: "हम व्यक्तिगत डेटा नहीं बेचते। ज़रूरत पड़ने पर भरोसेमंद सेवा प्रदाताओं या कानूनी आवश्यकताओं के अनुसार साझा करते हैं।",
      securityTitle: "सुरक्षा",
      security: "हम उद्योग-मानक सुरक्षा उपाय अपनाते हैं, जिसमें एन्क्रिप्शन और नियमित सुरक्षा समीक्षा शामिल है।",
      rightsTitle: "आपके अधिकार",
      rights: "आप अपनी क्षेत्रीय कानून व्यवस्था के अनुसार डेटा एक्सेस, सुधार, हटाने या निर्यात का अनुरोध कर सकते हैं।",
    },
    terms: {
      lastUpdated: "अंतिम अपडेट: 15 जनवरी 2026",
      introTitle: "परिचय",
      intro: "ये शर्तें TinyTale उपयोग को नियंत्रित करती हैं। सेवा उपयोग करने पर आप इनसे सहमत माने जाते हैं।",
      accountTitle: "अकाउंट नियम",
      account: "आपको उम्र से जुड़े नियमों का पालन करना होगा और लॉगिन जानकारी सुरक्षित रखनी होगी।",
      contentTitle: "कंटेंट और लाइसेंस",
      content: "सभी कंटेंट बौद्धिक संपदा कानून से सुरक्षित है। उपयोग के लिए व्यक्तिगत, गैर-व्यावसायिक लाइसेंस दिया जाता है।",
      coinsTitle: "वर्चुअल करेंसी",
      coins: "TinyTale कॉइन्स का नकद मूल्य नहीं होता। खरीद और रिफंड नियम स्थानीय कानून के अनुसार लागू होते हैं।",
      conductTitle: "यूज़र व्यवहार",
      conduct: "प्लेटफॉर्म का दुरुपयोग, दूसरों को नुकसान, या अनधिकृत एक्सेस का प्रयास वर्जित है।",
      terminationTitle: "समापन",
      termination: "नीति उल्लंघन या कानूनी कारणों पर अकाउंट निलंबित/समाप्त किया जा सकता है।",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "अकाउंट और लॉगिन", items: [{ q: "अकाउंट कैसे बनाएं?", a: "लॉगिन पेज पर साइन अप चुनें। ईमेल या Google से पंजीकरण करें।" }, { q: "पासवर्ड भूल गया/गई?", a: "पासवर्ड रीसेट विकल्प से ईमेल पर कोड प्राप्त करें।" }, { q: "अकाउंट कैसे हटाएं?", a: "सेटिंग्स > डिलीट अकाउंट (यह वापस नहीं होगा)।" }] },
        { id: "faq-coins", title: "कॉइन और पेमेंट", items: [{ q: "कॉइन किस लिए हैं?", a: "प्रीमियम एपिसोड अनलॉक करने के लिए।" }, { q: "कॉइन रिचार्ज कैसे करें?", a: "प्रोफाइल > कॉइन्स में जाकर पैकेज चुनें और Stripe से भुगतान करें।" }, { q: "रिफंड मिलेगा?", a: "रिफंड स्थानीय नियम और उपयोग स्थिति पर निर्भर करता है।" }] },
        { id: "faq-content", title: "देखना और कंटेंट", items: [{ q: "क्या सभी एपिसोड फ्री हैं?", a: "कुछ शुरुआती एपिसोड फ्री हो सकते हैं, बाकी के लिए कॉइन या VIP चाहिए।" }, { q: "ऑफलाइन डाउनलोड उपलब्ध है?", a: "योग्य प्लान और कंटेंट के लिए उपलब्ध है।" }, { q: "वीडियो समस्या कैसे रिपोर्ट करें?", a: "प्लेयर रिपोर्ट विकल्प या नीचे दिए फॉर्म का उपयोग करें।" }] },
        { id: "faq-vip", title: "VIP सदस्यता", items: [{ q: "VIP में क्या मिलता है?", a: "बेहतर एक्सेस, बेहतर अनुभव और प्लान आधारित लाभ।" }, { q: "सब्सक्रिप्शन कैसे कैंसिल करें?", a: "सेटिंग्स > सब्सक्रिप्शन से।" }, { q: "मासिक और वार्षिक प्लान बदल सकते हैं?", a: "हाँ, सेटिंग्स > सब्सक्रिप्शन में बदलें।" }] },
      ],
    },
    contact: {
      title: "हमसे संपर्क करें",
      subtitle: "कोई प्रश्न या सुझाव है? हम सुनना चाहेंगे।",
      emailSupport: "ईमेल सपोर्ट",
      emailValue: "support@tinytale.com",
      emailHint: "24 घंटे में जवाब",
      liveChat: "लाइव चैट",
      liveChatValue: "9 AM – 9 PM EST उपलब्ध",
      liveChatHint: "औसत प्रतीक्षा: 2 मिनट",
      hq: "मुख्यालय",
      hqValue: "सैन फ्रांसिस्को, कैलिफ़ोर्निया",
      hqHint: "LA, सियोल और सिंगापुर में कार्यालय",
      types: { general: "सामान्य", technical: "तकनीकी", business: "व्यावसायिक" },
      placeholders: { name: "आपका नाम", email: "ईमेल पता", subject: "विषय", message: "अपना संदेश लिखें..." },
      sending: "भेजा जा रहा है...",
      sent: "सफलतापूर्वक भेजा गया!",
      send: "संदेश भेजें",
      failed: "भेजने में असफल। कृपया फिर प्रयास करें।",
    },
  },
  id: {
    tabs: { about: "Tentang kami", privacy: "Kebijakan privasi", terms: "Ketentuan layanan", faq: "FAQ" },
    sidebar: {
      about: [{ id: "mission", label: "Misi kami" }, { id: "story", label: "Cerita kami" }, { id: "stats", label: "Angka utama" }, { id: "team", label: "Kepemimpinan" }],
      privacy: [{ id: "pp-intro", label: "Pendahuluan" }, { id: "pp-collect", label: "Data yang kami kumpulkan" }, { id: "pp-use", label: "Penggunaan data" }, { id: "pp-share", label: "Berbagi data" }, { id: "pp-security", label: "Keamanan" }, { id: "pp-rights", label: "Hak Anda" }],
      terms: [{ id: "tos-intro", label: "Pendahuluan" }, { id: "tos-account", label: "Ketentuan akun" }, { id: "tos-content", label: "Konten & lisensi" }, { id: "tos-coins", label: "Mata uang virtual" }, { id: "tos-conduct", label: "Perilaku pengguna" }, { id: "tos-termination", label: "Pengakhiran" }],
      faq: [{ id: "faq-account", label: "Akun & login" }, { id: "faq-coins", label: "Koin & pembayaran" }, { id: "faq-content", label: "Menonton & konten" }, { id: "faq-vip", label: "Keanggotaan VIP" }],
    },
    heroTitle: "Pusat informasi & bantuan",
    heroSubtitle: "Semua yang perlu kamu tahu tentang TinyTale ada di sini.",
    about: {
      missionTitle: "Misi kami",
      missionText: "TinyTale menghadirkan drama pendek premium ke audiens global dan meningkatkan pengalaman hiburan di mobile.",
      storyTitle: "Cerita kami",
      storyParas: ["TinyTale didirikan tahun 2023 di San Francisco.", "Kami membangun platform drama pendek yang emosional dan berkualitas.", "Kini kami melayani jutaan penonton di 45+ negara dengan 500+ judul original."],
      statsTitle: "Angka utama",
      statsLabels: ["Pengguna global", "Drama original", "Negara", "Jam ditonton"],
      teamTitle: "Kepemimpinan",
      teamRoles: ["CEO & co-founder", "CTO", "VP konten", "Head of design"],
    },
    privacy: {
      lastUpdated: "Terakhir diperbarui: 15 Januari 2026",
      introTitle: "Pendahuluan",
      intro: "Kebijakan ini menjelaskan cara TinyTale mengumpulkan, menggunakan, dan membagikan informasi saat kamu memakai layanan kami.",
      collectTitle: "Data yang kami kumpulkan",
      collect: ["Kami mengumpulkan data yang kamu berikan, seperti akun, kontak, pembayaran, dan preferensi.", "Kami juga otomatis mengumpulkan data teknis seperti perangkat, IP, browser, dan interaksi."],
      useTitle: "Penggunaan data",
      use: "Data digunakan untuk menjalankan layanan, memproses pembayaran, personalisasi rekomendasi, dukungan, dan keamanan.",
      shareTitle: "Berbagi data",
      share: "Kami tidak menjual data pribadi. Data dibagikan hanya ke mitra tepercaya atau jika diwajibkan hukum.",
      securityTitle: "Keamanan",
      security: "Kami menerapkan standar keamanan industri, termasuk enkripsi dan audit keamanan berkala.",
      rightsTitle: "Hak Anda",
      rights: "Sesuai wilayah, kamu dapat meminta akses, koreksi, penghapusan, atau ekspor data pribadi.",
    },
    terms: {
      lastUpdated: "Terakhir diperbarui: 15 Januari 2026",
      introTitle: "Pendahuluan",
      intro: "Ketentuan ini mengatur penggunaan TinyTale. Dengan menggunakan layanan, kamu menyetujui ketentuan ini.",
      accountTitle: "Ketentuan akun",
      account: "Kamu harus memenuhi syarat usia dan menjaga kredensial akun. Aktivitas akun menjadi tanggung jawabmu.",
      contentTitle: "Konten & lisensi",
      content: "Semua konten dilindungi hukum HKI. Lisensi diberikan untuk penggunaan pribadi non-komersial.",
      coinsTitle: "Mata uang virtual",
      coins: "Koin TinyTale adalah item virtual tanpa nilai tunai. Aturan pembelian/refund mengikuti hukum dan kebijakan.",
      conductTitle: "Perilaku pengguna",
      conduct: "Dilarang menyalahgunakan platform, merugikan pengguna lain, atau mencoba akses tanpa izin.",
      terminationTitle: "Pengakhiran",
      termination: "Kami dapat menangguhkan atau menghentikan akun karena pelanggaran kebijakan atau alasan hukum.",
    },
    faq: {
      sections: [
        { id: "faq-account", title: "Akun & login", items: [{ q: "Bagaimana membuat akun?", a: "Di halaman login, pilih daftar via email atau Google." }, { q: "Lupa password?", a: "Gunakan reset password untuk menerima kode verifikasi via email." }, { q: "Bagaimana menghapus akun?", a: "Masuk ke Pengaturan > Hapus Akun (tidak dapat dibatalkan)." }] },
        { id: "faq-coins", title: "Koin & pembayaran", items: [{ q: "Untuk apa koin?", a: "Koin digunakan untuk membuka episode premium." }, { q: "Bagaimana isi ulang koin?", a: "Buka Profil > Koin lalu bayar via Stripe." }, { q: "Apakah bisa refund?", a: "Refund tergantung hukum lokal dan status penggunaan pembelian." }] },
        { id: "faq-content", title: "Menonton & konten", items: [{ q: "Apakah semua episode gratis?", a: "Sebagian awal mungkin gratis, sisanya perlu koin/VIP." }, { q: "Bisa offline?", a: "Tersedia untuk paket dan konten yang memenuhi syarat." }, { q: "Bagaimana lapor masalah video?", a: "Gunakan fitur lapor di player atau form kontak di bawah." }] },
        { id: "faq-vip", title: "Keanggotaan VIP", items: [{ q: "Apa manfaat VIP?", a: "Akses lebih luas, pengalaman lebih baik, dan benefit berkala sesuai paket." }, { q: "Bagaimana batalkan langganan?", a: "Di Pengaturan > Langganan." }, { q: "Bisa ganti paket bulanan/tahunan?", a: "Bisa, melalui Pengaturan > Langganan." }] },
      ],
    },
    contact: {
      title: "Hubungi kami",
      subtitle: "Punya pertanyaan atau masukan? Kami siap membantu.",
      emailSupport: "Dukungan email",
      emailValue: "support@tinytale.com",
      emailHint: "Respon dalam 24 jam",
      liveChat: "Live chat",
      liveChatValue: "Tersedia 9.00 - 21.00 EST",
      liveChatHint: "Waktu tunggu rata-rata: 2 menit",
      hq: "Kantor pusat",
      hqValue: "San Francisco, California",
      hqHint: "Dengan kantor di LA, Seoul, dan Singapura",
      types: { general: "Umum", technical: "Teknis", business: "Bisnis" },
      placeholders: { name: "Nama kamu", email: "Alamat email", subject: "Subjek", message: "Pesan kamu..." },
      sending: "Mengirim...",
      sent: "Berhasil dikirim!",
      send: "Kirim pesan",
      failed: "Gagal mengirim. Silakan coba lagi.",
    },
  },
};

const STATS_VALUES = ["10M+", "500+", "45+", "2B+"];

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#FFD700] to-[#B8860B]" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

export default function HelpPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const c = COPY[locale] || COPY.en;

  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [activeAnchor, setActiveAnchor] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "", type: "general" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = (searchParams.get("tab") || "").toLowerCase();
    if (tab === "privacy") setActiveTab("privacy");
    else if (tab === "terms") setActiveTab("terms");
    else if (tab === "faq") setActiveTab("faq");
    else if (tab === "about") setActiveTab("about");
  }, [searchParams]);

  const sidebarMap = useMemo<Record<TabKey, { id: string; label: string }[]>>(() => ({
    about: c.sidebar.about,
    privacy: c.sidebar.privacy,
    terms: c.sidebar.terms,
    faq: c.sidebar.faq,
  }), [c]);

  useEffect(() => {
    const anchors = sidebarMap[activeTab];
    if (!anchors?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );
    anchors.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [activeTab, sidebarMap]);

  useEffect(() => {
    const first = sidebarMap[activeTab]?.[0];
    if (first) setActiveAnchor(first.id);
  }, [activeTab, sidebarMap]);

  useEffect(() => {
    if (formStatus === "sent" || formStatus === "error") {
      const timer = setTimeout(() => setFormStatus("idle"), 5000);
      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    try {
      await contactApi.submitInquiry(formData);
      setFormStatus("sent");
      setFormData({ name: "", email: "", subject: "", message: "", type: "general" });
    } catch {
      setFormStatus("error");
    }
  }, [formData]);

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a00]/80 via-black/60 to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://picsum.photos/seed/helpbg/1920/600')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gold-text">{c.heroTitle}</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">{c.heroSubtitle}</p>
        </div>
      </div>

      <div className="sticky top-16 z-30 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-hide gap-1" role="tablist">
            {(["about", "privacy", "terms", "faq"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? "border-[#FFD700] text-[#FFD700]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {c.tabs[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-36 space-y-1">
              {sidebarMap[activeTab].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToAnchor(id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeAnchor === id
                      ? "bg-[#FFD700]/10 text-[#FFD700] font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="lg:hidden -mx-6 px-6 mb-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              {sidebarMap[activeTab].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToAnchor(id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-all ${
                    activeAnchor === id
                      ? "bg-[#FFD700]/10 text-[#FFD700] font-medium"
                      : "text-zinc-500 hover:text-zinc-300 bg-zinc-900/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div ref={contentRef} className="flex-1 min-w-0">
            {activeTab === "about" && <AboutSection c={c} />}
            {activeTab === "privacy" && <PrivacySection c={c} />}
            {activeTab === "terms" && <TermsSection c={c} />}
            {activeTab === "faq" && <FaqSection c={c} openFaq={openFaq} setOpenFaq={setOpenFaq} />}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <SectionDivider title={c.contact.title} />
            <p className="text-zinc-400 mt-2">{c.contact.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.contact.emailSupport}</p>
                  <p className="text-sm text-zinc-400">{c.contact.emailValue}</p>
                  <p className="text-xs text-zinc-500 mt-1">{c.contact.emailHint}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.contact.liveChat}</p>
                  <p className="text-sm text-zinc-400">{c.contact.liveChatValue}</p>
                  <p className="text-xs text-zinc-500 mt-1">{c.contact.liveChatHint}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.contact.hq}</p>
                  <p className="text-sm text-zinc-400">{c.contact.hqValue}</p>
                  <p className="text-xs text-zinc-500 mt-1">{c.contact.hqHint}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                {(["general", "technical", "business"] as const).map((typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: typeKey })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.type === typeKey
                        ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40"
                        : "bg-zinc-900 text-zinc-400 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {c.contact.types[typeKey]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={c.contact.placeholders.name}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  aria-label={c.contact.placeholders.name}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
                />
                <input
                  type="email"
                  placeholder={c.contact.placeholders.email}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  aria-label={c.contact.placeholders.email}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
                />
              </div>
              <input
                type="text"
                placeholder={c.contact.placeholders.subject}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                aria-label={c.contact.placeholders.subject}
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition"
              />
              <textarea
                placeholder={c.contact.placeholders.message}
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                aria-label={c.contact.placeholders.message}
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FFD700]/50 transition resize-none"
              />
              <button
                type="submit"
                disabled={formStatus === "sending"}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#B8860B] text-black font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {formStatus === "sending" ? c.contact.sending : formStatus === "sent" ? c.contact.sent : c.contact.send}
              </button>
              {formStatus === "error" && <p role="alert" className="text-red-400 text-sm text-center">{c.contact.failed}</p>}
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function AboutSection({ c }: { c: HelpCopy }) {
  const team = TEAM_NAMES.map((name, index) => ({
    name,
    role: c.about.teamRoles[index] || c.about.teamRoles[0],
    img: `https://picsum.photos/seed/team${index + 1}/200/200`,
  }));

  return (
    <div className="space-y-16">
      <section id="mission" className="scroll-mt-28">
        <SectionDivider title={c.about.missionTitle} />
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('https://picsum.photos/seed/mission/800/400')", backgroundSize: "cover" }} />
          <div className="relative z-20 p-8 md:p-12 max-w-lg">
            <p className="text-lg text-zinc-300 leading-relaxed">{c.about.missionText}</p>
          </div>
        </div>
      </section>

      <section id="story" className="scroll-mt-28">
        <SectionDivider title={c.about.storyTitle} />
        <div className="space-y-4 text-zinc-400 leading-relaxed">
          {c.about.storyParas.map((para) => <p key={para}>{para}</p>)}
        </div>
      </section>

      <section id="stats" className="scroll-mt-28">
        <SectionDivider title={c.about.statsTitle} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS_VALUES.map((value, index) => (
            <div key={value} className="p-6 rounded-xl bg-zinc-900/60 border border-[#333] hover:border-[#FFD700]/50 transition-colors text-center group">
              <p className="text-3xl font-bold text-[#FFD700] group-hover:scale-105 transition-transform">{value}</p>
              <p className="text-sm text-zinc-400 mt-1">{c.about.statsLabels[index]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="scroll-mt-28">
        <SectionDivider title={c.about.teamTitle} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member) => (
            <div key={member.name} className="text-center group">
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-800">
                <Image src={member.img} alt={member.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <p className="text-sm font-semibold text-white">{member.name}</p>
              <p className="text-xs text-zinc-500">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PrivacySection({ c }: { c: HelpCopy }) {
  const sectionClass = "scroll-mt-28 space-y-3";
  const pClass = "text-zinc-400 text-sm leading-relaxed";

  return (
    <div className="space-y-12">
      <p className="text-xs text-zinc-500">{c.privacy.lastUpdated}</p>

      <section id="pp-intro" className={sectionClass}>
        <SectionDivider title={c.privacy.introTitle} />
        <p className={pClass}>{c.privacy.intro}</p>
      </section>

      <section id="pp-collect" className={sectionClass}>
        <SectionDivider title={c.privacy.collectTitle} />
        {c.privacy.collect.map((line) => <p key={line} className={pClass}>{line}</p>)}
      </section>

      <section id="pp-use" className={sectionClass}>
        <SectionDivider title={c.sidebar.privacy[2].label} />
        <p className={pClass}>{c.privacy.use}</p>
      </section>

      <section id="pp-share" className={sectionClass}>
        <SectionDivider title={c.privacy.shareTitle} />
        <p className={pClass}>{c.privacy.share}</p>
      </section>

      <section id="pp-security" className={sectionClass}>
        <SectionDivider title={c.privacy.securityTitle} />
        <p className={pClass}>{c.privacy.security}</p>
      </section>

      <section id="pp-rights" className={sectionClass}>
        <SectionDivider title={c.privacy.rightsTitle} />
        <p className={pClass}>{c.privacy.rights}</p>
      </section>
    </div>
  );
}

function TermsSection({ c }: { c: HelpCopy }) {
  const sectionClass = "scroll-mt-28 space-y-3";
  const pClass = "text-zinc-400 text-sm leading-relaxed";

  return (
    <div className="space-y-12">
      <p className="text-xs text-zinc-500">{c.terms.lastUpdated}</p>

      <section id="tos-intro" className={sectionClass}>
        <SectionDivider title={c.terms.introTitle} />
        <p className={pClass}>{c.terms.intro}</p>
      </section>

      <section id="tos-account" className={sectionClass}>
        <SectionDivider title={c.terms.accountTitle} />
        <p className={pClass}>{c.terms.account}</p>
      </section>

      <section id="tos-content" className={sectionClass}>
        <SectionDivider title={c.terms.contentTitle} />
        <p className={pClass}>{c.terms.content}</p>
      </section>

      <section id="tos-coins" className={sectionClass}>
        <SectionDivider title={c.terms.coinsTitle} />
        <p className={pClass}>{c.terms.coins}</p>
      </section>

      <section id="tos-conduct" className={sectionClass}>
        <SectionDivider title={c.terms.conductTitle} />
        <p className={pClass}>{c.terms.conduct}</p>
      </section>

      <section id="tos-termination" className={sectionClass}>
        <SectionDivider title={c.terms.terminationTitle} />
        <p className={pClass}>{c.terms.termination}</p>
      </section>
    </div>
  );
}

function FaqSection({ c, openFaq, setOpenFaq }: { c: HelpCopy; openFaq: string | null; setOpenFaq: (v: string | null) => void }) {
  return (
    <div className="space-y-12">
      {c.faq.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28">
          <SectionDivider title={section.title} />
          <div className="space-y-2">
            {section.items.map((item, i) => {
              const key = `${section.id}-${i}`;
              const isOpen = openFaq === key;
              return (
                <div key={key} className="rounded-xl bg-zinc-900/60 border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    className="flex items-center w-full px-5 py-4 text-left gap-3"
                    aria-expanded={isOpen}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#FFD700] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="text-sm text-white font-medium">{item.q}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pl-12">
                      <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
