"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { resolveLocaleCopy } from "@/lib/locale-copy";
import { useLocale } from "@/hooks/useLocale";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";

type AffiliateCopy = {
  brandSuffix: string;
  navHome: string;
  navBrowse: string;
  navRankings: string;
  navMyList: string;
  navAffiliate: string;
  signIn: string;
  getStarted: string;
  goPromoter: string;
  checking: string;
  heroTitle: string;
  heroHighlight: string;
  heroDesc: string;
  heroCta: string;
  featureCommissionTitle: string;
  featureCommissionDesc: string;
  featureCookieTitle: string;
  featureCookieDesc: string;
  featureGlobalTitle: string;
  featureGlobalDesc: string;
  analyticsTitle: string;
  analyticsHighlight: string;
  analyticsDesc: string;
  dashboardPreview: string;
  live: string;
  totalClicks: string;
  conversions: string;
  revenue: string;
  convRate: string;
  bottomTitle: string;
  bottomDesc: string;
  footerRights: string;
};

const EN_COPY: AffiliateCopy = {
  brandSuffix: "Affiliate",
  navHome: "Home",
  navBrowse: "Browse",
  navRankings: "Rankings",
  navMyList: "My List",
  navAffiliate: "Affiliate",
  signIn: "Sign In",
  getStarted: "Get Started",
  goPromoter: "Promoter Console",
  checking: "Checking...",
  heroTitle: "Monetize the Drama.",
  heroHighlight: "50% RevShare",
  heroDesc: "Join TinyTale's affiliate program and earn commissions on every referral. Share drama, earn revenue.",
  heroCta: "Create Affiliate Account",
  featureCommissionTitle: "High Commission",
  featureCommissionDesc: "Earn up to 8% on every transaction from your referrals. The more you promote, the more you earn.",
  featureCookieTitle: "30-Day Cookie",
  featureCookieDesc: "Your referrals are tracked for 30 days after clicking your link. Plenty of time to convert.",
  featureGlobalTitle: "Global Reach",
  featureGlobalDesc: "Promote to audiences worldwide with localized content. Drama has no borders.",
  analyticsTitle: "Real-Time Tracking &",
  analyticsHighlight: "Revenue Analytics",
  analyticsDesc: "Monitor your performance with a comprehensive dashboard. Track clicks, conversions, and earnings in real time. Get detailed breakdowns by campaign, geography, and content to optimize your strategy.",
  dashboardPreview: "Dashboard Preview",
  live: "Live",
  totalClicks: "Total Clicks",
  conversions: "Conversions",
  revenue: "Revenue",
  convRate: "Conv. Rate",
  bottomTitle: "Ready to start earning?",
  bottomDesc: "Join hundreds of affiliates already earning with TinyTale.",
  footerRights: "All rights reserved.",
};

const ZH_COPY: AffiliateCopy = {
  brandSuffix: "推广",
  navHome: "首页",
  navBrowse: "浏览",
  navRankings: "排行",
  navMyList: "我的收藏",
  navAffiliate: "推广",
  signIn: "登录",
  getStarted: "立即开始",
  goPromoter: "进入推广后台",
  checking: "检查中...",
  heroTitle: "让短剧流量变现。",
  heroHighlight: "最高 50% 分成",
  heroDesc: "加入 TinyTale 推广计划，为每一次有效推荐赚取佣金。分享好剧，持续收益。",
  heroCta: "创建推广账号",
  featureCommissionTitle: "高佣金",
  featureCommissionDesc: "每笔推荐交易最高可获得 8% 佣金，推广越多，收益越高。",
  featureCookieTitle: "30 天追踪",
  featureCookieDesc: "用户点击你的链接后将被追踪 30 天，转化窗口更充足。",
  featureGlobalTitle: "全球覆盖",
  featureGlobalDesc: "面向多地区与多语言用户推广，短剧内容天然具备传播力。",
  analyticsTitle: "实时追踪与",
  analyticsHighlight: "收益分析",
  analyticsDesc: "通过可视化后台实时查看点击、转化和收益，并按活动、地区、内容维度分析效果，持续优化投放策略。",
  dashboardPreview: "后台预览",
  live: "实时",
  totalClicks: "总点击",
  conversions: "转化数",
  revenue: "收益",
  convRate: "转化率",
  bottomTitle: "准备开始赚钱了吗？",
  bottomDesc: "加入 TinyTale 推广员网络，开始你的增长收益。",
  footerRights: "保留所有权利。",
};

