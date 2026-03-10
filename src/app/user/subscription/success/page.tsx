"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import { detectClientLocale, localizePath, SupportedLocale } from "@/lib/i18n";

type VipCopy = {
  title: string;
  paidOk: (amount: number) => string;
  activated: string;
  perks: string;
  viewSubscription: string;
  startWatching: string;
  issueTitle: string;
  issueDesc: string;
  backToSubscription: string;
};

const COPY: Record<SupportedLocale, VipCopy> = {
  en: {
    title: "Welcome to TinyTale Premium!",
    paidOk: (amount) => `$${amount.toFixed(2)} paid successfully. Your VIP membership is now active.`,
    activated: "VIP Activated",
    perks: "Enjoy ad-free viewing, early access, and all premium benefits",
    viewSubscription: "View Subscription",
    startWatching: "Start Watching",
    issueTitle: "Payment Issue",
    issueDesc: "We couldn't verify your payment. If you were charged, your VIP membership will be activated shortly.",
    backToSubscription: "Back to Subscription",
  },
  zh: {
    title: "欢迎加入 TinyTale Premium！",
    paidOk: (amount) => `已成功支付 $${amount.toFixed(2)}，你的 VIP 会员已开通。`,
    activated: "VIP 已激活",
    perks: "享受无广告、抢先看和全部高级权益",
    viewSubscription: "查看订阅",
    startWatching: "开始观看",
    issueTitle: "支付异常",
    issueDesc: "我们暂时无法验证支付，如已扣款，VIP 将很快生效。",
    backToSubscription: "返回订阅页",
  },
  ja: {
    title: "TinyTale Premiumへようこそ！",
    paidOk: (amount) => `$${amount.toFixed(2)} の支払いが完了し、VIPが有効になりました。`,
    activated: "VIP有効化済み",
    perks: "広告なし・先行視聴・プレミアム特典を利用できます",
    viewSubscription: "サブスクを見る",
    startWatching: "視聴を開始",
    issueTitle: "支払いエラー",
    issueDesc: "お支払いを確認できませんでした。引き落とし済みの場合、VIPはまもなく有効化されます。",
    backToSubscription: "サブスクへ戻る",
  },
  es: {
    title: "¡Bienvenido a TinyTale Premium!",
    paidOk: (amount) => `Pago de $${amount.toFixed(2)} completado. Tu membresía VIP ya está activa.`,
    activated: "VIP activado",
    perks: "Disfruta sin anuncios, acceso anticipado y todos los beneficios premium",
    viewSubscription: "Ver suscripción",
    startWatching: "Comenzar a ver",
    issueTitle: "Problema de pago",
    issueDesc: "No pudimos verificar tu pago. Si ya se cobró, tu VIP se activará pronto.",
    backToSubscription: "Volver a Suscripción",
  },
  pt: {
    title: "Bem-vindo ao TinyTale Premium!",
    paidOk: (amount) => `Pagamento de $${amount.toFixed(2)} concluído. Sua assinatura VIP está ativa.`,
    activated: "VIP ativado",
    perks: "Aproveite sem anúncios, acesso antecipado e todos os benefícios premium",
    viewSubscription: "Ver assinatura",
    startWatching: "Começar a assistir",
    issueTitle: "Problema no pagamento",
    issueDesc: "Não conseguimos verificar seu pagamento. Se já foi cobrado, o VIP será ativado em breve.",
    backToSubscription: "Voltar para Assinatura",
  },
  hi: {
    title: "TinyTale Premium में आपका स्वागत है!",
    paidOk: (amount) => `$${amount.toFixed(2)} का भुगतान सफल। आपका VIP अब सक्रिय है।`,
    activated: "VIP सक्रिय",
    perks: "बिना विज्ञापन, पहले एक्सेस और सभी प्रीमियम लाभ पाएं",
    viewSubscription: "सदस्यता देखें",
    startWatching: "देखना शुरू करें",
    issueTitle: "भुगतान समस्या",
    issueDesc: "भुगतान सत्यापित नहीं हो सका। यदि राशि कट गई है, VIP जल्द सक्रिय हो जाएगा।",
    backToSubscription: "सदस्यता पर वापस जाएँ",
  },
  id: {
    title: "Selamat datang di TinyTale Premium!",
    paidOk: (amount) => `Pembayaran $${amount.toFixed(2)} berhasil. Keanggotaan VIP kamu kini aktif.`,
    activated: "VIP aktif",
    perks: "Nikmati bebas iklan, akses awal, dan semua manfaat premium",
    viewSubscription: "Lihat langganan",
    startWatching: "Mulai menonton",
    issueTitle: "Masalah pembayaran",
    issueDesc: "Kami tidak dapat memverifikasi pembayaranmu. Jika sudah terpotong, VIP akan segera aktif.",
    backToSubscription: "Kembali ke Langganan",
  },
};

function VIPSuccessContent() {
  const pathname = usePathname();
  const locale = useMemo(() => detectClientLocale(pathname), [pathname]);
  const t = COPY[locale] || COPY.en;
  const { token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!sessionId || !token) return;
    const verify = async () => {
      try {
        const res = await coinsApi.verifySession(token, sessionId);
        const d = res.data;
        if (d.status === "paid" && d.transactionStatus === "completed") {
          setAmount(d.amount);
          setStatus("success");
          await refreshUser();
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [sessionId, token, refreshUser]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
      {status === "loading" && (
        <div className="w-10 h-10 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      )}
      {status === "success" && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
          <p className="text-gray-400 mb-6">{t.paidOk(amount)}</p>
          <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" /></svg>
              <span>{t.activated}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">{t.perks}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href={localizePath("/user/subscription", locale)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition">
              {t.viewSubscription}
            </Link>
            <Link href={localizePath("/", locale)} className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
              {t.startWatching}
            </Link>
          </div>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3">{t.issueTitle}</h1>
          <p className="text-gray-400 mb-6">{t.issueDesc}</p>
          <Link href={localizePath("/user/subscription", locale)} className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
            {t.backToSubscription}
          </Link>
        </>
      )}
    </div>
  );
}

export default function VIPSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center"><div className="w-10 h-10 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <VIPSuccessContent />
      </Suspense>
    </div>
  );
}
