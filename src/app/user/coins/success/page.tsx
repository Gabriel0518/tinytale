"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect} from "react";
import { useSearchParams} from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { coinsApi } from "@/lib/api";
import { Navbar } from "@/components/features/Navbar";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

type SuccessCopy = {
  paymentSuccess: string;
  paidOk: (amountLabel: string) => string;
  bonusCoins: (bonus: number) => string;
  buyMore: string;
  startWatching: string;
  issueTitle: string;
  issueDesc: string;
  backToCoins: string;
  coinsUnit: string;
};

const COPY: FlexibleRecord<SupportedLocale, SuccessCopy> = {
  en: {
    paymentSuccess: "Payment Successful",
    paidOk: (amountLabel) => `${amountLabel} paid successfully`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} Bonus Coins`,
    buyMore: "Buy More",
    startWatching: "Start Watching",
    issueTitle: "Payment Issue",
    issueDesc: "We couldn't verify your payment. If you were charged, your coins will be credited shortly.",
    backToCoins: "Back to Coins",
    coinsUnit: "coins" },
  zh: {
    paymentSuccess: "支付成功",
    paidOk: (amountLabel) => `已成功支付 ${amountLabel}`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} 奖励金币`,
    buyMore: "继续购买",
    startWatching: "开始观看",
    issueTitle: "支付异常",
    issueDesc: "我们暂时无法验证该笔支付，如已扣款，金币将很快到账。",
    backToCoins: "返回金币页",
    coinsUnit: "金币" },
  ja: {
    paymentSuccess: "支払い完了",
    paidOk: (amountLabel) => `${amountLabel} の支払いが完了しました`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} ボーナスコイン`,
    buyMore: "さらに購入",
    startWatching: "視聴を開始",
    issueTitle: "支払いエラー",
    issueDesc: "お支払いを確認できませんでした。引き落とし済みの場合、コインはまもなく反映されます。",
    backToCoins: "コインページへ戻る",
    coinsUnit: "コイン" },
  es: {
    paymentSuccess: "Pago exitoso",
    paidOk: (amountLabel) => `Pago de ${amountLabel} completado`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} monedas extra`,
    buyMore: "Comprar más",
    startWatching: "Comenzar a ver",
    issueTitle: "Problema de pago",
    issueDesc: "No pudimos verificar tu pago. Si ya se cobró, tus monedas se acreditarán pronto.",
    backToCoins: "Volver a Monedas",
    coinsUnit: "monedas" },
  pt: {
    paymentSuccess: "Pagamento concluído",
    paidOk: (amountLabel) => `Pagamento de ${amountLabel} concluído`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} moedas bônus`,
    buyMore: "Comprar mais",
    startWatching: "Começar a assistir",
    issueTitle: "Problema no pagamento",
    issueDesc: "Não conseguimos verificar seu pagamento. Se houve cobrança, suas moedas serão creditadas em breve.",
    backToCoins: "Voltar para Moedas",
    coinsUnit: "moedas" },
  hi: {
    paymentSuccess: "भुगतान सफल",
    paidOk: (amountLabel) => `${amountLabel} का भुगतान सफल रहा`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} बोनस कॉइन्स`,
    buyMore: "और खरीदें",
    startWatching: "देखना शुरू करें",
    issueTitle: "भुगतान समस्या",
    issueDesc: "भुगतान सत्यापित नहीं हो सका। यदि राशि कट गई है, कॉइन्स जल्द जोड़ दिए जाएंगे।",
    backToCoins: "कॉइन्स पर वापस जाएँ",
    coinsUnit: "कॉइन्स" },
  id: {
    paymentSuccess: "Pembayaran berhasil",
    paidOk: (amountLabel) => `Pembayaran ${amountLabel} berhasil`,
    bonusCoins: (bonus) => `+${bonus.toLocaleString()} koin bonus`,
    buyMore: "Beli lagi",
    startWatching: "Mulai menonton",
    issueTitle: "Masalah pembayaran",
    issueDesc: "Kami tidak dapat memverifikasi pembayaranmu. Jika sudah terpotong, koin akan segera masuk.",
    backToCoins: "Kembali ke Koin",
    coinsUnit: "koin" } };

function PaymentSuccessContent() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);
  const { token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const airwallexIntentId = searchParams.get("id");
  const provider = searchParams.get("provider");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [coins, setCoins] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("USD");

  const amountLocale = ({
    en: "en-US",
    zh: "zh-CN",
    ja: "ja-JP",
    es: "es-ES",
    pt: "pt-BR",
    hi: "hi-IN",
    id: "id-ID",
    ko: "ko-KR",
    fr: "fr-FR",
  } as const)[locale] || "en-US";

  const formatAmount = (value: number, currencyCode: string) => {
    const normalized = (currencyCode || "USD").toUpperCase();
    try {
      return new Intl.NumberFormat(amountLocale, {
        style: "currency",
        currency: normalized,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch {
      return `${normalized} ${Number(value || 0).toFixed(2)}`;
    }
  };

  useEffect(() => {
    if (!token) return;
    const verify = async () => {
      try {
        const res = provider === "airwallex" && airwallexIntentId
          ? await coinsApi.verifyAirwallexIntent(token, airwallexIntentId)
          : sessionId
            ? await coinsApi.verifySession(token, sessionId)
            : null;
        if (!res) {
          setStatus("error");
          return;
        }
        const d = res.data;
        if ((d.status === "paid" || d.status === "succeeded") && d.transactionStatus === "completed") {
          setCoins(d.coins);
          setBonus(d.bonus);
          setAmount(d.amount);
          setCurrency((d.currency || "USD").toUpperCase());
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
  }, [sessionId, airwallexIntentId, provider, token, refreshUser]);

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
          <h1 className="text-3xl font-bold mb-3">{t.paymentSuccess}</h1>
          <p className="text-gray-400 mb-6">{t.paidOk(formatAmount(amount, currency))}</p>
          <div className="bg-zinc-900/60 rounded-xl border border-yellow-500/20 p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
              <span>+{coins.toLocaleString()}</span>
              <span className="text-base text-gray-400">{t.coinsUnit}</span>
            </div>
            {bonus > 0 && (
              <p className="text-green-400 text-sm mt-2">{t.bonusCoins(bonus)}</p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Link href={localizePath("/user/coins", locale)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition">
              {t.buyMore}
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
          <Link href={localizePath("/user/coins", locale)} className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-sm font-bold transition">
            {t.backToCoins}
          </Link>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(COPY, locale);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar mobileTitle={t.paymentSuccess} />
      <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center"><div className="w-10 h-10 mx-auto border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