const JA_COPY: AffiliateCopy = {
  brandSuffix: "アフィリエイト",
  navHome: "ホーム",
  navBrowse: "探す",
  navRankings: "ランキング",
  navMyList: "マイリスト",
  navAffiliate: "アフィリエイト",
  signIn: "ログイン",
  getStarted: "今すぐ始める",
  goPromoter: "プロモーター管理へ",
  checking: "確認中...",
  heroTitle: "ドラマを収益化しよう。",
  heroHighlight: "最大 50% レベニューシェア",
  heroDesc: "TinyTaleのアフィリエイトプログラムに参加し、紹介ごとにコミッションを獲得。ドラマを広めて収益化できます。",
  heroCta: "アフィリエイトアカウントを作成",
  featureCommissionTitle: "高報酬",
  featureCommissionDesc: "紹介経由の取引ごとに最大8%のコミッション。成果が増えるほど報酬も増えます。",
  featureCookieTitle: "30日間クッキー",
  featureCookieDesc: "リンククリック後30日間、紹介が追跡されるため転換機会を逃しません。",
  featureGlobalTitle: "グローバル展開",
  featureGlobalDesc: "多言語コンテンツで世界中の視聴者にリーチ。ドラマに国境はありません。",
  analyticsTitle: "リアルタイム追跡と",
  analyticsHighlight: "収益分析",
  analyticsDesc: "包括的なダッシュボードでクリック、転換、収益をリアルタイムで確認。キャンペーン、地域、コンテンツ別に分析して戦略を最適化できます。",
  dashboardPreview: "ダッシュボードプレビュー",
  live: "ライブ",
  totalClicks: "総クリック",
  conversions: "コンバージョン",
  revenue: "収益",
  convRate: "転換率",
  bottomTitle: "収益化を始めますか？",
  bottomDesc: "すでに多くのアフィリエイトがTinyTaleで収益を伸ばしています。",
  footerRights: "無断転載を禁じます。",
};

const ES_COPY: AffiliateCopy = {
  brandSuffix: "Afiliados",
  navHome: "Inicio",
  navBrowse: "Explorar",
  navRankings: "Rankings",
  navMyList: "Mi lista",
  navAffiliate: "Afiliados",
  signIn: "Iniciar sesión",
  getStarted: "Comenzar",
  goPromoter: "Panel de promotor",
  checking: "Verificando...",
  heroTitle: "Monetiza el drama.",
  heroHighlight: "Hasta 50% de RevShare",
  heroDesc: "Únete al programa de afiliados de TinyTale y gana comisiones por cada referido. Comparte dramas y genera ingresos.",
  heroCta: "Crear cuenta de afiliado",
  featureCommissionTitle: "Alta comisión",
  featureCommissionDesc: "Gana hasta un 8% por cada transacción de tus referidos. Cuanto más promociones, más ganas.",
  featureCookieTitle: "Cookie de 30 días",
  featureCookieDesc: "Tus referidos se rastrean durante 30 días después del clic. Más tiempo para convertir.",
  featureGlobalTitle: "Alcance global",
  featureGlobalDesc: "Promociona a audiencias de todo el mundo con contenido localizado. El drama no tiene fronteras.",
  analyticsTitle: "Seguimiento en tiempo real y",
  analyticsHighlight: "analítica de ingresos",
  analyticsDesc: "Monitorea tu rendimiento con un panel completo. Sigue clics, conversiones e ingresos en tiempo real y optimiza por campaña, geografía y contenido.",
  dashboardPreview: "Vista previa del panel",
  live: "En vivo",
  totalClicks: "Clics totales",
  conversions: "Conversiones",
  revenue: "Ingresos",
  convRate: "Tasa de conv.",
  bottomTitle: "¿Listo para empezar a ganar?",
  bottomDesc: "Únete a cientos de afiliados que ya ganan con TinyTale.",
  footerRights: "Todos los derechos reservados.",
};

