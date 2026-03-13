"use client";
export const dynamic = 'force-dynamic';


import { useState, useEffect} from "react";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";
import {SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

interface Commission {
  _id: string;
  date: string;
  dramaName: string;
  referralLink: string;
  userId: string;
  orderAmount: number;
  commissionRate: number;
  commission: number;
  status: "confirmed" | "pending" | "rejected";
}

interface CommissionsResponse {
  commissions: Commission[];
  total: number;
  totalCommission: number;
  commissionChange: number;
  page: number;
  totalPages: number;
}

const STATUS_TABS = ["all", "confirmed", "pending", "rejected"] as const;

type ReportsCopy = {
  title: string;
  totalCommission: string;
  vsLastPeriod: string;
  searchPlaceholder: string;
  exportCsv: string;
  tabs: Record<(typeof STATUS_TABS)[number], string>;
  tableHeaders: [string, string, string, string, string, string, string, string];
  noRecords: string;
  pageOf: (page: number, total: number) => string;
  previous: string;
  next: string;
  statusLabels: Record<Commission["status"], string>;
};

const COPY: FlexibleRecord<SupportedLocale, ReportsCopy> = {
  en: {
    title: "Commission Reports",
    totalCommission: "Total Commission",
    vsLastPeriod: "vs last period",
    searchPlaceholder: "Search by drama name...",
    exportCsv: "Export CSV",
    tabs: { all: "All", confirmed: "Confirmed", pending: "Pending", rejected: "Rejected" },
    tableHeaders: ["Date", "Drama Name", "Referral Link", "User ID", "Order Amount", "Rate", "Commission", "Status"],
    noRecords: "No commission records found.",
    pageOf: (page, total) => `Page ${page} of ${total}`,
    previous: "Previous",
    next: "Next",
    statusLabels: { confirmed: "Confirmed", pending: "Pending", rejected: "Rejected" } },
  zh: {
    title: "佣金报表",
    totalCommission: "总佣金",
    vsLastPeriod: "较上期",
    searchPlaceholder: "按短剧名称搜索...",
    exportCsv: "导出 CSV",
    tabs: { all: "全部", confirmed: "已确认", pending: "待处理", rejected: "已拒绝" },
    tableHeaders: ["日期", "短剧名称", "推广链接", "用户 ID", "订单金额", "比例", "佣金", "状态"],
    noRecords: "暂无佣金记录。",
    pageOf: (page, total) => `第 ${page} / ${total} 页`,
    previous: "上一页",
    next: "下一页",
    statusLabels: { confirmed: "已确认", pending: "待处理", rejected: "已拒绝" } },
  ja: {
    title: "コミッションレポート",
    totalCommission: "総コミッション",
    vsLastPeriod: "前期間比",
    searchPlaceholder: "ドラマ名で検索...",
    exportCsv: "CSVをエクスポート",
    tabs: { all: "すべて", confirmed: "確定", pending: "保留", rejected: "却下" },
    tableHeaders: ["日付", "ドラマ名", "紹介リンク", "ユーザー ID", "注文金額", "率", "コミッション", "状態"],
    noRecords: "コミッション記録がありません。",
    pageOf: (page, total) => `${page} / ${total} ページ`,
    previous: "前へ",
    next: "次へ",
    statusLabels: { confirmed: "確定", pending: "保留", rejected: "却下" } },
  es: {
    title: "Reportes de comisión",
    totalCommission: "Comisión total",
    vsLastPeriod: "vs período anterior",
    searchPlaceholder: "Buscar por nombre del drama...",
    exportCsv: "Exportar CSV",
    tabs: { all: "Todo", confirmed: "Confirmado", pending: "Pendiente", rejected: "Rechazado" },
    tableHeaders: ["Fecha", "Drama", "Enlace de referido", "ID de usuario", "Monto del pedido", "Tasa", "Comisión", "Estado"],
    noRecords: "No se encontraron comisiones.",
    pageOf: (page, total) => `Página ${page} de ${total}`,
    previous: "Anterior",
    next: "Siguiente",
    statusLabels: { confirmed: "Confirmado", pending: "Pendiente", rejected: "Rechazado" } },
  pt: {
    title: "Relatórios de comissão",
    totalCommission: "Comissão total",
    vsLastPeriod: "vs período anterior",
    searchPlaceholder: "Buscar por nome do drama...",
    exportCsv: "Exportar CSV",
    tabs: { all: "Todos", confirmed: "Confirmado", pending: "Pendente", rejected: "Rejeitado" },
    tableHeaders: ["Data", "Drama", "Link de referência", "ID do usuário", "Valor do pedido", "Taxa", "Comissão", "Status"],
    noRecords: "Nenhum registro de comissão encontrado.",
    pageOf: (page, total) => `Página ${page} de ${total}`,
    previous: "Anterior",
    next: "Próxima",
    statusLabels: { confirmed: "Confirmado", pending: "Pendente", rejected: "Rejeitado" } },
  hi: {
    title: "कमीशन रिपोर्ट",
    totalCommission: "कुल कमीशन",
    vsLastPeriod: "पिछली अवधि की तुलना में",
    searchPlaceholder: "ड्रामा नाम से खोजें...",
    exportCsv: "CSV एक्सपोर्ट करें",
    tabs: { all: "सभी", confirmed: "पुष्ट", pending: "लंबित", rejected: "अस्वीकृत" },
    tableHeaders: ["तारीख", "ड्रामा नाम", "रेफरल लिंक", "यूज़र ID", "ऑर्डर राशि", "दर", "कमीशन", "स्थिति"],
    noRecords: "कोई कमीशन रिकॉर्ड नहीं मिला।",
    pageOf: (page, total) => `पेज ${page} / ${total}`,
    previous: "पिछला",
    next: "अगला",
    statusLabels: { confirmed: "पुष्ट", pending: "लंबित", rejected: "अस्वीकृत" } },
  id: {
    title: "Laporan komisi",
    totalCommission: "Total komisi",
    vsLastPeriod: "vs periode sebelumnya",
    searchPlaceholder: "Cari berdasarkan nama drama...",
    exportCsv: "Ekspor CSV",
    tabs: { all: "Semua", confirmed: "Terkonfirmasi", pending: "Menunggu", rejected: "Ditolak" },
    tableHeaders: ["Tanggal", "Nama drama", "Tautan referral", "ID pengguna", "Jumlah order", "Rasio", "Komisi", "Status"],
    noRecords: "Tidak ada data komisi.",
    pageOf: (page, total) => `Halaman ${page} dari ${total}`,
    previous: "Sebelumnya",
    next: "Berikutnya",
    statusLabels: { confirmed: "Terkonfirmasi", pending: "Menunggu", rejected: "Ditolak" } } };

const DATE_LOCALE_MAP: FlexibleRecord<SupportedLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  pt: "pt-BR",
  hi: "hi-IN",
  id: "id-ID",
  ko: "ko-KR",
  fr: "fr-FR" };

