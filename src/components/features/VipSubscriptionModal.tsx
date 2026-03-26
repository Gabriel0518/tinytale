"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Crown, Check, Sparkles, Tv, Zap, Download, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";

interface VipPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  monthlyEquivalent?: string;
  features: string[];
  bestValue?: boolean;
  savings?: string;
}

interface VipSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => void;
}

type VipCopy = {
  title: string;
  subtitle: string;
  monthly: string;
  annual: string;
  month: string;
  year: string;
  bestValue: string;
  save16: string;
  monthlyEquivalent: string;
  everythingInMonthly: string;
  unlimited: string;
  adFree: string;
  hdQuality: string;
  earlyAccess: string;
  downloadOffline: string;
  exclusiveVip: string;
  bonusCoins: string;
  adFreeViewing: string;
  ultraQuality: string;
  prioritySupport: string;
  subscribeNow: string;
  cancelAnytime: string;
};

const COPY: FlexibleRecord<SupportedLocale, VipCopy> = {
  en: {
    title: "Upgrade to VIP",
    subtitle: "Unlock premium content and features",
    monthly: "Monthly",
    annual: "Annual",
    month: "/month",
    year: "/year",
    bestValue: "Best Value",
    save16: "Save 16%",
    monthlyEquivalent: "Equivalent to $8.33/month",
    everythingInMonthly: "Everything in Monthly",
    unlimited: "Unlimited access to all dramas",
    adFree: "Ad-free experience",
    hdQuality: "HD quality streaming",
    earlyAccess: "Early access to new releases",
    downloadOffline: "Download for offline",
    exclusiveVip: "Exclusive VIP content",
    bonusCoins: "500 bonus coins/month",
    adFreeViewing: "Ad-free viewing",
    ultraQuality: "4K quality streaming",
    prioritySupport: "Priority customer support",
    subscribeNow: "Subscribe Now",
    cancelAnytime: "Cancel anytime. By subscribing you agree to our Terms of Service and Privacy Policy.",
  },
  zh: {
    title: "升级到 VIP",
    subtitle: "解锁高级内容与专属权益",
    monthly: "月度",
    annual: "年度",
    month: "/月",
    year: "/年",
    bestValue: "最划算",
    save16: "立省 16%",
    monthlyEquivalent: "约合 $8.33/月",
    everythingInMonthly: "包含月度权益全部内容",
    unlimited: "无限观看全部短剧",
    adFree: "无广告体验",
    hdQuality: "高清画质播放",
    earlyAccess: "抢先观看新内容",
    downloadOffline: "支持离线下载",
    exclusiveVip: "专属 VIP 内容",
    bonusCoins: "每月赠送 500 金币",
    adFreeViewing: "无广告观看",
    ultraQuality: "4K 高画质播放",
    prioritySupport: "优先客服支持",
    subscribeNow: "立即订阅",
    cancelAnytime: "可随时取消。订阅即表示你同意我们的服务条款和隐私政策。",
  },
  ja: {
    title: "VIP にアップグレード",
    subtitle: "プレミアム作品と特典を解放",
    monthly: "月額",
    annual: "年額",
    month: "/月",
    year: "/年",
    bestValue: "おすすめ",
    save16: "16% お得",
    monthlyEquivalent: "$8.33/月 相当",
    everythingInMonthly: "月額プランの内容をすべて含む",
    unlimited: "すべてのドラマを見放題",
    adFree: "広告なし体験",
    hdQuality: "HD 高画質ストリーミング",
    earlyAccess: "新作を先行視聴",
    downloadOffline: "オフライン保存",
    exclusiveVip: "VIP 限定コンテンツ",
    bonusCoins: "毎月 500 ボーナスコイン",
    adFreeViewing: "広告なし視聴",
    ultraQuality: "4K 高画質ストリーミング",
    prioritySupport: "優先カスタマーサポート",
    subscribeNow: "今すぐ購読",
    cancelAnytime: "いつでも解約できます。購読すると利用規約とプライバシーポリシーに同意したものとみなされます。",
  },
  es: {
    title: "Hazte VIP",
    subtitle: "Desbloquea contenido y funciones premium",
    monthly: "Mensual",
    annual: "Anual",
    month: "/mes",
    year: "/año",
    bestValue: "Mejor valor",
    save16: "Ahorra 16%",
    monthlyEquivalent: "Equivale a $8.33/mes",
    everythingInMonthly: "Todo lo incluido en Mensual",
    unlimited: "Acceso ilimitado a todos los dramas",
    adFree: "Experiencia sin anuncios",
    hdQuality: "Streaming en calidad HD",
    earlyAccess: "Acceso anticipado a nuevos estrenos",
    downloadOffline: "Descarga para ver sin conexión",
    exclusiveVip: "Contenido VIP exclusivo",
    bonusCoins: "500 monedas extra/mes",
    adFreeViewing: "Visualización sin anuncios",
    ultraQuality: "Streaming en calidad 4K",
    prioritySupport: "Atención prioritaria",
    subscribeNow: "Suscribirse ahora",
    cancelAnytime: "Cancela cuando quieras. Al suscribirte aceptas nuestros Términos y Política de Privacidad.",
  },
  pt: {
    title: "Fazer upgrade para VIP",
    subtitle: "Desbloqueie conteúdo e benefícios premium",
    monthly: "Mensal",
    annual: "Anual",
    month: "/mês",
    year: "/ano",
    bestValue: "Melhor oferta",
    save16: "Economize 16%",
    monthlyEquivalent: "Equivale a $8.33/mês",
    everythingInMonthly: "Tudo do plano mensal",
    unlimited: "Acesso ilimitado a todos os dramas",
    adFree: "Experiência sem anúncios",
    hdQuality: "Streaming em HD",
    earlyAccess: "Acesso antecipado a lançamentos",
    downloadOffline: "Baixar para assistir offline",
    exclusiveVip: "Conteúdo VIP exclusivo",
    bonusCoins: "500 moedas bônus/mês",
    adFreeViewing: "Visualização sem anúncios",
    ultraQuality: "Streaming em 4K",
    prioritySupport: "Suporte prioritário",
    subscribeNow: "Assinar agora",
    cancelAnytime: "Cancele quando quiser. Ao assinar, você concorda com nossos Termos e Política de Privacidade.",
  },
  hi: {
    title: "VIP में अपग्रेड करें",
    subtitle: "प्रीमियम कंटेंट और फीचर्स अनलॉक करें",
    monthly: "मासिक",
    annual: "वार्षिक",
    month: "/माह",
    year: "/वर्ष",
    bestValue: "सबसे बेहतर",
    save16: "16% बचत",
    monthlyEquivalent: "$8.33/माह के बराबर",
    everythingInMonthly: "मासिक प्लान की सभी सुविधाएँ",
    unlimited: "सभी ड्रामा का अनलिमिटेड एक्सेस",
    adFree: "बिना विज्ञापन अनुभव",
    hdQuality: "HD क्वालिटी स्ट्रीमिंग",
    earlyAccess: "नई रिलीज़ का जल्दी एक्सेस",
    downloadOffline: "ऑफलाइन डाउनलोड",
    exclusiveVip: "एक्सक्लूसिव VIP कंटेंट",
    bonusCoins: "500 बोनस कॉइन्स/माह",
    adFreeViewing: "बिना विज्ञापन देखना",
    ultraQuality: "4K क्वालिटी स्ट्रीमिंग",
    prioritySupport: "प्राथमिक ग्राहक सहायता",
    subscribeNow: "अभी सदस्यता लें",
    cancelAnytime: "कभी भी रद्द करें। सदस्यता लेकर आप हमारी सेवा शर्तों और गोपनीयता नीति से सहमत होते हैं।",
  },
  id: {
    title: "Upgrade ke VIP",
    subtitle: "Buka konten dan fitur premium",
    monthly: "Bulanan",
    annual: "Tahunan",
    month: "/bulan",
    year: "/tahun",
    bestValue: "Paling hemat",
    save16: "Hemat 16%",
    monthlyEquivalent: "Setara $8.33/bulan",
    everythingInMonthly: "Semua yang ada di paket bulanan",
    unlimited: "Akses tanpa batas ke semua drama",
    adFree: "Pengalaman tanpa iklan",
    hdQuality: "Streaming kualitas HD",
    earlyAccess: "Akses awal ke rilisan baru",
    downloadOffline: "Unduh untuk offline",
    exclusiveVip: "Konten VIP eksklusif",
    bonusCoins: "500 koin bonus/bulan",
    adFreeViewing: "Menonton tanpa iklan",
    ultraQuality: "Streaming kualitas 4K",
    prioritySupport: "Dukungan pelanggan prioritas",
    subscribeNow: "Berlangganan sekarang",
    cancelAnytime: "Batalkan kapan saja. Dengan berlangganan, kamu menyetujui Syarat Layanan dan Kebijakan Privasi kami.",
  },
};

