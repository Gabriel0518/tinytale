"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter} from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { profileApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import {localizePath } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

interface Transaction {
  _id: string;
  type: "purchase" | "unlock" | "reward" | "subscription";
  itemName: string;
  amountFiat?: number;
  amountCoins?: number;
  episodes?: string;
  cover?: string;
  icon: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

type FilterType = "all" | "purchase" | "unlock" | "reward";
type FilterStatus = "all" | "completed" | "pending" | "failed";

type PurchasesCopy = {
  back: string;
  title: string;
  add: string;
  monthSpending: string;
  completedCount: (count: number) => string;
  downloadInvoice: string;
  filterType: string;
  filterStatus: string;
  all: string;
  recharges: string;
  unlocks: string;
  rewards: string;
  completed: string;
  pending: string;
  failed: string;
  episodeShort: string;
  clickToCopy: string;
  copied: string;
  coinsUnit: string;
  noTransactions: string;
  noTransactionsDesc: string;
  getCoins: string;
};

const COPY: Record<string, PurchasesCopy> = {
  en: {
    back: "Back",
    title: "Purchase History",
    add: "ADD",
    monthSpending: "This Month's Spending",
    completedCount: (count) => `${count} transactions completed`,
    downloadInvoice: "Download Invoice (Coming soon)",
    filterType: "Type:",
    filterStatus: "Status:",
    all: "All",
    recharges: "Recharges",
    unlocks: "Unlocks",
    rewards: "Rewards",
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    episodeShort: "Ep.",
    clickToCopy: "Click to copy",
    copied: "Copied!",
    coinsUnit: "coins",
    noTransactions: "No transactions found",
    noTransactionsDesc: "Try adjusting your filters or make your first purchase",
    getCoins: "Get Coins" },
  zh: {
    back: "返回",
    title: "购买记录",
    add: "充值",
    monthSpending: "本月支出",
    completedCount: (count) => `已完成 ${count} 笔交易`,
    downloadInvoice: "下载发票（即将上线）",
    filterType: "类型：",
    filterStatus: "状态：",
    all: "全部",
    recharges: "充值",
    unlocks: "解锁",
    rewards: "奖励",
    completed: "已完成",
    pending: "处理中",
    failed: "失败",
    episodeShort: "第",
    clickToCopy: "点击复制",
    copied: "已复制",
    coinsUnit: "金币",
    noTransactions: "暂无交易记录",
    noTransactionsDesc: "可调整筛选条件，或先完成一笔购买",
    getCoins: "获取金币" },
  ja: {
    back: "戻る",
    title: "購入履歴",
    add: "追加",
    monthSpending: "今月の支出",
    completedCount: (count) => `${count}件の取引が完了`,
    downloadInvoice: "請求書をダウンロード（準備中）",
    filterType: "種類:",
    filterStatus: "状態:",
    all: "すべて",
    recharges: "チャージ",
    unlocks: "解放",
    rewards: "報酬",
    completed: "完了",
    pending: "保留",
    failed: "失敗",
    episodeShort: "第",
    clickToCopy: "クリックしてコピー",
    copied: "コピー済み",
    coinsUnit: "コイン",
    noTransactions: "取引履歴がありません",
    noTransactionsDesc: "フィルターを調整するか、最初の購入を行ってください",
    getCoins: "コインを購入" },
  es: {
    back: "Volver",
    title: "Historial de compras",
    add: "AÑADIR",
    monthSpending: "Gasto de este mes",
    completedCount: (count) => `${count} transacciones completadas`,
    downloadInvoice: "Descargar factura (próximamente)",
    filterType: "Tipo:",
    filterStatus: "Estado:",
    all: "Todo",
    recharges: "Recargas",
    unlocks: "Desbloqueos",
    rewards: "Recompensas",
    completed: "Completado",
    pending: "Pendiente",
    failed: "Fallido",
    episodeShort: "Ep.",
    clickToCopy: "Haz clic para copiar",
    copied: "¡Copiado!",
    coinsUnit: "monedas",
    noTransactions: "No se encontraron transacciones",
    noTransactionsDesc: "Ajusta los filtros o realiza tu primera compra",
    getCoins: "Obtener monedas" },
  pt: {
    back: "Voltar",
    title: "Histórico de compras",
    add: "ADICIONAR",
    monthSpending: "Gasto deste mês",
    completedCount: (count) => `${count} transações concluídas`,
    downloadInvoice: "Baixar fatura (em breve)",
    filterType: "Tipo:",
    filterStatus: "Status:",
    all: "Todos",
    recharges: "Recargas",
    unlocks: "Desbloqueios",
    rewards: "Recompensas",
    completed: "Concluído",
    pending: "Pendente",
    failed: "Falhou",
    episodeShort: "Ep.",
    clickToCopy: "Clique para copiar",
    copied: "Copiado!",
    coinsUnit: "moedas",
    noTransactions: "Nenhuma transação encontrada",
    noTransactionsDesc: "Ajuste os filtros ou faça sua primeira compra",
    getCoins: "Obter moedas" },
  hi: {
    back: "वापस",
    title: "खरीद इतिहास",
    add: "जोड़ें",
    monthSpending: "इस महीने का खर्च",
    completedCount: (count) => `${count} लेनदेन पूरे हुए`,
    downloadInvoice: "इनवॉइस डाउनलोड (जल्द आ रहा है)",
    filterType: "प्रकार:",
    filterStatus: "स्थिति:",
    all: "सभी",
    recharges: "रीचार्ज",
    unlocks: "अनलॉक",
    rewards: "रिवॉर्ड",
    completed: "पूरा",
    pending: "लंबित",
    failed: "विफल",
    episodeShort: "एप.",
    clickToCopy: "कॉपी करने के लिए क्लिक करें",
    copied: "कॉपी हो गया!",
    coinsUnit: "कॉइन्स",
    noTransactions: "कोई लेनदेन नहीं मिला",
    noTransactionsDesc: "फ़िल्टर बदलें या पहली खरीद करें",
    getCoins: "कॉइन्स लें" },
  id: {
    back: "Kembali",
    title: "Riwayat pembelian",
    add: "TAMBAH",
    monthSpending: "Pengeluaran bulan ini",
    completedCount: (count) => `${count} transaksi selesai`,
    downloadInvoice: "Unduh invoice (segera hadir)",
    filterType: "Tipe:",
    filterStatus: "Status:",
    all: "Semua",
    recharges: "Isi ulang",
    unlocks: "Buka kunci",
    rewards: "Hadiah",
    completed: "Selesai",
    pending: "Menunggu",
    failed: "Gagal",
    episodeShort: "Ep.",
    clickToCopy: "Klik untuk menyalin",
    copied: "Tersalin!",
    coinsUnit: "koin",
    noTransactions: "Tidak ada transaksi",
    noTransactionsDesc: "Coba ubah filter atau lakukan pembelian pertama",
    getCoins: "Dapatkan koin" } };

const DATE_LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  pt: "pt-BR",
  hi: "hi-IN",
  id: "id-ID",
  ko: "ko-KR",
  fr: "fr-FR" };

