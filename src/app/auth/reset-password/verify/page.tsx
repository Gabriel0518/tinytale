"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams} from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { passwordApi } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { dismissActiveKeyboard } from "@/lib/capacitor-bridge";

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

function getStrengthLabelKey(score: number): { key: 'weak' | 'fair' | 'medium' | 'strong'; color: string } {
  if (score <= 1) return { key: "weak", color: "red" };
  if (score === 2) return { key: "fair", color: "orange" };
  if (score === 3) return { key: "medium", color: "yellow" };
  return { key: "strong", color: "green" };
}

function getBarColor(index: number, score: number): string {
  if (index >= score) return "bg-gray-700";
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-orange-500";
  if (score === 3) return "bg-yellow-500";
  return "bg-green-500";
}

function getTextColor(score: number): string {
  if (score <= 1) return "text-red-500";
  if (score === 2) return "text-orange-500";
  if (score === 3) return "text-yellow-500";
  return "text-green-500";
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function NewPasswordContent() {
  const locale = useLocale();
  const t = resolveLocaleCopy(VERIFY_RESET_TEXT, locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    const storedCode = sessionStorage.getItem('resetCode') || '';
    if (!email || !storedCode) {
      router.push(localizePath('/auth/reset-password', locale));
      return;
    }
    setCode(storedCode);
  }, [email, router, locale]);

  const strength = getPasswordStrength(newPassword);
  const { key: strengthLabelKey } = getStrengthLabelKey(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t.passwordMin);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      await passwordApi.resetPassword(email, code, newPassword);
      sessionStorage.removeItem('resetCode');
      router.push(`${localizePath("/auth/login", locale)}?reset=success`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.resetFailed);
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
      navRight={
        <Link href={localizePath("/help", locale)} className="text-sm text-gray-400 transition hover:text-white">
          {t.helpCenter}
        </Link>
      }
      contentClassName="items-start justify-start px-0 pb-0 pt-0 md:items-center md:justify-center md:px-4 md:py-8"
      hideFooterOnMobile
    >
      <div className="keyboard-safe-scroll keyboard-safe-form relative flex min-h-0 w-full flex-1 flex-col bg-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 md:max-w-md md:flex-none md:overflow-visible md:rounded-[28px] md:border md:border-white/10 md:bg-[#12151d] md:p-8">
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-8 md:mb-6 md:text-center">
            <h1 className="text-[2.05rem] font-semibold tracking-[-0.04em] text-white md:text-2xl md:font-bold md:tracking-normal">
              {t.title}
            </h1>
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
              <label htmlFor="verify-new-password" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.newPassword}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-500 md:block">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="verify-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 pr-12 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:placeholder:text-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70 md:right-3 md:text-gray-500 md:hover:text-white"
                  aria-label={showNewPassword ? t.hideNewPassword : t.showNewPassword}
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex flex-1 gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${getBarColor(i, strength)}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${getTextColor(strength)}`}>
                    {t[strengthLabelKey]}
                  </span>
                </div>
              )}

              <p className="mt-2 text-xs text-white/45 md:text-gray-500">
                {t.passwordHint}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="verify-confirm-password" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.confirmNewPassword}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-500 md:block">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="verify-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 pr-12 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:placeholder:text-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70 md:right-3 md:text-gray-500 md:hover:text-white"
                  aria-label={showConfirmPassword ? t.hideConfirmPassword : t.showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#0b0d10] transition hover:bg-white/90 disabled:opacity-50 md:rounded-lg md:bg-gradient-to-r md:from-amber-500 md:to-amber-600 md:text-white md:hover:from-amber-600 md:hover:to-amber-700"
            >
              {isLoading ? t.resetting : t.resetPassword}
            </button>
          </form>

          <div className="mt-auto pt-8 text-center">
            <Link
              href={localizePath("/auth/login", locale)}
              className="inline-flex items-center gap-1 text-sm text-white/55 transition hover:text-white/82 md:text-gray-400 md:hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              {t.backSignIn}
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function NewPasswordPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(VERIFY_RESET_TEXT, locale);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F1014]">
          <div className="text-gray-400">{t.loading}</div>
        </div>
      }
    >
      <NewPasswordContent />
    </Suspense>
  );
}

const VERIFY_RESET_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Create New Password",
    subtitle: "Your new password must be different from previous used passwords.",
    helpCenter: "Help Center",
    newPasswordPlaceholder: "Enter new password",
    hideNewPassword: "Hide new password",
    showNewPassword: "Show new password",
    weak: "Weak",
    fair: "Fair",
    medium: "Medium",
    strong: "Strong",
    passwordHint: "Must be at least 8 characters.",
    confirmNewPassword: "Confirm New Password",
    newPassword: "New Password",
    confirmPasswordPlaceholder: "Confirm new password",
    hideConfirmPassword: "Hide confirm password",
    showConfirmPassword: "Show confirm password",
    resetting: "Resetting...",
    resetPassword: "Reset Password",
    backSignIn: "Back to Sign In",
    passwordMin: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    resetFailed: "Failed to reset password. Please try again.",
    genericError: "An error occurred",
    loading: "Loading..." },
  zh: {
    title: "设置新密码",
    subtitle: "新密码必须和之前使用过的密码不同。",
    helpCenter: "帮助中心",
    newPasswordPlaceholder: "输入新密码",
    hideNewPassword: "隐藏新密码",
    showNewPassword: "显示新密码",
    weak: "弱",
    fair: "一般",
    medium: "中",
    strong: "强",
    passwordHint: "密码至少为 8 位。",
    confirmNewPassword: "确认新密码",
    newPassword: "新密码",
    confirmPasswordPlaceholder: "再次输入新密码",
    hideConfirmPassword: "隐藏确认密码",
    showConfirmPassword: "显示确认密码",
    resetting: "重置中...",
    resetPassword: "重置密码",
    backSignIn: "返回登录",
    passwordMin: "密码至少需要 8 位。",
    passwordMismatch: "两次输入的密码不一致。",
    resetFailed: "重置密码失败，请重试。",
    genericError: "发生错误",
    loading: "加载中..." },
  ja: {
    title: "新しいパスワードを作成",
    subtitle: "以前使用したパスワードとは異なる必要があります。",
    helpCenter: "ヘルプセンター",
    newPasswordPlaceholder: "新しいパスワードを入力",
    hideNewPassword: "新しいパスワードを隠す",
    showNewPassword: "新しいパスワードを表示",
    weak: "弱い",
    fair: "普通",
    medium: "中",
    strong: "強い",
    passwordHint: "8文字以上で入力してください。",
    confirmNewPassword: "新しいパスワードを確認",
    newPassword: "新しいパスワード",
    confirmPasswordPlaceholder: "新しいパスワードを確認",
    hideConfirmPassword: "確認パスワードを隠す",
    showConfirmPassword: "確認パスワードを表示",
    resetting: "リセット中...",
    resetPassword: "パスワードをリセット",
    backSignIn: "ログインに戻る",
    passwordMin: "パスワードは8文字以上必要です。",
    passwordMismatch: "パスワードが一致しません。",
    resetFailed: "パスワードリセットに失敗しました。",
    genericError: "エラーが発生しました",
    loading: "読み込み中..." },
  es: {
    title: "Crear nueva contraseña",
    subtitle: "Tu nueva contraseña debe ser distinta a las anteriores.",
    helpCenter: "Centro de ayuda",
    newPasswordPlaceholder: "Ingresa nueva contraseña",
    hideNewPassword: "Ocultar nueva contraseña",
    showNewPassword: "Mostrar nueva contraseña",
    weak: "Débil",
    fair: "Regular",
    medium: "Media",
    strong: "Fuerte",
    passwordHint: "Debe tener al menos 8 caracteres.",
    confirmNewPassword: "Confirmar nueva contraseña",
    newPassword: "Nueva contraseña",
    confirmPasswordPlaceholder: "Confirma nueva contraseña",
    hideConfirmPassword: "Ocultar confirmación",
    showConfirmPassword: "Mostrar confirmación",
    resetting: "Restableciendo...",
    resetPassword: "Restablecer contraseña",
    backSignIn: "Volver a iniciar sesión",
    passwordMin: "La contraseña debe tener al menos 8 caracteres.",
    passwordMismatch: "Las contraseñas no coinciden.",
    resetFailed: "No se pudo restablecer la contraseña.",
    genericError: "Ocurrió un error",
    loading: "Cargando..." },
  pt: {
    title: "Criar nova senha",
    subtitle: "Sua nova senha deve ser diferente das anteriores.",
    helpCenter: "Central de ajuda",
    newPasswordPlaceholder: "Digite a nova senha",
    hideNewPassword: "Ocultar nova senha",
    showNewPassword: "Mostrar nova senha",
    weak: "Fraca",
    fair: "Razoável",
    medium: "Média",
    strong: "Forte",
    passwordHint: "Deve ter pelo menos 8 caracteres.",
    confirmNewPassword: "Confirmar nova senha",
    newPassword: "Nova senha",
    confirmPasswordPlaceholder: "Confirme a nova senha",
    hideConfirmPassword: "Ocultar confirmação",
    showConfirmPassword: "Mostrar confirmação",
    resetting: "Redefinindo...",
    resetPassword: "Redefinir senha",
    backSignIn: "Voltar ao login",
    passwordMin: "A senha deve ter pelo menos 8 caracteres.",
    passwordMismatch: "As senhas não coincidem.",
    resetFailed: "Falha ao redefinir a senha.",
    genericError: "Ocorreu um erro",
    loading: "Carregando..." },
  hi: {
    title: "नया पासवर्ड बनाएँ",
    subtitle: "नया पासवर्ड पहले वाले पासवर्ड से अलग होना चाहिए।",
    helpCenter: "सहायता केंद्र",
    newPasswordPlaceholder: "नया पासवर्ड दर्ज करें",
    hideNewPassword: "नया पासवर्ड छिपाएँ",
    showNewPassword: "नया पासवर्ड दिखाएँ",
    weak: "कमज़ोर",
    fair: "सामान्य",
    medium: "मध्यम",
    strong: "मजबूत",
    passwordHint: "कम से कम 8 अक्षर होने चाहिए।",
    confirmNewPassword: "नया पासवर्ड पुष्टि करें",
    newPassword: "नया पासवर्ड",
    confirmPasswordPlaceholder: "नया पासवर्ड फिर दर्ज करें",
    hideConfirmPassword: "पुष्टि पासवर्ड छिपाएँ",
    showConfirmPassword: "पुष्टि पासवर्ड दिखाएँ",
    resetting: "रीसेट हो रहा है...",
    resetPassword: "पासवर्ड रीसेट करें",
    backSignIn: "लॉगिन पर वापस जाएँ",
    passwordMin: "पासवर्ड कम से कम 8 अक्षर का होना चाहिए।",
    passwordMismatch: "पासवर्ड मेल नहीं खाते।",
    resetFailed: "पासवर्ड रीसेट विफल रहा।",
    genericError: "त्रुटि हुई",
    loading: "लोड हो रहा है..." },
  id: {
    title: "Buat kata sandi baru",
    subtitle: "Kata sandi baru harus berbeda dari yang sebelumnya.",
    helpCenter: "Pusat bantuan",
    newPasswordPlaceholder: "Masukkan kata sandi baru",
    hideNewPassword: "Sembunyikan kata sandi baru",
    showNewPassword: "Tampilkan kata sandi baru",
    weak: "Lemah",
    fair: "Cukup",
    medium: "Sedang",
    strong: "Kuat",
    passwordHint: "Minimal 8 karakter.",
    confirmNewPassword: "Konfirmasi kata sandi baru",
    newPassword: "Kata sandi baru",
    confirmPasswordPlaceholder: "Konfirmasi kata sandi baru",
    hideConfirmPassword: "Sembunyikan konfirmasi",
    showConfirmPassword: "Tampilkan konfirmasi",
    resetting: "Sedang mereset...",
    resetPassword: "Reset kata sandi",
    backSignIn: "Kembali ke login",
    passwordMin: "Kata sandi minimal 8 karakter.",
    passwordMismatch: "Kata sandi tidak cocok.",
    resetFailed: "Gagal reset kata sandi.",
    genericError: "Terjadi kesalahan",
    loading: "Memuat..." } };