function StatusBadge({ status, label }: { status: Commission["status"]; label: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    rejected: "bg-red-500/20 text-red-400" };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}
    >
      {label}
    </span>
  );
}

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export default function CommissionReportsPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const { token } = useAuth();

  const [data, setData] = useState<CommissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 10;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string | number> = { page, limit };
    if (status !== "all") params.status = status;
    if (search.trim()) params.search = search.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    promoterApi
      .getCommissions(token, params as Parameters<typeof promoterApi.getCommissions>[1])
      .then((res: { data: CommissionsResponse }) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [token, page, status, search, startDate, endDate]);

  const handleExport = () => {
    if (!token) return;
    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const url = promoterApi.exportCommissions(
      token,
      params as Parameters<typeof promoterApi.exportCommissions>[1]
    );
    window.open(url as unknown as string, "_blank");
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-[#0f0f17] text-gray-200 p-6 md:p-10">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>

      {/* Total Commission Summary */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-5 mb-6 max-w-sm">
        <p className="text-gray-400 text-sm mb-1">{t.totalCommission}</p>
        <p className="text-3xl font-bold">
          ${data?.totalCommission?.toFixed(2) ?? "0.00"}
        </p>
        {data?.commissionChange !== undefined && (
          <p
            className={`text-sm mt-1 ${
              data.commissionChange >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {data.commissionChange >= 0 ? "+" : ""}
            {data.commissionChange.toFixed(1)}% {t.vsLastPeriod}
          </p>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500"
        />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500 min-w-[200px]"
        />
        <button
          onClick={handleExport}
          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {t.exportCsv}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatus(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === tab
                ? "bg-purple-600 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-gray-200"
            }`}
          >
              {t.tabs[tab]}
            </button>
          ))}
      </div>

      {/* Data Table */}
      <div className="bg-[#13131d] border border-gray-800/50 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800/30">
              {t.tableHeaders.map(
                (h) => (
                  <th
                    key={h}
                    className="text-gray-400 text-xs uppercase font-medium px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800/30 animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 bg-gray-700/40 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.commissions?.length ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-12">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
              data.commissions.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-gray-800/30 hover:bg-[#1a1a2e]/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(c.date).toLocaleDateString(dateLocale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-sm">{c.dramaName}</td>
                  <td className="px-4 py-3 text-sm text-gray-400" title={c.referralLink}>
                    {truncate(c.referralLink, 24)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400" title={c.userId}>
                    {truncate(c.userId, 10)}
                  </td>
                  <td className="px-4 py-3 text-sm">${c.orderAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{c.commissionRate}%</td>
                  <td className="px-4 py-3 text-sm font-medium">${c.commission.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} label={t.statusLabels[c.status]} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5">
        <p className="text-sm text-gray-500">{t.pageOf(page, totalPages)}</p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1.5 rounded-lg text-sm bg-[#1a1a2e] text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t.previous}
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1.5 rounded-lg text-sm bg-[#1a1a2e] text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}
