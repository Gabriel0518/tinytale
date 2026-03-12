"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect} from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { userApi, coinsApi } from "@/lib/api";
import { Drama, User } from "@/types";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import { localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

type Tab = "library" | "wallet";

interface WatchHistoryItem {
  _id?: string;
  dramaId?: string;
  title?: string;
  cover?: string;
  lastEpisode?: number;
  drama?: { title?: string; cover?: string };
  episode?: { episodeNumber?: number };
}

interface TransactionItem {
  id: string;
  date: string;
  desc: string;
  type: string;
  amount: number;
  status: string;
}

type ProfileCopy = {
  loading: string;
  vipMember: string;
  profileTagline: string;
  editProfile: string;
  settings: string;
  tabs: { library: string; wallet: string };
  library: {
    favorites: string;
    history: string;
    noFavorites: string;
    noHistory: string;
    continueWatching: string;
    unknownDrama: string;
    episode: string;
  };
  wallet: {
    totalBalance: string;
    coins: string;
    topUpNow: string;
    redeemCode: string;
    transactionHistory: string;
    viewAll: string;
    tableHeaders: {
      date: string;
      description: string;
      amount: string;
      status: string;
    };
    bonusPositivePrefix: string;
    vipMembership: string;
    vipDescActive: string;
    vipDescInactive: string;
    currentPlan: string;
    expiresInDays: (days: number) => string;
    renewMembership: string;
    becomeMember: string;
    supportMore: string;
    links: {
      helpFaq: string;
      contact: string;
      coupons: string;
      privacy: string;
    };
    eventBanner: string;
    txDescriptions: {
      recharge: string;
      unlock: string;
      refund: string;
      fallback: string;
    };
    txStatuses: {
      completed: string;
      pending: string;
    };
  };
};

const COPY: Record<SupportedLocale, ProfileCopy> = {
  en: {
    loading: "Loading...",
    vipMember: "VIP Member",
    profileTagline: "Short drama enthusiast. Currently watching: The CEO's Secret Contract...",
    editProfile: "Edit Profile",
    settings: "Settings",
    tabs: { library: "My Library", wallet: "My Wallet" },
    library: {
      favorites: "Favorites",
      history: "History",
      noFavorites: "No favorites yet. Start exploring dramas!",
      noHistory: "No watch history yet",
      continueWatching: "Continue Watching",
      unknownDrama: "Unknown",
      episode: "Episode" },
    wallet: {
      totalBalance: "Total Balance",
      coins: "Coins",
      topUpNow: "Top Up Now",
      redeemCode: "Redeem Code",
      transactionHistory: "Transaction History",
      viewAll: "View All",
      tableHeaders: { date: "Date", description: "Description", amount: "Amount", status: "Status" },
      bonusPositivePrefix: "+",
      vipMembership: "VIP Membership",
      vipDescActive: "Enjoy ad-free viewing, early access to episodes, and daily bonus coins.",
      vipDescInactive: "Enjoy ad-free streaming, exclusive content, and bonus coins every month.",
      currentPlan: "Current Plan",
      expiresInDays: (days) => `Expires in ${days} days`,
      renewMembership: "Renew Membership",
      becomeMember: "Become a Member",
      supportMore: "Support & More",
      links: {
        helpFaq: "Help Center & FAQ",
        contact: "Contact Support",
        coupons: "My Coupons",
        privacy: "Account Privacy" },
      eventBanner: "Watch & Win: Get 500 Free Coins this weekend!",
      txDescriptions: {
        recharge: "Coin Recharge",
        unlock: "Episode Unlock",
        refund: "Refund",
        fallback: "Transaction" },
      txStatuses: {
        completed: "Success",
        pending: "Pending" } } },
  zh: {
    loading: "加载中...",
    vipMember: "VIP 会员",
    profileTagline: "短剧爱好者，正在观看：《总裁的秘密契约》...",
    editProfile: "编辑资料",
    settings: "设置",
    tabs: { library: "我的片库", wallet: "我的钱包" },
    library: {
      favorites: "收藏",
      history: "历史",
      noFavorites: "还没有收藏，去发现你喜欢的短剧吧！",
      noHistory: "暂无观看历史",
      continueWatching: "继续观看",
      unknownDrama: "未知短剧",
      episode: "第" },
    wallet: {
      totalBalance: "总余额",
      coins: "金币",
      topUpNow: "立即充值",
      redeemCode: "兑换码",
      transactionHistory: "交易记录",
      viewAll: "查看全部",
      tableHeaders: { date: "日期", description: "说明", amount: "数量", status: "状态" },
      bonusPositivePrefix: "+",
      vipMembership: "VIP 会员",
      vipDescActive: "享受免广告观看、抢先看新集数和每日金币奖励。",
      vipDescInactive: "开通后可免广告、看专属内容并每月获得金币福利。",
      currentPlan: "当前套餐",
      expiresInDays: (days) => `${days} 天后到期`,
      renewMembership: "续费会员",
      becomeMember: "开通会员",
      supportMore: "帮助与更多",
      links: {
        helpFaq: "帮助中心与 FAQ",
        contact: "联系支持",
        coupons: "我的优惠",
        privacy: "账号隐私" },
      eventBanner: "观剧赢福利：本周末送你 500 免费金币！",
      txDescriptions: {
        recharge: "金币充值",
        unlock: "剧集解锁",
        refund: "退款",
        fallback: "交易" },
      txStatuses: {
        completed: "成功",
        pending: "处理中" } } },
  ja: {
    loading: "読み込み中...",
    vipMember: "VIP会員",
    profileTagline: "短編ドラマ好き。現在視聴中: CEOの秘密契約...",
    editProfile: "プロフィール編集",
    settings: "設定",
    tabs: { library: "マイライブラリ", wallet: "マイウォレット" },
    library: {
      favorites: "お気に入り",
      history: "履歴",
      noFavorites: "お気に入りはまだありません。ドラマを探してみましょう！",
      noHistory: "視聴履歴はまだありません",
      continueWatching: "続きを見る",
      unknownDrama: "不明",
      episode: "第" },
    wallet: {
      totalBalance: "総残高",
      coins: "コイン",
      topUpNow: "今すぐチャージ",
      redeemCode: "コード引き換え",
      transactionHistory: "取引履歴",
      viewAll: "すべて表示",
      tableHeaders: { date: "日付", description: "内容", amount: "金額", status: "状態" },
      bonusPositivePrefix: "+",
      vipMembership: "VIP会員",
      vipDescActive: "広告なし視聴、先行公開、毎日のボーナスコインを楽しめます。",
      vipDescInactive: "広告なし視聴、限定コンテンツ、毎月のボーナスコインを利用できます。",
      currentPlan: "現在のプラン",
      expiresInDays: (days) => `${days}日で期限切れ`,
      renewMembership: "会員を更新",
      becomeMember: "会員になる",
      supportMore: "サポートとその他",
      links: {
        helpFaq: "ヘルプセンターとFAQ",
        contact: "サポートに連絡",
        coupons: "マイクーポン",
        privacy: "アカウントプライバシー" },
      eventBanner: "視聴して獲得: 今週末は無料コイン500枚！",
      txDescriptions: {
        recharge: "コインチャージ",
        unlock: "エピソード解放",
        refund: "返金",
        fallback: "取引" },
      txStatuses: {
        completed: "成功",
        pending: "保留中" } } },
  es: {
    loading: "Cargando...",
    vipMember: "Miembro VIP",
    profileTagline: "Fan de los dramas cortos. Viendo ahora: El contrato secreto del CEO...",
    editProfile: "Editar perfil",
    settings: "Configuración",
    tabs: { library: "Mi biblioteca", wallet: "Mi billetera" },
    library: {
      favorites: "Favoritos",
      history: "Historial",
      noFavorites: "Aún no tienes favoritos. ¡Empieza a explorar dramas!",
      noHistory: "Aún no hay historial de visualización",
      continueWatching: "Seguir viendo",
      unknownDrama: "Desconocido",
      episode: "Episodio" },
    wallet: {
      totalBalance: "Saldo total",
      coins: "Monedas",
      topUpNow: "Recargar ahora",
      redeemCode: "Canjear código",
      transactionHistory: "Historial de transacciones",
      viewAll: "Ver todo",
      tableHeaders: { date: "Fecha", description: "Descripción", amount: "Monto", status: "Estado" },
      bonusPositivePrefix: "+",
      vipMembership: "Membresía VIP",
      vipDescActive: "Disfruta sin anuncios, acceso anticipado y monedas extra cada día.",
      vipDescInactive: "Disfruta sin anuncios, contenido exclusivo y monedas extra cada mes.",
      currentPlan: "Plan actual",
      expiresInDays: (days) => `Vence en ${days} días`,
      renewMembership: "Renovar membresía",
      becomeMember: "Hazte miembro",
      supportMore: "Soporte y más",
      links: {
        helpFaq: "Centro de ayuda y FAQ",
        contact: "Contactar soporte",
        coupons: "Mis cupones",
        privacy: "Privacidad de cuenta" },
      eventBanner: "Mira y gana: ¡500 monedas gratis este fin de semana!",
      txDescriptions: {
        recharge: "Recarga de monedas",
        unlock: "Desbloqueo de episodio",
        refund: "Reembolso",
        fallback: "Transacción" },
      txStatuses: {
        completed: "Éxito",
        pending: "Pendiente" } } },
  pt: {
    loading: "Carregando...",
    vipMember: "Membro VIP",
    profileTagline: "Fã de dramas curtos. Assistindo agora: O contrato secreto do CEO...",
    editProfile: "Editar perfil",
    settings: "Configurações",
    tabs: { library: "Minha biblioteca", wallet: "Minha carteira" },
    library: {
      favorites: "Favoritos",
      history: "Histórico",
      noFavorites: "Sem favoritos ainda. Explore dramas agora!",
      noHistory: "Ainda não há histórico",
      continueWatching: "Continuar assistindo",
      unknownDrama: "Desconhecido",
      episode: "Episódio" },
    wallet: {
      totalBalance: "Saldo total",
      coins: "Moedas",
      topUpNow: "Recarregar agora",
      redeemCode: "Resgatar código",
      transactionHistory: "Histórico de transações",
      viewAll: "Ver tudo",
      tableHeaders: { date: "Data", description: "Descrição", amount: "Valor", status: "Status" },
      bonusPositivePrefix: "+",
      vipMembership: "Assinatura VIP",
      vipDescActive: "Aproveite sem anúncios, acesso antecipado e bônus diário de moedas.",
      vipDescInactive: "Aproveite sem anúncios, conteúdo exclusivo e bônus mensal de moedas.",
      currentPlan: "Plano atual",
      expiresInDays: (days) => `Expira em ${days} dias`,
      renewMembership: "Renovar assinatura",
      becomeMember: "Virar membro",
      supportMore: "Suporte e mais",
      links: {
        helpFaq: "Central de ajuda e FAQ",
        contact: "Falar com suporte",
        coupons: "Meus cupons",
        privacy: "Privacidade da conta" },
      eventBanner: "Assista e ganhe: 500 moedas grátis neste fim de semana!",
      txDescriptions: {
        recharge: "Recarga de moedas",
        unlock: "Desbloqueio de episódio",
        refund: "Reembolso",
        fallback: "Transação" },
      txStatuses: {
        completed: "Sucesso",
        pending: "Pendente" } } },
  hi: {
    loading: "लोड हो रहा है...",
    vipMember: "VIP सदस्य",
    profileTagline: "शॉर्ट ड्रामा प्रेमी। अभी देख रहे हैं: CEO का सीक्रेट कॉन्ट्रैक्ट...",
    editProfile: "प्रोफाइल संपादित करें",
    settings: "सेटिंग्स",
    tabs: { library: "मेरी लाइब्रेरी", wallet: "मेरा वॉलेट" },
    library: {
      favorites: "फेवरेट्स",
      history: "इतिहास",
      noFavorites: "अभी कोई फेवरेट नहीं। ड्रामा एक्सप्लोर करें!",
      noHistory: "अभी कोई देखने का इतिहास नहीं",
      continueWatching: "देखना जारी रखें",
      unknownDrama: "अज्ञात",
      episode: "एपिसोड" },
    wallet: {
      totalBalance: "कुल बैलेंस",
      coins: "कॉइन्स",
      topUpNow: "अभी रिचार्ज करें",
      redeemCode: "कोड रिडीम करें",
      transactionHistory: "लेनदेन इतिहास",
      viewAll: "सभी देखें",
      tableHeaders: { date: "तारीख", description: "विवरण", amount: "राशि", status: "स्थिति" },
      bonusPositivePrefix: "+",
      vipMembership: "VIP सदस्यता",
      vipDescActive: "विज्ञापन-मुक्त देखने, अर्ली एक्सेस और दैनिक बोनस कॉइन्स का आनंद लें।",
      vipDescInactive: "विज्ञापन-मुक्त स्ट्रीमिंग, एक्सक्लूसिव कंटेंट और मासिक बोनस कॉइन्स पाएं।",
      currentPlan: "वर्तमान प्लान",
      expiresInDays: (days) => `${days} दिनों में समाप्त`,
      renewMembership: "सदस्यता नवीनीकरण",
      becomeMember: "सदस्य बनें",
      supportMore: "सपोर्ट और अधिक",
      links: {
        helpFaq: "हेल्प सेंटर और FAQ",
        contact: "सपोर्ट से संपर्क करें",
        coupons: "मेरे कूपन",
        privacy: "अकाउंट प्राइवेसी" },
      eventBanner: "देखो और जीतो: इस वीकेंड 500 फ्री कॉइन्स!",
      txDescriptions: {
        recharge: "कॉइन रिचार्ज",
        unlock: "एपिसोड अनलॉक",
        refund: "रिफंड",
        fallback: "लेनदेन" },
      txStatuses: {
        completed: "सफल",
        pending: "लंबित" } } },
  id: {
    loading: "Memuat...",
    vipMember: "Anggota VIP",
    profileTagline: "Penggemar drama pendek. Sedang menonton: Kontrak rahasia sang CEO...",
    editProfile: "Edit profil",
    settings: "Pengaturan",
    tabs: { library: "Perpustakaan saya", wallet: "Dompet saya" },
    library: {
      favorites: "Favorit",
      history: "Riwayat",
      noFavorites: "Belum ada favorit. Mulai jelajahi drama!",
      noHistory: "Belum ada riwayat tonton",
      continueWatching: "Lanjutkan menonton",
      unknownDrama: "Tidak dikenal",
      episode: "Episode" },
    wallet: {
      totalBalance: "Total saldo",
      coins: "Koin",
      topUpNow: "Isi ulang sekarang",
      redeemCode: "Redeem kode",
      transactionHistory: "Riwayat transaksi",
      viewAll: "Lihat semua",
      tableHeaders: { date: "Tanggal", description: "Deskripsi", amount: "Jumlah", status: "Status" },
      bonusPositivePrefix: "+",
      vipMembership: "Keanggotaan VIP",
      vipDescActive: "Nikmati tanpa iklan, akses awal episode, dan bonus koin harian.",
      vipDescInactive: "Nikmati tanpa iklan, konten eksklusif, dan bonus koin bulanan.",
      currentPlan: "Paket saat ini",
      expiresInDays: (days) => `Berakhir dalam ${days} hari`,
      renewMembership: "Perpanjang membership",
      becomeMember: "Jadi member",
      supportMore: "Bantuan dan lainnya",
      links: {
        helpFaq: "Pusat bantuan & FAQ",
        contact: "Hubungi dukungan",
        coupons: "Kupon saya",
        privacy: "Privasi akun" },
      eventBanner: "Tonton & Menang: Dapatkan 500 koin gratis akhir pekan ini!",
      txDescriptions: {
        recharge: "Isi ulang koin",
        unlock: "Buka episode",
        refund: "Refund",
        fallback: "Transaksi" },
      txStatuses: {
        completed: "Berhasil",
        pending: "Menunggu" } } } };

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  pt: "pt-BR",
  hi: "hi-IN",
  id: "id-ID" };

