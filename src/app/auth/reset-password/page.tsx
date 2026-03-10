"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect} from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { passwordApi } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const t = RESET_TEXT[locale] || RESET_TEXT.en;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
        {/* Lock Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold text-white">{t.title}</h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          {t.subtitle}
        </p>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              {t.emailAddress}
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-white/10 bg-[#1a1c23] py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Verification Code Field */}
          <div>
            <label htmlFor="reset-code" className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              {t.verificationCode}
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              <input
                id="reset-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.codePlaceholder}
                className="w-full rounded-lg border border-white/10 bg-[#1a1c23] py-3 pl-10 pr-24 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                maxLength={6}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || countdown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? t.sending : countdown > 0 ? `${countdown}s` : t.getCode}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-semibold text-black transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.verifying : t.verifyAndReset}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-white/10" />

        {/* Back to Sign In */}
        <div className="text-center">
          <Link href={localizePath("/auth/login", locale)} className="text-sm text-gray-400 transition hover:text-white">
            <svg className="mr-1 inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.backSignIn}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

const RESET_TEXT: Record<SupportedLocale, Record<string, string>> = {
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
    genericError: "An error occurred" },
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
    genericError: "发生错误" },
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
    genericError: "エラーが発生しました" },
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
    genericError: "Ocurrió un error" },
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
    genericError: "Ocorreu um erro" },
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
    genericError: "त्रुटि हुई" },
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
    genericError: "Terjadi kesalahan" } };