export function VipSubscriptionModal({ open, onClose, onSubscribe }: VipSubscriptionModalProps) {
  const [selected, setSelected] = useState("annual");
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);

  const plans: VipPlan[] = [
    {
      id: "monthly",
      name: t.monthly,
      price: 9.99,
      period: t.month,
      features: [t.unlimited, t.adFree, t.hdQuality],
    },
    {
      id: "annual",
      name: t.annual,
      price: 99.99,
      period: t.year,
      bestValue: true,
      savings: t.save16,
      monthlyEquivalent: t.monthlyEquivalent,
      features: [
        t.everythingInMonthly,
        t.earlyAccess,
        t.downloadOffline,
        t.exclusiveVip,
        t.bonusCoins,
      ],
    },
  ];

  const perks = [
    { icon: Tv, label: t.adFreeViewing },
    { icon: Sparkles, label: t.ultraQuality },
    { icon: Zap, label: t.earlyAccess },
    { icon: Download, label: t.downloadOffline },
    { icon: Star, label: t.exclusiveVip },
    { icon: Shield, label: t.prioritySupport },
  ];

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
          <Crown size={28} className="text-black" />
        </div>
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
        <p className="mt-1 text-sm text-gray-400">{t.subtitle}</p>
      </div>

      {/* Perks List */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        {perks.map((perk) => (
          <div key={perk.label} className="flex items-center gap-2 rounded-lg bg-gray-800/50 px-3 py-2">
            <perk.icon size={16} className="shrink-0 text-yellow-500" />
            <span className="text-xs text-gray-300">{perk.label}</span>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="mb-6 space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            aria-pressed={selected === plan.id}
            className={cn(
              "relative w-full rounded-xl border p-4 text-left transition",
              selected === plan.id
                ? plan.bestValue
                  ? "border-yellow-500 bg-yellow-500/5 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "border-yellow-500 bg-yellow-500/5"
                : "border-white/10 bg-gray-800/30 hover:border-white/20"
            )}
          >
            {plan.bestValue && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-0.5 text-xs font-semibold text-black">
                {t.bestValue}
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{plan.name}</span>
                  {plan.savings && (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                {plan.monthlyEquivalent && (
                  <p className="mt-0.5 text-xs text-gray-500">{plan.monthlyEquivalent}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2",
                  selected === plan.id ? "border-yellow-500 bg-yellow-500" : "border-white/20"
                )}
              >
                {selected === plan.id && <Check size={14} className="text-black" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>Stripe</span>
        <span>PayPal</span>
        <span>Apple Pay</span>
      </div>

      <button
        onClick={() => onSubscribe?.(selected)}
        className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 font-semibold text-black transition hover:opacity-90"
      >
        {t.subscribeNow}
      </button>
      <p className="mt-3 text-center text-xs text-gray-500">
        {t.cancelAnytime}
      </p>
    </Modal>
  );
}