const PT_COPY: AffiliateCopy = {
  brandSuffix: "Afiliados",
  navHome: "Início",
  navBrowse: "Explorar",
  navRankings: "Rankings",
  navMyList: "Minha lista",
  navAffiliate: "Afiliados",
  signIn: "Entrar",
  getStarted: "Começar",
  goPromoter: "Painel do promotor",
  checking: "Verificando...",
  heroTitle: "Monetize o drama.",
  heroHighlight: "Até 50% de RevShare",
  heroDesc: "Participe do programa de afiliados da TinyTale e ganhe comissões por cada indicação. Compartilhe dramas e aumente sua receita.",
  heroCta: "Criar conta de afiliado",
  featureCommissionTitle: "Alta comissão",
  featureCommissionDesc: "Ganhe até 8% por transação dos seus indicados. Quanto mais promover, mais você ganha.",
  featureCookieTitle: "Cookie de 30 dias",
  featureCookieDesc: "Seus indicados são rastreados por 30 dias após o clique no link. Mais tempo para conversão.",
  featureGlobalTitle: "Alcance global",
  featureGlobalDesc: "Promova para audiências do mundo todo com conteúdo localizado. O drama não tem fronteiras.",
  analyticsTitle: "Rastreamento em tempo real e",
  analyticsHighlight: "análise de receita",
  analyticsDesc: "Acompanhe seu desempenho com um painel completo. Monitore cliques, conversões e receita em tempo real e otimize por campanha, região e conteúdo.",
  dashboardPreview: "Prévia do painel",
  live: "Ao vivo",
  totalClicks: "Cliques totais",
  conversions: "Conversões",
  revenue: "Receita",
  convRate: "Taxa de conv.",
  bottomTitle: "Pronto para começar a ganhar?",
  bottomDesc: "Junte-se a centenas de afiliados que já ganham com a TinyTale.",
  footerRights: "Todos os direitos reservados.",
};

const HI_COPY: AffiliateCopy = {
  brandSuffix: "अफिलिएट",
  navHome: "होम",
  navBrowse: "ब्राउज़",
  navRankings: "रैंकिंग",
  navMyList: "मेरी सूची",
  navAffiliate: "अफिलिएट",
  signIn: "लॉग इन",
  getStarted: "शुरू करें",
  goPromoter: "प्रमोटर कंसोल",
  checking: "जांच हो रही है...",
  heroTitle: "ड्रामा से कमाई करें।",
  heroHighlight: "अधिकतम 50% रेवशेयर",
  heroDesc: "TinyTale के अफिलिएट प्रोग्राम से जुड़ें और हर रेफरल पर कमीशन कमाएं। ड्रामा शेयर करें, राजस्व बढ़ाएं।",
  heroCta: "अफिलिएट खाता बनाएं",
  featureCommissionTitle: "उच्च कमीशन",
  featureCommissionDesc: "आपके रेफरल से हर लेनदेन पर अधिकतम 8% कमीशन। जितना अधिक प्रमोशन, उतनी अधिक कमाई।",
  featureCookieTitle: "30-दिन कुकी ट्रैकिंग",
  featureCookieDesc: "आपके रेफरल लिंक क्लिक के बाद 30 दिनों तक ट्रैक होते हैं, इसलिए कन्वर्ज़न का बेहतर मौका मिलता है।",
  featureGlobalTitle: "वैश्विक पहुंच",
  featureGlobalDesc: "स्थानीयकृत कंटेंट के साथ दुनिया भर की ऑडियंस तक पहुंचें। ड्रामा की कोई सीमा नहीं।",
  analyticsTitle: "रियल-टाइम ट्रैकिंग और",
  analyticsHighlight: "रेवेन्यू एनालिटिक्स",
  analyticsDesc: "कम्प्रीहेंसिव डैशबोर्ड से क्लिक, कन्वर्ज़न और कमाई रियल-टाइम में ट्रैक करें। कैंपेन, क्षेत्र और कंटेंट के आधार पर प्रदर्शन समझें और रणनीति बेहतर बनाएं।",
  dashboardPreview: "डैशबोर्ड प्रीव्यू",
  live: "लाइव",
  totalClicks: "कुल क्लिक",
  conversions: "कन्वर्ज़न",
  revenue: "राजस्व",
  convRate: "कन्वर्ज़न दर",
  bottomTitle: "कमाई शुरू करने के लिए तैयार हैं?",
  bottomDesc: "TinyTale के साथ पहले से कमाई कर रहे सैकड़ों अफिलिएट्स से जुड़ें।",
  footerRights: "सर्वाधिकार सुरक्षित।",
};

