"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { subscriptionApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { Footer } from "@/components/features/Footer";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

interface Plan {
  _id: string;
  name: string;
  price: number;
  period: string;
  duration: number;
  durationDays?: number;
  features: string[];
  recommended: boolean;
  savings: string | null;
  monthlyEquivalent: string | null;
}

type SubscriptionCopy = {
  close: string;
  savePercent: (percent: number) => string;
  premiumMember: string;
  vipHeroTitle: string;
  vipHeroDesc: string;
  nonVipHeroTitle: string;
  nonVipHeroDesc: string;
  activeVip: string;
  vipActiveUntil: (date: string) => string;
  vipActiveNoDate: string;
  manageSubscription: string;
  apiUnavailableTitle: string;
  apiUnavailableDesc: string;
  perksTitle: string;
  standardName: string;
  proAnnualName: string;
  bestValue: string;
  selectPlan: string;
  equivalentTo: string;
  restorePurchase: string;
  terms: string;
  privacy: string;
  renewOrCancelNotice: string;
  periodShort: {
    month: string;
    year: string;
  };
  toast: {
    serviceUnavailable: string;
    checkoutFailed: string;
    networkError: string;
    subscribeFailed: string;
  };
  perks: { title: string; desc: string }[];
  standardFeatures: string[];
  proFeatures: string[];
};