export default function ProfilePage() {
  const locale = useLocale();
  const t = COPY[locale] || COPY.en;
  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const [activeTab, setActiveTab] = useState<Tab>("wallet");
  const [favorites, setFavorites] = useState<Drama[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [favRes, histRes] = await Promise.all([
          userApi.getFavorites(token),
          userApi.getHistory(token),
        ]);
        const favData = favRes.data;
        if (Array.isArray(favData)) setFavorites(favData);
        else if (favData?.favorites) setFavorites(favData.favorites);

        const histData = histRes.data;
        setHistory(Array.isArray(histData) ? histData : []);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-[#0F1014] flex items-center justify-center">
        <div className="text-gray-400">{t.loading}</div>
      </div>
    );
  }

  const isVip = user.vipStatus === "active";
  const profileId = String(user._id || user.id || "");

  return (
    <div className="min-h-screen bg-[#0F1014]">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="border-b border-white/5 bg-[#141519] py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="relative">
                <div className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold text-white ${isVip ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-[#141519]" : "bg-gray-700"}`}
                  style={{ background: "linear-gradient(135deg, #374151, #1f2937)" }}>
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.nickname} fill className="rounded-full object-cover" />
                  ) : (
                    user.nickname?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                {isVip && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-0.5 text-[9px] font-bold text-black whitespace-nowrap">
                    {t.vipMember}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <h1 className="text-2xl font-bold text-white">{user.nickname}</h1>
                  {isVip && (
                    <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-500">{t.vipMember}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">ID: {profileId ? profileId.slice(-6).toUpperCase() : "-"}</p>
                <p className="mt-1 text-sm text-gray-400">{t.profileTagline}</p>
              </div>

              <div className="flex gap-3">
                <Link href={localizePath("/user/settings", locale)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                  {t.editProfile}
                </Link>
                <Link href={localizePath("/user/settings", locale)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t.settings}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/5">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex gap-8" role="tablist">
              {(["library", "wallet"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-selected={activeTab === tab}
                  role="tab"
                  className={`relative py-4 text-sm font-medium transition ${
                    activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "library" ? t.tabs.library : t.tabs.wallet}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 mt-8">
          {activeTab === "library" && <LibraryTab favorites={favorites} history={history} locale={locale} t={t} />}
          {activeTab === "wallet" && <WalletTab user={user} isVip={isVip} token={token} locale={locale} t={t} dateLocale={dateLocale} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LibraryTab({
  favorites,
  history,
  locale,
  t }: {
  favorites: Drama[];
  history: WatchHistoryItem[];
  locale: SupportedLocale;
  t: ProfileCopy;
}) {
  const [sub, setSub] = useState<"favorites" | "history">("favorites");

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <button onClick={() => setSub("favorites")} aria-pressed={sub === "favorites"} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sub === "favorites" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
          {t.library.favorites} ({favorites.length})
        </button>
        <button onClick={() => setSub("history")} aria-pressed={sub === "history"} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sub === "history" ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
          {t.library.history} ({history.length})
        </button>
      </div>

      {sub === "favorites" && (
        favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((drama) => (
              <Link key={drama._id} href={localizePath(`/drama/${drama._id}`, locale)}>
                <div className="group relative aspect-[2/3] overflow-hidden rounded-lg">
                  <Image src={drama.cover} alt={drama.title} fill className="object-cover transition group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100">
                    <p className="text-sm font-medium text-white truncate">{drama.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            {t.library.noFavorites}
          </div>
        )
      )}

      {sub === "history" && (
        history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item, i) => (
              <Link key={i} href={localizePath(`/drama/${item._id || item.dramaId}`, locale)} className="flex gap-4 rounded-xl bg-white/[0.03] border border-white/5 p-4 transition hover:bg-white/[0.06]">
                <Image src={item.cover || item.drama?.cover || "https://picsum.photos/seed/drama/200/300"} alt={item.title || item.drama?.title || t.library.unknownDrama} width={56} height={80} className="h-20 w-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{item.title || item.drama?.title || t.library.unknownDrama}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t.library.episode} {item.lastEpisode || item.episode?.episodeNumber || "-"}</p>
                  <span className="mt-2 inline-block text-xs text-red-500">{t.library.continueWatching} →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <svg className="mx-auto mb-3 h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t.library.noHistory}
          </div>
        )
      )}
    </div>
  );
}

function WalletTab({
  user,
  isVip,
  token,
  locale,
  t,
  dateLocale }: {
  user: User;
  isVip: boolean;
  token: string | null;
  locale: SupportedLocale;
  t: ProfileCopy;
  dateLocale: string;
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        const res = await coinsApi.getTransactions(token, { limit: 4 });
        const data = res.data?.transactions || res.data || [];
        if (Array.isArray(data)) {
          setTransactions(data.map((tx: any) => ({
            id: String(tx._id || tx.id || ""),
            date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" }) : "",
            desc: tx.type === "recharge"
              ? t.wallet.txDescriptions.recharge
              : tx.type === "unlock"
                ? t.wallet.txDescriptions.unlock
                : tx.type === "refund"
                  ? t.wallet.txDescriptions.refund
                  : tx.type || t.wallet.txDescriptions.fallback,
            type: tx.type === "recharge" ? "topup" : tx.type === "unlock" ? "spend" : tx.type || "spend",
            amount: Number(tx.amount || 0),
            status: tx.status === "completed" ? t.wallet.txStatuses.completed : tx.status || t.wallet.txStatuses.pending })));
        }
      } catch {
        // keep empty on error
      }
    };
    fetchTransactions();
  }, [token, dateLocale, t.wallet.txDescriptions, t.wallet.txStatuses]);

  const vipDaysLeft = user.vipExpireDate
    ? Math.max(0, Math.ceil((new Date(user.vipExpireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const vipProgress = user.vipExpireDate ? Math.min(100, Math.max(0, (vipDaysLeft / 30) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1c23] to-[#141519] border border-white/5 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">{t.wallet.totalBalance}</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-baseline gap-2 flex-1">
              <span className="text-4xl font-bold text-white">{(user.coins || 0).toLocaleString()}</span>
              <span className="rounded-full bg-yellow-500/20 px-3 py-0.5 text-sm font-semibold text-yellow-500">{t.wallet.coins}</span>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
              <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link href={localizePath("/user/coins", locale)} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
              {t.wallet.topUpNow}
            </Link>
            <button className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              {t.wallet.redeemCode}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t.wallet.transactionHistory}</h2>
            <Link href={localizePath("/user/purchases", locale)} className="text-xs text-yellow-500 hover:text-yellow-400 transition">{t.wallet.viewAll} →</Link>
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t.wallet.tableHeaders.date}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t.wallet.tableHeaders.description}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t.wallet.tableHeaders.amount}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t.wallet.tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[200px]">{tx.desc}</td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.amount < 0 ? "text-red-400" : "text-green-400"}`}>
                      {tx.amount > 0 ? t.wallet.bonusPositivePrefix : ""}{tx.amount} {t.wallet.coins}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
            <span className="text-sm font-bold text-yellow-500">{t.wallet.vipMembership}</span>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {isVip ? t.wallet.vipDescActive : t.wallet.vipDescInactive}
          </p>
          {isVip && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                <span>{t.wallet.currentPlan}</span>
                <span>{t.wallet.expiresInDays(vipDaysLeft)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all" style={{ width: `${vipProgress}%` }} />
              </div>
            </div>
          )}
          <Link href={localizePath("/user/subscription", locale)} className="mt-4 block rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-2.5 text-center text-sm font-bold text-black transition hover:from-yellow-600 hover:to-yellow-700">
            {isVip ? t.wallet.renewMembership : t.wallet.becomeMember}
          </Link>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-white">{t.wallet.supportMore}</h2>
          <div className="space-y-2">
            {[
              { label: t.wallet.links.helpFaq, href: localizePath("/help", locale), icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
              { label: t.wallet.links.contact, href: localizePath("/help", locale), icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
              { label: t.wallet.links.coupons, href: localizePath("/user/purchases", locale), icon: "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" },
              { label: t.wallet.links.privacy, href: localizePath("/user/settings", locale), icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                <span className="text-sm text-gray-300">{item.label}</span>
                <svg className="ml-auto h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-transparent overflow-hidden">
          <div className="relative h-36 w-full bg-gradient-to-br from-[#2a1f0a] to-[#1a1519]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="h-10 w-10 text-yellow-500/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-yellow-500">{t.wallet.eventBanner}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