const ID_COPY: AffiliateCopy = {
  brandSuffix: "Afiliasi",
  navHome: "Beranda",
  navBrowse: "Jelajahi",
  navRankings: "Peringkat",
  navMyList: "Daftar saya",
  navAffiliate: "Afiliasi",
  signIn: "Masuk",
  getStarted: "Mulai",
  goPromoter: "Konsol promotor",
  checking: "Memeriksa...",
  heroTitle: "Ubah drama jadi penghasilan.",
  heroHighlight: "Hingga 50% RevShare",
  heroDesc: "Gabung program afiliasi TinyTale dan dapatkan komisi dari setiap referral. Bagikan drama, tingkatkan pendapatan.",
  heroCta: "Buat akun afiliasi",
  featureCommissionTitle: "Komisi tinggi",
  featureCommissionDesc: "Dapatkan hingga 8% dari setiap transaksi referral. Semakin banyak promosi, semakin besar penghasilan.",
  featureCookieTitle: "Cookie 30 hari",
  featureCookieDesc: "Referral Anda dilacak selama 30 hari setelah klik link. Waktu konversi jadi lebih panjang.",
  featureGlobalTitle: "Jangkauan global",
  featureGlobalDesc: "Promosikan ke audiens global dengan konten terlokalisasi. Drama tidak mengenal batas.",
  analyticsTitle: "Pelacakan real-time &",
  analyticsHighlight: "analitik pendapatan",
  analyticsDesc: "Pantau performa Anda lewat dashboard lengkap. Lacak klik, konversi, dan pendapatan secara real-time dengan rincian per kampanye, wilayah, dan konten.",
  dashboardPreview: "Pratinjau dasbor",
  live: "Langsung",
  totalClicks: "Total klik",
  conversions: "Konversi",
  revenue: "Pendapatan",
  convRate: "Rasio konversi",
  bottomTitle: "Siap mulai menghasilkan?",
  bottomDesc: "Bergabunglah dengan ratusan afiliasi yang sudah menghasilkan bersama TinyTale.",
  footerRights: "Hak cipta dilindungi.",
};

const AFFILIATE_COPY: FlexibleRecord<SupportedLocale, AffiliateCopy> = {
  en: EN_COPY,
  zh: ZH_COPY,
  ja: JA_COPY,
  es: ES_COPY,
  pt: PT_COPY,
  hi: HI_COPY,
  id: ID_COPY,
};