const COPY: Record<SupportedLocale, SubscriptionCopy> = {
  en: {
    close: "Close",
    savePercent: (percent) => `Save ${percent}%`,
    premiumMember: "Premium Member",
    vipHeroTitle: "YOU'RE A VIP MEMBER",
    vipHeroDesc: "Manage your subscription or renew your premium membership below.",
    nonVipHeroTitle: "UNLOCK THE ULTIMATE EXPERIENCE",
    nonVipHeroDesc: "Join 2M+ members enjoying premium Asian dramas",
    activeVip: "Active VIP Membership",
    vipActiveUntil: (date) => `Your VIP membership is active until ${date}.`,
    vipActiveNoDate: "Your VIP membership is active.",
    manageSubscription: "Manage Subscription",
    apiUnavailableTitle: "Service is temporarily unavailable. Prices shown are for reference only.",
    apiUnavailableDesc: "Please try again later or contact support if the issue persists.",
    perksTitle: "Membership Perks",
    standardName: "Standard",
    proAnnualName: "Pro Annual",
    bestValue: "Best Value",
    selectPlan: "Select Plan",
    equivalentTo: "Equivalent to",
    restorePurchase: "Restore Purchase",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    renewOrCancelNotice: "Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage or cancel anytime from Account Settings.",
    periodShort: { month: "mo", year: "yr" },
    toast: {
      serviceUnavailable: "Service is temporarily unavailable. Please try again later.",
      checkoutFailed: "Failed to create checkout session",
      networkError: "Unable to connect to the server. Please check your network and try again.",
      subscribeFailed: "Subscription failed. Please try again." },
    perks: [
      { title: "Ad-Free Viewing", desc: "Enjoy uninterrupted cinematic stories" },
      { title: "Early Access", desc: "Watch new episodes 48h before" },
      { title: "4K Ultra HD", desc: "Breathtaking visual quality" },
      { title: "Coin Purchase Discount", desc: "Save on every coin purchase" },
      { title: "30 Free Dramas / Month", desc: "Watch 30 dramas free every month" },
      { title: "50% Off Over Limit", desc: "Half price beyond free monthly quota" },
    ],
    standardFeatures: ["Ad-Free Viewing", "Full HD Streaming", "Coin Purchase Discount", "Cancel anytime"],
    proFeatures: ["All Standard features", "Early Access (48h prior)", "4K Ultra HD & HDR", "30 Free Dramas / Month", "50% Off Over Limit"] },
  zh: {
    close: "关闭",
    savePercent: (percent) => `省 ${percent}%`,
    premiumMember: "尊享会员",
    vipHeroTitle: "你已是 VIP 会员",
    vipHeroDesc: "可在下方管理订阅或续费你的会员服务。",
    nonVipHeroTitle: "解锁极致观剧体验",
    nonVipHeroDesc: "加入 200 万+ 用户，畅享精品短剧",
    activeVip: "VIP 会员有效中",
    vipActiveUntil: (date) => `你的 VIP 有效期至 ${date}。`,
    vipActiveNoDate: "你的 VIP 会员当前有效。",
    manageSubscription: "管理订阅",
    apiUnavailableTitle: "服务暂时不可用，当前价格仅供参考。",
    apiUnavailableDesc: "请稍后重试，如持续异常请联系支持。",
    perksTitle: "会员权益",
    standardName: "标准版",
    proAnnualName: "专业年付",
    bestValue: "最优选择",
    selectPlan: "选择套餐",
    equivalentTo: "折合",
    restorePurchase: "恢复购买",
    terms: "服务条款",
    privacy: "隐私政策",
    renewOrCancelNotice: "订阅将自动续费，除非你在当前周期结束前至少 24 小时取消。你可随时在账号设置中管理或取消。",
    periodShort: { month: "月", year: "年" },
    toast: {
      serviceUnavailable: "服务暂时不可用，请稍后重试。",
      checkoutFailed: "创建结账会话失败",
      networkError: "无法连接服务器，请检查网络后重试。",
      subscribeFailed: "订阅失败，请稍后再试。" },
    perks: [
      { title: "无广告观看", desc: "沉浸式观看，不被打断" },
      { title: "抢先观看", desc: "新剧集提前 48 小时解锁" },
      { title: "4K 超清", desc: "更细腻、更震撼的画质" },
      { title: "金币充值优惠", desc: "每次充值都更省" },
      { title: "每月 30 部免费看", desc: "每月可免费畅看 30 部短剧" },
      { title: "超额部分 5 折", desc: "超出免费额度后半价解锁" },
    ],
    standardFeatures: ["无广告观看", "全高清播放", "金币充值优惠", "可随时取消"],
    proFeatures: ["包含标准版全部权益", "新剧提前 48 小时", "4K 超清与 HDR", "每月 30 部免费看", "超额部分 5 折"] },
  ja: {
    close: "閉じる",
    savePercent: (percent) => `${percent}% お得`,
    premiumMember: "プレミアム会員",
    vipHeroTitle: "VIP会員です",
    vipHeroDesc: "下記でサブスク管理または更新ができます。",
    nonVipHeroTitle: "最高の視聴体験を解放",
    nonVipHeroDesc: "200万人以上の会員と一緒にプレミアム短編ドラマを楽しもう",
    activeVip: "VIP会員が有効です",
    vipActiveUntil: (date) => `VIP会員は ${date} まで有効です。`,
    vipActiveNoDate: "VIP会員は有効です。",
    manageSubscription: "サブスクを管理",
    apiUnavailableTitle: "現在サービスを利用できません。表示価格は参考用です。",
    apiUnavailableDesc: "しばらくしてから再試行するか、サポートへご連絡ください。",
    perksTitle: "会員特典",
    standardName: "スタンダード",
    proAnnualName: "Pro 年間",
    bestValue: "最もお得",
    selectPlan: "プランを選択",
    equivalentTo: "月換算",
    restorePurchase: "購入を復元",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    renewOrCancelNotice: "サブスクリプションは、現在の期間終了の24時間前までに解約しない限り自動更新されます。アカウント設定からいつでも管理・解約できます。",
    periodShort: { month: "月", year: "年" },
    toast: {
      serviceUnavailable: "現在サービスを利用できません。後でもう一度お試しください。",
      checkoutFailed: "チェックアウトセッションの作成に失敗しました",
      networkError: "サーバーに接続できません。ネットワークをご確認ください。",
      subscribeFailed: "購読に失敗しました。時間をおいて再試行してください。" },
    perks: [
      { title: "広告なし視聴", desc: "途切れない視聴体験" },
      { title: "先行アクセス", desc: "新エピソードを48時間先行視聴" },
      { title: "4K Ultra HD", desc: "高精細で美しい映像" },
      { title: "コイン購入割引", desc: "コイン購入ごとに節約" },
      { title: "毎月30作品無料", desc: "毎月30作品を無料で視聴可能" },
      { title: "超過分50%オフ", desc: "無料枠超過後は半額" },
    ],
    standardFeatures: ["広告なし視聴", "フルHD配信", "コイン購入割引", "いつでも解約可能"],
    proFeatures: ["スタンダード特典すべて", "48時間先行アクセス", "4K Ultra HD & HDR", "毎月30作品無料", "超過分50%オフ"] },
  es: {
    close: "Cerrar",
    savePercent: (percent) => `Ahorra ${percent}%`,
    premiumMember: "Miembro premium",
    vipHeroTitle: "YA ERES MIEMBRO VIP",
    vipHeroDesc: "Gestiona o renueva tu suscripción abajo.",
    nonVipHeroTitle: "DESBLOQUEA LA EXPERIENCIA DEFINITIVA",
    nonVipHeroDesc: "Únete a más de 2M de miembros que disfrutan dramas premium",
    activeVip: "Membresía VIP activa",
    vipActiveUntil: (date) => `Tu membresía VIP está activa hasta ${date}.`,
    vipActiveNoDate: "Tu membresía VIP está activa.",
    manageSubscription: "Gestionar suscripción",
    apiUnavailableTitle: "Servicio temporalmente no disponible. Los precios son de referencia.",
    apiUnavailableDesc: "Inténtalo de nuevo más tarde o contacta soporte.",
    perksTitle: "Beneficios",
    standardName: "Estándar",
    proAnnualName: "Pro Anual",
    bestValue: "Mejor opción",
    selectPlan: "Seleccionar plan",
    equivalentTo: "Equivale a",
    restorePurchase: "Restaurar compra",
    terms: "Términos del servicio",
    privacy: "Política de privacidad",
    renewOrCancelNotice: "La suscripción se renueva automáticamente salvo cancelación al menos 24 horas antes del fin del período actual. Puedes gestionarla o cancelarla en Configuración.",
    periodShort: { month: "mes", year: "año" },
    toast: {
      serviceUnavailable: "Servicio temporalmente no disponible. Inténtalo más tarde.",
      checkoutFailed: "No se pudo crear la sesión de pago",
      networkError: "No se pudo conectar con el servidor. Revisa tu red e inténtalo de nuevo.",
      subscribeFailed: "Falló la suscripción. Inténtalo nuevamente." },
    perks: [
      { title: "Sin anuncios", desc: "Disfruta historias sin interrupciones" },
      { title: "Acceso anticipado", desc: "Nuevos episodios 48h antes" },
      { title: "4K Ultra HD", desc: "Calidad visual impresionante" },
      { title: "Descuento en monedas", desc: "Ahorra en cada recarga" },
      { title: "30 dramas gratis/mes", desc: "Mira 30 dramas gratis al mes" },
      { title: "50% fuera del cupo", desc: "Mitad de precio al superar el cupo" },
    ],
    standardFeatures: ["Sin anuncios", "Streaming Full HD", "Descuento en monedas", "Cancela cuando quieras"],
    proFeatures: ["Todo lo del plan estándar", "Acceso anticipado (48h)", "4K Ultra HD y HDR", "30 dramas gratis/mes", "50% fuera del cupo"] },
  pt: {
    close: "Fechar",
    savePercent: (percent) => `Economize ${percent}%`,
    premiumMember: "Membro premium",
    vipHeroTitle: "VOCÊ É MEMBRO VIP",
    vipHeroDesc: "Gerencie ou renove sua assinatura abaixo.",
    nonVipHeroTitle: "DESBLOQUEIE A EXPERIÊNCIA MÁXIMA",
    nonVipHeroDesc: "Junte-se a mais de 2M de membros assistindo dramas premium",
    activeVip: "Assinatura VIP ativa",
    vipActiveUntil: (date) => `Sua assinatura VIP está ativa até ${date}.`,
    vipActiveNoDate: "Sua assinatura VIP está ativa.",
    manageSubscription: "Gerenciar assinatura",
    apiUnavailableTitle: "Serviço temporariamente indisponível. Preços exibidos apenas como referência.",
    apiUnavailableDesc: "Tente novamente mais tarde ou fale com o suporte.",
    perksTitle: "Benefícios",
    standardName: "Padrão",
    proAnnualName: "Pro Anual",
    bestValue: "Melhor custo-benefício",
    selectPlan: "Selecionar plano",
    equivalentTo: "Equivale a",
    restorePurchase: "Restaurar compra",
    terms: "Termos de serviço",
    privacy: "Política de privacidade",
    renewOrCancelNotice: "A assinatura renova automaticamente, a menos que seja cancelada pelo menos 24 horas antes do fim do período atual. Você pode gerenciar ou cancelar em Configurações.",
    periodShort: { month: "mês", year: "ano" },
    toast: {
      serviceUnavailable: "Serviço temporariamente indisponível. Tente novamente mais tarde.",
      checkoutFailed: "Falha ao criar sessão de checkout",
      networkError: "Não foi possível conectar ao servidor. Verifique sua rede e tente novamente.",
      subscribeFailed: "Falha na assinatura. Tente novamente." },
    perks: [
      { title: "Sem anúncios", desc: "Assista sem interrupções" },
      { title: "Acesso antecipado", desc: "Novos episódios 48h antes" },
      { title: "4K Ultra HD", desc: "Qualidade visual impressionante" },
      { title: "Desconto em moedas", desc: "Economize em cada compra" },
      { title: "30 dramas grátis/mês", desc: "Assista 30 dramas grátis por mês" },
      { title: "50% acima do limite", desc: "Metade do preço após o limite" },
    ],
    standardFeatures: ["Sem anúncios", "Streaming Full HD", "Desconto em moedas", "Cancele quando quiser"],
    proFeatures: ["Todos os recursos do Padrão", "Acesso antecipado (48h)", "4K Ultra HD e HDR", "30 dramas grátis/mês", "50% acima do limite"] },
  hi: {
    close: "बंद करें",
    savePercent: (percent) => `${percent}% बचत`,
    premiumMember: "प्रीमियम सदस्य",
    vipHeroTitle: "आप VIP सदस्य हैं",
    vipHeroDesc: "नीचे अपनी सदस्यता मैनेज या रिन्यू करें।",
    nonVipHeroTitle: "अल्टिमेट अनुभव अनलॉक करें",
    nonVipHeroDesc: "2M+ सदस्यों के साथ प्रीमियम ड्रामा देखें",
    activeVip: "VIP सदस्यता सक्रिय",
    vipActiveUntil: (date) => `आपकी VIP सदस्यता ${date} तक सक्रिय है।`,
    vipActiveNoDate: "आपकी VIP सदस्यता सक्रिय है।",
    manageSubscription: "सदस्यता प्रबंधित करें",
    apiUnavailableTitle: "सेवा अस्थायी रूप से उपलब्ध नहीं है। दिखी कीमतें केवल संदर्भ के लिए हैं।",
    apiUnavailableDesc: "कृपया बाद में फिर प्रयास करें या सपोर्ट से संपर्क करें।",
    perksTitle: "सदस्य लाभ",
    standardName: "स्टैंडर्ड",
    proAnnualName: "प्रो वार्षिक",
    bestValue: "सर्वश्रेष्ठ विकल्प",
    selectPlan: "प्लान चुनें",
    equivalentTo: "के बराबर",
    restorePurchase: "खरीद पुनर्स्थापित करें",
    terms: "सेवा की शर्तें",
    privacy: "गोपनीयता नीति",
    renewOrCancelNotice: "सब्सक्रिप्शन अपने आप नवीनीकृत होता है, जब तक कि वर्तमान अवधि समाप्त होने से कम से कम 24 घंटे पहले रद्द न किया जाए। आप इसे अकाउंट सेटिंग्स से कभी भी मैनेज या रद्द कर सकते हैं।",
    periodShort: { month: "माह", year: "वर्ष" },
    toast: {
      serviceUnavailable: "सेवा अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।",
      checkoutFailed: "चेकआउट सत्र बनाना विफल रहा",
      networkError: "सर्वर से कनेक्ट नहीं हो सका। कृपया नेटवर्क जांचें।",
      subscribeFailed: "सदस्यता विफल रही। कृपया पुनः प्रयास करें।" },
    perks: [
      { title: "बिना विज्ञापन", desc: "बिना रुकावट देखें" },
      { title: "अर्ली एक्सेस", desc: "नए एपिसोड 48 घंटे पहले" },
      { title: "4K Ultra HD", desc: "बेहतरीन विज़ुअल क्वालिटी" },
      { title: "कॉइन खरीद छूट", desc: "हर कॉइन खरीद में बचत" },
      { title: "30 ड्रामा मुफ्त/माह", desc: "हर माह 30 ड्रामा मुफ्त देखें" },
      { title: "सीमा के बाद 50% छूट", desc: "मासिक मुफ्त सीमा के बाद आधी कीमत" },
    ],
    standardFeatures: ["बिना विज्ञापन", "Full HD स्ट्रीमिंग", "कॉइन खरीद छूट", "कभी भी रद्द करें"],
    proFeatures: ["स्टैंडर्ड के सभी लाभ", "48 घंटे अर्ली एक्सेस", "4K Ultra HD और HDR", "30 ड्रामा मुफ्त/माह", "सीमा के बाद 50% छूट"] },
  id: {
    close: "Tutup",
    savePercent: (percent) => `Hemat ${percent}%`,
    premiumMember: "Anggota premium",
    vipHeroTitle: "KAMU ANGGOTA VIP",
    vipHeroDesc: "Kelola atau perpanjang langgananmu di bawah.",
    nonVipHeroTitle: "BUKA PENGALAMAN TERBAIK",
    nonVipHeroDesc: "Gabung dengan 2M+ member menikmati drama premium",
    activeVip: "Keanggotaan VIP aktif",
    vipActiveUntil: (date) => `Keanggotaan VIP kamu aktif hingga ${date}.`,
    vipActiveNoDate: "Keanggotaan VIP kamu aktif.",
    manageSubscription: "Kelola langganan",
    apiUnavailableTitle: "Layanan sementara tidak tersedia. Harga hanya sebagai referensi.",
    apiUnavailableDesc: "Coba lagi nanti atau hubungi dukungan.",
    perksTitle: "Keuntungan member",
    standardName: "Standar",
    proAnnualName: "Pro Tahunan",
    bestValue: "Paling hemat",
    selectPlan: "Pilih paket",
    equivalentTo: "Setara",
    restorePurchase: "Pulihkan pembelian",
    terms: "Syarat layanan",
    privacy: "Kebijakan privasi",
    renewOrCancelNotice: "Langganan diperpanjang otomatis kecuali dibatalkan minimal 24 jam sebelum periode saat ini berakhir. Kamu bisa kelola atau batalkan kapan saja dari Pengaturan Akun.",
    periodShort: { month: "bln", year: "thn" },
    toast: {
      serviceUnavailable: "Layanan sementara tidak tersedia. Coba lagi nanti.",
      checkoutFailed: "Gagal membuat sesi checkout",
      networkError: "Tidak dapat terhubung ke server. Periksa jaringan lalu coba lagi.",
      subscribeFailed: "Langganan gagal. Silakan coba lagi." },
    perks: [
      { title: "Tanpa iklan", desc: "Nikmati cerita tanpa gangguan" },
      { title: "Akses lebih awal", desc: "Tonton episode baru 48 jam lebih cepat" },
      { title: "4K Ultra HD", desc: "Kualitas visual memukau" },
      { title: "Diskon pembelian koin", desc: "Hemat di setiap pembelian koin" },
      { title: "30 drama gratis/bulan", desc: "Tonton 30 drama gratis tiap bulan" },
      { title: "Diskon 50% di atas batas", desc: "Harga setengah setelah kuota gratis habis" },
    ],
    standardFeatures: ["Tanpa iklan", "Streaming Full HD", "Diskon pembelian koin", "Bisa batal kapan saja"],
    proFeatures: ["Semua fitur Standar", "Akses lebih awal (48 jam)", "4K Ultra HD & HDR", "30 drama gratis/bulan", "Diskon 50% di atas batas"] } };

