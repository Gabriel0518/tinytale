"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { passwordApi } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { dismissActiveKeyboard } from "@/lib/capacitor-bridge";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(RESET_TEXT, locale);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const handleClose = useCallback(() => {
    const homePath = localizePath("/", locale);
    void dismissActiveKeyboard();
    if (typeof window !== "undefined") {
      window.location.assign(homePath);
      return;
    }
    router.replace(homePath);
  }, [locale, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      setError(t.enterEmail);
      return;
    }
    setIsSending(true);
    setError("");
    try {
      await passwordApi.sendResetCode(email);
      setCountdown(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.sendCodeFailed);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setError(t.enterEmailAndCode);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await passwordApi.verifyCode(email, code);
      sessionStorage.setItem('resetCode', code);
      router.push(`${localizePath('/auth/reset-password/verify', locale)}?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.verifyFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      mobileHeader={
        <header className="flex items-center justify-end px-6 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.backSignIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
      }
      contentClassName="items-start justify-start px-0 pb-0 pt-0 md:items-center md:justify-center md:px-4 md:py-8"
      hideFooterOnMobile
    >
      <div className="keyboard-safe-scroll keyboard-safe-form relative flex min-h-0 w-full flex-1 flex-col bg-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 md:max-w-md md:flex-none md:overflow-visible md:rounded-[28px] md:border md:border-white/10 md:bg-[#12151d] md:p-8">
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-8 md:mb-6 md:text-center">
            <h1 className="text-[2.05rem] font-semibold tracking-[-0.04em] text-white md:text-2xl md:font-bold md:tracking-normal">{t.title}</h1>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/55 md:mx-auto md:max-w-none md:text-gray-400">
              {t.subtitle}
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.emailAddress}
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-500 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailExample}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:pr-4 md:placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="reset-code" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.verificationCode}
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-500 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
                <input
                  id="reset-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.codePlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 pr-28 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:pr-24 md:placeholder:text-gray-500"
                  maxLength={6}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSending || countdown > 0}
                  className="absolute right-2 top-1/2 min-h-[36px] -translate-y-1/2 rounded-lg border border-white/10 bg-white/8 px-3 text-xs font-semibold text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50 md:bg-amber-500 md:text-black md:hover:bg-amber-600"
                >
                  {isSending ? t.sending : countdown > 0 ? `${countdown}s` : t.getCode}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#0b0d10] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:bg-gradient-to-r md:from-amber-500 md:to-amber-600 md:text-black md:hover:from-amber-600 md:hover:to-amber-700"
            >
              {isLoading ? t.verifying : t.verifyAndReset}
            </button>
          </form>

          <div className="mt-auto pt-8 text-center">
            <Link href={localizePath("/auth/login", locale)} className="text-sm text-white/55 transition hover:text-white/82 md:text-gray-400 md:hover:text-white">
              <svg className="mr-1 inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t.backSignIn}
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

const RESET_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Reset Password",
    subtitle: "Enter your email address and verification code to reset your password.",
    emailAddress: "Email Address",
    verificationCode: "Verification Code",
    codePlaceholder: "Enter code",
    sending: "Sending...",
    getCode: "Get Code",
    verifying: "Verifying...",
    verifyAndReset: "Verify and Reset",
    backSignIn: "Back to Sign In",
    enterEmail: "Please enter your email address.",
    sendCodeFailed: "Failed to send verification code.",
    enterEmailAndCode: "Please enter both email and verification code.",
    verifyFailed: "Verification failed. Please try again.",
    genericError: "An error occurred",
    emailExample: "john@example.com" },
  zh: {
    title: "重置密码",
    subtitle: "输入邮箱和验证码以重置你的密码。",
    emailAddress: "邮箱地址",
    verificationCode: "验证码",
    codePlaceholder: "输入验证码",
    sending: "发送中...",
    getCode: "获取验证码",
    verifying: "验证中...",
    verifyAndReset: "验证并重置",
    backSignIn: "返回登录",
    enterEmail: "请输入邮箱地址。",
    sendCodeFailed: "验证码发送失败。",
    enterEmailAndCode: "请输入邮箱和验证码。",
    verifyFailed: "验证失败，请重试。",
    genericError: "发生错误",
    emailExample: "john@example.com" },
  ja: {
    title: "パスワード再設定",
    subtitle: "メールアドレスと認証コードを入力してください。",
    emailAddress: "メールアドレス",
    verificationCode: "認証コード",
    codePlaceholder: "コードを入力",
    sending: "送信中...",
    getCode: "コード取得",
    verifying: "確認中...",
    verifyAndReset: "確認してリセット",
    backSignIn: "ログインに戻る",
    enterEmail: "メールアドレスを入力してください。",
    sendCodeFailed: "認証コード送信に失敗しました。",
    enterEmailAndCode: "メールと認証コードを入力してください。",
    verifyFailed: "認証に失敗しました。",
    genericError: "エラーが発生しました",
    emailExample: "john@example.com" },
  es: {
    title: "Restablecer contraseña",
    subtitle: "Ingresa tu correo y código para restablecer tu contraseña.",
    emailAddress: "Correo electrónico",
    verificationCode: "Código de verificación",
    codePlaceholder: "Ingresa el código",
    sending: "Enviando...",
    getCode: "Obtener código",
    verifying: "Verificando...",
    verifyAndReset: "Verificar y restablecer",
    backSignIn: "Volver a iniciar sesión",
    enterEmail: "Ingresa tu correo electrónico.",
    sendCodeFailed: "No se pudo enviar el código.",
    enterEmailAndCode: "Ingresa correo y código.",
    verifyFailed: "La verificación falló.",
    genericError: "Ocurrió un error",
    emailExample: "john@example.com" },
  pt: {
    title: "Redefinir senha",
    subtitle: "Informe e-mail e código para redefinir sua senha.",
    emailAddress: "E-mail",
    verificationCode: "Código de verificação",
    codePlaceholder: "Digite o código",
    sending: "Enviando...",
    getCode: "Obter código",
    verifying: "Verificando...",
    verifyAndReset: "Verificar e redefinir",
    backSignIn: "Voltar ao login",
    enterEmail: "Digite seu e-mail.",
    sendCodeFailed: "Falha ao enviar código.",
    enterEmailAndCode: "Digite e-mail e código.",
    verifyFailed: "Falha na verificação.",
    genericError: "Ocorreu um erro",
    emailExample: "john@example.com" },
  hi: {
    title: "पासवर्ड रीसेट",
    subtitle: "पासवर्ड रीसेट करने के लिए ईमेल और कोड दर्ज करें।",
    emailAddress: "ईमेल पता",
    verificationCode: "सत्यापन कोड",
    codePlaceholder: "कोड दर्ज करें",
    sending: "भेजा जा रहा है...",
    getCode: "कोड प्राप्त करें",
    verifying: "सत्यापन हो रहा है...",
    verifyAndReset: "सत्यापित करें और रीसेट करें",
    backSignIn: "लॉगिन पर वापस जाएँ",
    enterEmail: "कृपया अपना ईमेल दर्ज करें।",
    sendCodeFailed: "कोड भेजने में विफल।",
    enterEmailAndCode: "ईमेल और कोड दर्ज करें।",
    verifyFailed: "सत्यापन विफल रहा।",
    genericError: "त्रुटि हुई",
    emailExample: "john@example.com" },
  id: {
    title: "Reset kata sandi",
    subtitle: "Masukkan email dan kode verifikasi untuk reset kata sandi.",
    emailAddress: "Alamat email",
    verificationCode: "Kode verifikasi",
    codePlaceholder: "Masukkan kode",
    sending: "Mengirim...",
    getCode: "Ambil kode",
    verifying: "Memverifikasi...",
    verifyAndReset: "Verifikasi & reset",
    backSignIn: "Kembali ke login",
    enterEmail: "Masukkan alamat email.",
    sendCodeFailed: "Gagal mengirim kode.",
    enterEmailAndCode: "Masukkan email dan kode.",
    verifyFailed: "Verifikasi gagal.",
    genericError: "Terjadi kesalahan",
    emailExample: "john@example.com" } };