export default function AffiliateLandingPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(AFFILIATE_COPY, locale);
  const router = useRouter();
  const { user, token } = useAuth();
  const [ctaLoading, setCtaLoading] = useState(false);

  const handleCTA = async () => {
    if (ctaLoading) return;

    if (!token || !user) {
      router.push(`${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(localizePath("/affiliate", locale))}`);
      return;
    }

    setCtaLoading(true);
    try {
      const res = await promoterApi.getProfile(token);
      const status = res.data?.applicationStatus;

      if (status === "approved") {
        router.push(localizePath("/affiliate/dashboard", locale));
      } else if (status === "pending") {
        router.push(localizePath("/affiliate/pending", locale));
      } else {
        router.push(localizePath("/affiliate/apply", locale));
      }
    } catch {
      router.push(localizePath("/affiliate/apply", locale));
    } finally {
      setCtaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#0a0a12]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href={localizePath("/", locale)} className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
            <span className="text-purple-400">TinyTale</span>
            <span className="text-sm text-gray-300">{t.brandSuffix}</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href={localizePath("/", locale)} className="text-sm text-gray-300 transition hover:text-white">{t.navHome}</Link>
            <Link href={localizePath("/browse", locale)} className="text-sm text-gray-300 transition hover:text-white">{t.navBrowse}</Link>
            <Link href={localizePath("/rankings", locale)} className="text-sm text-gray-300 transition hover:text-white">{t.navRankings}</Link>
            <Link href={localizePath("/user/favorites", locale)} className="text-sm text-gray-300 transition hover:text-white">{t.navMyList}</Link>
            <span className="text-sm font-medium text-white">{t.navAffiliate}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleCTA}
                  disabled={ctaLoading}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium transition hover:bg-purple-700 disabled:opacity-60 sm:px-4 sm:text-sm"
                >
                  {ctaLoading ? t.checking : t.goPromoter}
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium">
                  {user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href={`${localizePath("/auth/login", locale)}?redirect=${encodeURIComponent(localizePath("/affiliate", locale))}`}
                  className="rounded-lg px-3 py-1.5 text-xs text-gray-300 transition hover:text-white sm:px-4 sm:text-sm"
                >
                  {t.signIn}
                </Link>
                <button
                  onClick={handleCTA}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium transition hover:bg-purple-700 sm:px-4 sm:text-sm"
                >
                  {t.getStarted}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#0a0a12] to-[#0a0a12]" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-32 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            {t.heroTitle}{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {t.heroHighlight}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-400">{t.heroDesc}</p>
          <button
            onClick={handleCTA}
            disabled={ctaLoading}
            className="mt-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-600/25 transition hover:shadow-purple-600/40 disabled:opacity-60"
          >
            {ctaLoading ? t.checking : t.heroCta}
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-2xl text-purple-400">$</div>
            <h3 className="text-lg font-semibold">{t.featureCommissionTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{t.featureCommissionDesc}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{t.featureCookieTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{t.featureCookieDesc}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-8 transition hover:border-purple-500/30">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{t.featureGlobalTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{t.featureGlobalDesc}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t.analyticsTitle}{" "}
              <span className="text-purple-400">{t.analyticsHighlight}</span>
            </h2>
            <p className="mt-4 leading-relaxed text-gray-400">{t.analyticsDesc}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121e] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">{t.dashboardPreview}</span>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">{t.live}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">{t.totalClicks}</p>
                <p className="mt-1 text-2xl font-bold">12,847</p>
                <p className="mt-1 text-xs text-green-400">+23.5%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">{t.conversions}</p>
                <p className="mt-1 text-2xl font-bold">1,429</p>
                <p className="mt-1 text-xs text-green-400">+18.2%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">{t.revenue}</p>
                <p className="mt-1 text-2xl font-bold">$4,280</p>
                <p className="mt-1 text-xs text-green-400">+31.7%</p>
              </div>
              <div className="rounded-xl bg-[#0a0a12] p-4">
                <p className="text-xs text-gray-500">{t.convRate}</p>
                <p className="mt-1 text-2xl font-bold">11.1%</p>
                <p className="mt-1 text-xs text-green-400">+2.4%</p>
              </div>
            </div>
            <div className="mt-4 flex h-20 items-end gap-1">
              {[35, 50, 40, 65, 55, 80, 70, 90, 75, 95, 85, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-purple-600/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-gradient-to-b from-[#0a0a12] to-purple-900/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.bottomTitle}</h2>
          <p className="mt-4 text-gray-400">{t.bottomDesc}</p>
          <button
            onClick={handleCTA}
            disabled={ctaLoading}
            className="mt-8 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-600/25 transition hover:shadow-purple-600/40 disabled:opacity-60"
          >
            {ctaLoading ? t.checking : t.heroCta}
          </button>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} TinyTale. {t.footerRights}
        </div>
      </footer>
    </div>
  );
}
