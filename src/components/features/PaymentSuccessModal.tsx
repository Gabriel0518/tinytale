"use client";

import React from "react";
import { SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from "@/lib/locale-copy";

type PaymentSuccessCopy = {
  closeDialog: string;
  title: string;
  coinsAdded: (coins: number) => string;
  vipActive: string;
  amountPaid: string;
  transactionId: string;
  updatedBalance: string;
  coinsUnit: string;
  backToStore: string;
  startWatching: string;
};

const COPY: FlexibleRecord<SupportedLocale, PaymentSuccessCopy> = {
  en: {
    closeDialog: "Close dialog",
    title: "Payment Successful!",
    coinsAdded: (coins) => `${coins.toLocaleString()} gold coins have been added to your account`,
    vipActive: "Your VIP subscription is now active. Enjoy premium content!",
    amountPaid: "Amount paid:",
    transactionId: "Transaction ID",
    updatedBalance: "Updated Balance",
    coinsUnit: "coins",
    backToStore: "Back to Store",
    startWatching: "Start Watching",
  },
  zh: {
    closeDialog: "关闭弹窗",
    title: "支付成功",
    coinsAdded: (coins) => `${coins.toLocaleString()} 金币已充值到你的账户`,
    vipActive: "你的 VIP 订阅已生效，开始畅享高级内容。",
    amountPaid: "实付金额：",
    transactionId: "交易编号",
    updatedBalance: "最新余额",
    coinsUnit: "金币",
    backToStore: "返回商城",
    startWatching: "开始观看",
  },
  ja: {
    closeDialog: "ダイアログを閉じる",
    title: "支払い成功",
    coinsAdded: (coins) => `${coins.toLocaleString()} コインがアカウントに追加されました`,
    vipActive: "VIP サブスクリプションが有効になりました。プレミアム作品をお楽しみください。",
    amountPaid: "支払い金額:",
    transactionId: "取引 ID",
    updatedBalance: "最新残高",
    coinsUnit: "コイン",
    backToStore: "ストアに戻る",
    startWatching: "視聴を開始",
  },
  es: {
    closeDialog: "Cerrar diálogo",
    title: "Pago exitoso",
    coinsAdded: (coins) => `Se agregaron ${coins.toLocaleString()} monedas a tu cuenta`,
    vipActive: "Tu suscripción VIP ya está activa. Disfruta del contenido premium.",
    amountPaid: "Importe pagado:",
    transactionId: "ID de transacción",
    updatedBalance: "Saldo actualizado",
    coinsUnit: "monedas",
    backToStore: "Volver a la tienda",
    startWatching: "Empezar a ver",
  },
  pt: {
    closeDialog: "Fechar diálogo",
    title: "Pagamento concluído",
    coinsAdded: (coins) => `${coins.toLocaleString()} moedas foram adicionadas à sua conta`,
    vipActive: "Sua assinatura VIP já está ativa. Aproveite o conteúdo premium.",
    amountPaid: "Valor pago:",
    transactionId: "ID da transação",
    updatedBalance: "Saldo atualizado",
    coinsUnit: "moedas",
    backToStore: "Voltar à loja",
    startWatching: "Começar a assistir",
  },
  hi: {
    closeDialog: "डायलॉग बंद करें",
    title: "भुगतान सफल",
    coinsAdded: (coins) => `${coins.toLocaleString()} गोल्ड कॉइन्स आपके खाते में जोड़ दिए गए हैं`,
    vipActive: "आपकी VIP सदस्यता अब सक्रिय है। प्रीमियम कंटेंट का आनंद लें।",
    amountPaid: "भुगतान राशि:",
    transactionId: "लेनदेन आईडी",
    updatedBalance: "नया बैलेंस",
    coinsUnit: "कॉइन्स",
    backToStore: "स्टोर पर वापस जाएँ",
    startWatching: "देखना शुरू करें",
  },
  id: {
    closeDialog: "Tutup dialog",
    title: "Pembayaran berhasil",
    coinsAdded: (coins) => `${coins.toLocaleString()} koin emas telah ditambahkan ke akunmu`,
    vipActive: "Langganan VIP kamu sekarang aktif. Nikmati konten premium.",
    amountPaid: "Jumlah dibayar:",
    transactionId: "ID transaksi",
    updatedBalance: "Saldo terbaru",
    coinsUnit: "koin",
    backToStore: "Kembali ke toko",
    startWatching: "Mulai menonton",
  },
};

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  amount?: number;
  coins?: number;
  transactionId?: string;
  newBalance?: number;
  type?: "coins" | "subscription";
  onNavigate?: (target: "player" | "store") => void;
}

export function PaymentSuccessModal({
  open,
  onClose,
  amount,
  coins,
  transactionId,
  newBalance,
  type = "coins",
  onNavigate,
}: PaymentSuccessModalProps) {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Glass Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-xl p-8 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
        <style jsx>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes strokeDraw { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
          @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 35px rgba(34,197,94,0.5); } }
        `}</style>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition" aria-label={t.closeDialog}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Success Icon with Glow */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20" style={{ animation: "glowPulse 2s ease-in-out infinite" }}>
            <svg className="h-10 w-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "strokeDraw 0.6s ease-out" }} />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>

          {/* Description */}
          {type === "coins" ? (
            <p className="text-gray-400">
              {t.coinsAdded(coins || 0)}
            </p>
          ) : (
            <p className="text-gray-400">{t.vipActive}</p>
          )}

          {/* Amount */}
          {amount != null && (
            <p className="mt-2 text-sm text-gray-500">{t.amountPaid} <span className="text-white font-medium">${amount.toFixed(2)}</span></p>
          )}

          {/* Transaction ID */}
          {transactionId && (
            <div className="mt-3 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <p className="text-xs text-gray-500">{t.transactionId}</p>
              <p className="font-mono text-sm text-gray-300 select-all">{transactionId}</p>
            </div>
          )}

          {/* Balance Card */}
          {newBalance != null && (
            <div className="group mt-4 w-full px-5 py-4 rounded-xl bg-white/5 backdrop-blur border border-white/5 hover:border-yellow-500/30 transition-colors">
              <p className="text-xs text-gray-500 mb-1">{t.updatedBalance}</p>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="url(#scGrad)" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">G</text><defs><linearGradient id="scGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs></svg>
                <span className="text-2xl font-bold text-yellow-400">{newBalance.toLocaleString()}</span>
                <span className="text-sm text-gray-500">{t.coinsUnit}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-7 flex w-full gap-3">
            <button
              onClick={() => onNavigate?.("store")}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white hover:bg-white/5 transition"
            >
              {t.backToStore}
            </button>
            <button
              onClick={() => onNavigate?.("player")}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-sm font-bold text-black hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              {t.startWatching}
            </button>
          </div>
        </div>

        {/* Bottom Gold Accent Line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
      </div>
    </div>
  );
}