const PERK_ICONS = [
  "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 12.75h.008v.008H12v-.008zm0 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m0-3.75h.008v.008H12v-.008z",
  "M9 14.25l3-3m0 0l3 3m-3-3v8.25M3.75 6.75h16.5",
] as const;

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  pt: "pt-BR",
  hi: "hi-IN",
  id: "id-ID" };

export default function SubscriptionPage() {
  const locale = useLocale();
  const t = COPY[locale] || COPY.en;
  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const formatUsd = useCallback(
    (value: number) =>
      new Intl.NumberFormat(dateLocale, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 }).format(value),
    [dateLocale]
  );

  const { user, token } = useAuth();
  const { loading: authLoading } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("sp2");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const plansRes = await subscriptionApi.getPlans();
        const rawPlans = plansRes.data || [];
        const normalized: Plan[] = rawPlans.map((p: any) => {
          const days = p.durationDays || p.duration || 30;
          const isYearly = days >= 365;
          const apiSavingsValue = Number.parseFloat(String(p.savings || "").replace(/[^\d.]/g, ""));
          const savingsLabel = isYearly
            ? (Number.isFinite(apiSavingsValue) ? t.savePercent(Math.round(apiSavingsValue)) : t.savePercent(16))
            : null;
          const monthlyEquivalentLabel = isYearly
            ? `${formatUsd(p.price / 12)}/${t.periodShort.month}`
            : null;
          return {
            _id: p._id,
            name: locale === "en" && p.name ? p.name : (isYearly ? t.proAnnualName : t.standardName),
            price: p.price,
            period: p.period || (isYearly ? "year" : "month"),
            duration: days,
            durationDays: days,
            features: locale === "en" && p.features?.length ? p.features : (isYearly ? t.proFeatures : t.standardFeatures),
            recommended: p.recommended ?? isYearly,
            savings: savingsLabel,
            monthlyEquivalent: monthlyEquivalentLabel };
        });
        setPlans(normalized);
        setApiAvailable(true);
        if (normalized.length) {
          const rec = normalized.find((p: Plan) => p.recommended);
          if (rec) setSelectedPlan(rec._id);
        }
      } catch {
        setApiAvailable(false);
        setPlans([
          { _id: "sp1", name: t.standardName, price: 9.99, period: "month", duration: 30, features: t.standardFeatures, recommended: false, savings: null, monthlyEquivalent: null },
          { _id: "sp2", name: t.proAnnualName, price: 99.99, period: "year", duration: 365, features: t.proFeatures, recommended: true, savings: t.savePercent(16), monthlyEquivalent: `${formatUsd(99.99 / 12)}/${t.periodShort.month}` },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, locale, t, formatUsd]);

  const handleSubscribe = async (planId: string) => {
    if (!token) return;
    if (!apiAvailable) {
      toast(t.toast.serviceUnavailable, "error");
      return;
    }
    setSelectedPlan(planId);
    setProcessing(true);
    try {
      const res = await subscriptionApi.subscribe(token, planId, "stripe");
      const checkoutUrl = res.data?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        toast(t.toast.checkoutFailed, "error");
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const message = raw === "Failed to fetch" ? t.toast.networkError : raw || t.toast.subscribeFailed;
      toast(message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const isVip = user?.vipStatus === "active";

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const standardPlan = plans.find((p) => !p.recommended) || plans[0];
  const proPlan = plans.find((p) => p.recommended) || plans[1];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      <style jsx>{`
        @keyframes goldShine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gold-text {
          background: linear-gradient(90deg, #D4AF37 0%, #FFF8DC 30%, #D4AF37 60%, #FFF8DC 80%, #D4AF37 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: goldShine 3s linear infinite;
        }
      `}</style>
      <Navbar />

      <button onClick={() => router.back()} className="fixed top-24 right-6 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition" aria-label={t.close}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="absolute top-0 left-0 right-0 h-72 overflow-hidden pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(180,140,40,0.15) 0%, rgba(180,140,40,0.05) 40%, transparent 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(180,140,40,0.08) 0px, rgba(180,140,40,0.08) 1px, transparent 1px, transparent 40px)", backgroundSize: "40px 100%" }} />
        </div>

        <div className="relative text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 border border-yellow-500/30 mb-5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
            <span className="text-xs font-bold tracking-widest text-yellow-400 uppercase">{t.premiumMember}</span>
          </div>
          {isVip ? (
            <>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-3"><span className="gold-text">{t.vipHeroTitle}</span></h1>
              <p className="text-gray-400 max-w-lg mx-auto">{t.vipHeroDesc}</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight mb-3"><span className="gold-text">{t.nonVipHeroTitle}</span></h1>
              <p className="text-gray-400 max-w-lg mx-auto">{t.nonVipHeroDesc}</p>
            </>
          )}
        </div>

        {isVip && (
          <div className="mb-14 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-950/10 p-8 text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
                <span className="text-lg font-bold text-yellow-400">{t.activeVip}</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {user.vipExpireDate
                  ? t.vipActiveUntil(new Date(user.vipExpireDate).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" }))
                  : t.vipActiveNoDate}
              </p>
              <Link href={localizePath("/user/settings", locale)} className="mt-6 inline-block rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                {t.manageSubscription}
              </Link>
            </div>
          </div>
        )}

        {!apiAvailable && !isVip && (
          <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-6 py-4 text-center">
            <p className="text-sm text-yellow-400 font-medium">{t.apiUnavailableTitle}</p>
            <p className="text-xs text-gray-400 mt-1">{t.apiUnavailableDesc}</p>
          </div>
        )}

        {!isVip && (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_1fr] gap-6 items-stretch">
            <div className="lg:pt-4">
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-5">{t.perksTitle}</p>
              <div className="space-y-5">
                {t.perks.map((perk, idx) => (
                  <div key={`${perk.title}-${idx}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={PERK_ICONS[idx] || PERK_ICONS[0]} /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{perk.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {standardPlan && (
              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#12121a] p-7">
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">{t.standardName}</p>
                <div className="mb-1">
                  <span className="text-4xl font-black text-white">${standardPlan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/{standardPlan.period === "month" ? t.periodShort.month : t.periodShort.year}</span>
                </div>
                <div className="h-3" />
                <ul className="space-y-3 flex-1">
                  {t.standardFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <svg className="w-4 h-4 shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(standardPlan._id)}
                  disabled={processing && selectedPlan === standardPlan._id}
                  className="mt-8 w-full h-12 rounded-xl border border-white/20 bg-transparent text-sm font-bold text-white uppercase tracking-wider hover:bg-white/5 transition disabled:opacity-50"
                >
                  {processing && selectedPlan === standardPlan._id ? (
                    <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : t.selectPlan}
                </button>
              </div>
            )}

            {proPlan && (
              <div className="relative flex flex-col rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-900/10 to-[#12121a] p-7" style={{ boxShadow: "0 0 40px rgba(180,140,40,0.08)" }}>
                {proPlan.savings && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[10px] font-bold rounded-full whitespace-nowrap uppercase tracking-wider">
                    {t.bestValue} · {proPlan.savings}
                  </span>
                )}
                <p className="text-[10px] font-bold tracking-[0.2em] text-yellow-400 uppercase mb-4">{t.proAnnualName}</p>
                <div className="mb-1">
                  <span className="text-4xl font-black text-white">${proPlan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/{proPlan.period === "year" ? t.periodShort.year : t.periodShort.month}</span>
                </div>
                {proPlan.monthlyEquivalent ? (
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{t.equivalentTo} {proPlan.monthlyEquivalent}</p>
                ) : <div className="h-4" />}
                <ul className="space-y-3 mt-4 flex-1">
                  {t.proFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <svg className="w-4 h-4 shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(proPlan._id)}
                  disabled={processing && selectedPlan === proPlan._id}
                  className="mt-8 w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white uppercase tracking-wider transition disabled:opacity-50"
                >
                  {processing && selectedPlan === proPlan._id ? (
                    <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : t.selectPlan}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-8 text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase">
            <button className="hover:text-white transition">{t.restorePurchase}</button>
            <Link href={`${localizePath("/help", locale)}?tab=terms`} className="hover:text-white transition">{t.terms}</Link>
            <Link href={`${localizePath("/help", locale)}?tab=privacy`} className="hover:text-white transition">{t.privacy}</Link>
          </div>
          <p className="text-[11px] text-gray-600 text-center max-w-xl leading-relaxed">{t.renewOrCancelNotice}</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