export default function PurchasesPage() {
  const locale = useLocale();
  const copy = resolveLocaleCopy(COPY, locale);
  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [balance, setBalance] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setBalance(user.coins || 0);
    const load = async () => {
      if (!token) return;
      try {
        const res = await profileApi.getPurchases(token);
        setTransactions(res.data?.purchases || res.data || []);
      } catch { /* fallback empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [user, token]);

  const filtered = transactions.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  const monthlySpent = (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions
      .filter(t => {
        if (!t.amountFiat || t.status !== "completed") return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amountFiat || 0), 0);
  })();

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const getTypeIcon = (t: Transaction) => {
    if (t.type === "unlock" && t.cover) {
      return <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden opacity-80"><Image src={t.cover} alt="" width={40} height={40} className="w-full h-full object-cover" /></div>;
    }
    const icons: Record<string, { path: string; color: string; bg: string }> = {
      coins: { path: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-yellow-400", bg: "bg-yellow-500/10" },
      film: { path: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5", color: "text-blue-400", bg: "bg-blue-500/10" },
      gift: { path: "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z", color: "text-purple-400", bg: "bg-purple-500/10" },
      crown: { path: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z", color: "text-yellow-400", bg: "bg-yellow-500/10" } };
    const ic = icons[t.icon] || icons.coins;
    return (
      <div className={`w-10 h-10 rounded-lg ${ic.bg} flex items-center justify-center`}>
        <svg className={`w-5 h-5 ${ic.color}`} fill={t.icon === "crown" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={ic.path} /></svg>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { dot: string; text: string; bg: string; pulse?: boolean }> = {
      completed: { dot: "bg-green-400", text: "text-green-400", bg: "bg-green-400/10" },
      pending: { dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-400/10", pulse: true },
      failed: { dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10" } };
    const s = map[status] || map.completed;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.text} ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
        {status === "completed" ? copy.completed : status === "pending" ? copy.pending : copy.failed}
      </span>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-8 w-44 animate-pulse rounded-full bg-white/8" />
              <div className="h-4 w-64 animate-pulse rounded-full bg-white/6" />
            </div>
            <div className="h-12 w-32 animate-pulse rounded-full bg-white/6" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-3 h-4 w-48 animate-pulse rounded-full bg-white/8" />
                <div className="mb-2 h-3 w-2/3 animate-pulse rounded-full bg-white/6" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Header with Balance */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              <span className="text-sm">{copy.back}</span>
            </button>
            <h1 className="text-2xl font-bold">{copy.title}</h1>
          </div>
          {/* Coin Capsule */}
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 rounded-full px-4 py-2">
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#phGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
            <span className="font-bold text-yellow-400">{balance.toLocaleString()}</span>
            <Link href={localizePath("/user/coins", locale)} className="ml-1 px-2.5 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full hover:bg-yellow-400 transition">{copy.add}</Link>
          </div>
        </div>

        {/* Monthly Summary Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800/50 border border-white/5 p-6 relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
          </div>
          <div className="relative">
            <p className="text-sm text-gray-400 mb-1">{copy.monthSpending}</p>
            <p className="text-3xl font-bold text-white">${monthlySpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{copy.completedCount(transactions.filter((item) => item.status === "completed").length)}</p>
          </div>
          <button disabled className="absolute right-6 bottom-6 flex items-center gap-2 text-xs text-gray-500 cursor-not-allowed opacity-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {copy.downloadInvoice}
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#1E1E1E] rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{copy.filterType}</span>
            {(["all", "purchase", "unlock", "reward"] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterType === f ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-transparent text-gray-400 hover:text-white hover:border-white/10"}`}>
                {f === "all" ? copy.all : f === "purchase" ? copy.recharges : f === "unlock" ? copy.unlocks : copy.rewards}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{copy.filterStatus}</span>
            {(["all", "completed", "pending", "failed"] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterStatus === f ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-transparent text-gray-400 hover:text-white hover:border-white/10"}`}>
                {f === "all" ? copy.all : f === "completed" ? copy.completed : f === "pending" ? copy.pending : copy.failed}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((tx) => {
              const isFailed = tx.status === "failed";
              const isPositive = (tx.amountCoins || 0) > 0 || tx.type === "purchase" || tx.type === "subscription";
              return (
                <div key={tx._id} className="group rounded-xl hover:bg-[#2A2A2A] transition">
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 items-center gap-4 px-4 py-3.5">
                    <div className="col-span-1">{getTypeIcon(tx)}</div>
                    <div className="col-span-4">
                      <p className={`text-sm font-medium ${isFailed ? "line-through text-gray-500" : "text-white"}`}>{tx.itemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tx.episodes && <span className="text-[11px] text-gray-500">{copy.episodeShort} {tx.episodes}</span>}
                        <button onClick={() => handleCopyId(tx._id)} className="text-[11px] text-gray-600 hover:text-gray-400 font-mono transition" title={copy.clickToCopy}>
                          {copiedId === tx._id ? copy.copied : tx._id}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}
                      <span className="text-gray-600 ml-1.5">{new Date(tx.date).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="col-span-2">{getStatusBadge(tx.status)}</div>
                    <div className="col-span-2 text-right">
                      {tx.amountFiat != null && (
                        <p className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : "-"}${tx.amountFiat.toFixed(2)}
                        </p>
                      )}
                      {tx.amountCoins != null && (
                        <p className={`text-xs ${(tx.amountCoins || 0) >= 0 ? "text-yellow-400/70" : "text-red-400/70"}`}>
                          {(tx.amountCoins || 0) >= 0 ? "+" : ""}{tx.amountCoins?.toLocaleString()} {copy.coinsUnit}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-3 px-4 py-3.5">
                    <div className="shrink-0">{getTypeIcon(tx)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isFailed ? "line-through text-gray-500" : "text-white"}`}>{tx.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(tx.date).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}
                        {tx.episodes && <span> · {copy.episodeShort} {tx.episodes}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {tx.amountFiat != null && (
                        <p className={`text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : "-"}${tx.amountFiat.toFixed(2)}
                        </p>
                      )}
                      {tx.amountCoins != null && (
                        <p className={`text-xs ${(tx.amountCoins || 0) >= 0 ? "text-yellow-400/70" : "text-red-400/70"}`}>
                          {(tx.amountCoins || 0) >= 0 ? "+" : ""}{tx.amountCoins?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
            </div>
            <p className="text-gray-400 font-medium">{copy.noTransactions}</p>
            <p className="text-sm text-gray-600 mt-1">{copy.noTransactionsDesc}</p>
            <Link href={localizePath("/user/coins", locale)} className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {copy.getCoins}
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
