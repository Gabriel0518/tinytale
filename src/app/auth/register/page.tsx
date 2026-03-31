"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useFacebookLogin } from "@/lib/facebookSdk";
import { authApi, verificationApi } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { dismissActiveKeyboard } from "@/lib/capacitor-bridge";
import { loginWithNativeFacebook, loginWithNativeGoogle } from "@/lib/native-social-login";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(REGISTER_TEXT, locale);
  const router = useRouter();
  const { isApp } = usePlatform();
  const { googleLogin, facebookLogin } = useAuth();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
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

  const checkEmailAvailability = async (targetEmail: string): Promise<boolean> => {
    const normalizedEmail = targetEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return false;
    }

    const response = await authApi.checkEmailAvailability(normalizedEmail);
    return !response.data.available;
  };

  const handleEmailBlur = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) return;

    setCheckingEmail(true);
    try {
      const isRegistered = await checkEmailAvailability(normalizedEmail);
      if (isRegistered) {
        setError(t.emailAlreadyRegistered);
      } else if (error === t.emailAlreadyRegistered) {
        setError("");
      }
    } catch (err) {
      console.error('Failed to check email availability:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError(t.invalidEmail);
      return;
    }

    if (!agreedToTerms) {
      setError(t.agreeRequired);
      return;
    }

    if (password.length < 8) {
      setError(t.passwordMin);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const isRegistered = await checkEmailAvailability(normalizedEmail);
      if (isRegistered) {
        setError(t.emailAlreadyRegistered);
        return;
      }

      // Step 1: Send verification code
      await verificationApi.sendVerificationCode(normalizedEmail, 'register');

      // Step 2: Store registration data in sessionStorage
      const refCode = typeof window !== 'undefined' ? localStorage.getItem('ref_code') || '' : '';
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        email: normalizedEmail,
        password,
        nickname,
        referredBy: refCode || undefined
      }));

      // Step 3: Redirect to verification page
      router.push(`${localizePath('/auth/verify-otp', locale)}?email=${encodeURIComponent(normalizedEmail)}&purpose=register`);
    } catch (err: unknown) {
      console.error('Failed to send registration verification code:', err);
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      if (message.includes('email already registered')) {
        setError(t.emailAlreadyRegistered);
      } else {
        setError(t.sendCodeFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignupSuccess = useCallback(async (accessToken: string, idToken?: string) => {
    setIsLoading(true);
    setError("");
    try {
      await googleLogin(idToken ? { accessToken, idToken } : accessToken);
      router.push(localizePath("/user/profile", locale));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.googleFailed);
    } finally {
      setIsLoading(false);
    }
  }, [googleLogin, locale, router, t.genericError, t.googleFailed]);

  const handleGoogleSignupError = (error: string) => {
    setError(error);
  };

  const handleGoogleSignupClick = useCallback(async () => {
    if (!isApp) {
      return;
    }

    try {
      const result = await loginWithNativeGoogle();
      await handleGoogleSignupSuccess(result.accessToken, result.idToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.googleFailed;
      setError(message || t.googleFailed);
    }
  }, [handleGoogleSignupSuccess, isApp, t.googleFailed]);

  const handleFacebookWebSignup = useFacebookLogin(
    async (accessToken) => {
      setIsLoading(true);
      setError("");
      try {
        await facebookLogin(accessToken);
        router.push(localizePath("/user/profile", locale));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.genericError;
        setError(message || t.facebookFailed);
      } finally {
        setIsLoading(false);
      }
    },
    (error) => {
      setError(error);
    }
  );

  const handleFacebookSignup = useCallback(async () => {
    if (!isApp) {
      handleFacebookWebSignup();
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const result = await loginWithNativeFacebook();
      await facebookLogin(result.accessToken);
      router.push(localizePath("/user/profile", locale));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.facebookFailed;
      setError(message || t.facebookFailed);
    } finally {
      setIsLoading(false);
    }
  }, [facebookLogin, handleFacebookWebSignup, isApp, locale, router, t.facebookFailed]);

  return (
    <AuthLayout
      mobileHeader={
        <header className="flex items-center justify-end px-6 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.signIn}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
      }
      navRight={
        <Link href={localizePath("/auth/login", locale)} className="transition hover:text-white">
          {t.signIn}
        </Link>
      }
      contentClassName="items-start justify-start px-0 pb-0 pt-0 md:items-center md:justify-center md:px-4 md:py-8"
      hideFooterOnMobile
    >
      <div className="keyboard-safe-scroll keyboard-safe-form relative flex min-h-0 w-full flex-1 flex-col bg-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 md:max-w-md md:flex-none md:overflow-visible md:rounded-[28px] md:border md:border-white/10 md:bg-[#12151d] md:p-8">
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-8 md:mb-6 md:text-center">
            <h1 className="text-[2.05rem] font-semibold tracking-[-0.04em] text-white md:text-2xl md:font-bold md:tracking-normal">
              {t.createAccount}
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
              <label htmlFor="register-username" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.username}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-400 md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  id="register-username"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:pr-4 md:placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.emailAddress}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-400 md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error === t.emailAlreadyRegistered) {
                      setError("");
                    }
                  }}
                  onBlur={handleEmailBlur}
                  placeholder={t.emailPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:pr-4 md:placeholder:text-gray-500"
                  required
                />
              </div>
              {checkingEmail && (
                <p className="text-xs text-white/45 md:text-gray-400">{t.checkingAccount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-password" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.password}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-400 md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 pr-12 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:placeholder:text-gray-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70 md:right-3 md:text-gray-500 md:hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" x2="23" y1="1" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                {t.confirmPassword}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-400 md:block">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="register-confirm-password"
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
                  aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70 md:right-3 md:text-gray-500 md:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" x2="23" y1="1" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-white/15 bg-transparent text-[#ff5f80] focus:ring-[#ff5f80]/30"
              />
              <span className="leading-6">
                {t.agreePrefix}{" "}
                <Link href={localizePath("/help?tab=terms", locale)} className="font-medium text-white underline decoration-white/50 underline-offset-2 transition hover:text-white/80 md:text-amber-500 md:no-underline md:hover:underline">{t.terms}</Link>
                {" "}{t.and}{" "}
                <Link href={localizePath("/help?tab=privacy", locale)} className="font-medium text-white underline decoration-white/50 underline-offset-2 transition hover:text-white/80 md:text-amber-500 md:no-underline md:hover:underline">{t.privacy}</Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || checkingEmail}
              className="mt-2 h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#0b0d10] transition hover:bg-white/90 disabled:opacity-50 md:rounded-lg md:bg-gradient-to-r md:from-amber-500 md:to-amber-600 md:text-white md:hover:from-amber-600 md:hover:to-amber-700"
            >
              {isLoading ? t.sendingCode : t.createAccount}
            </button>
          </form>

          <div className="my-8 flex items-center gap-3 md:my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium text-white/40 md:text-sm md:text-gray-500">{t.orContinueWith}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleFacebookSignup}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition hover:bg-white/[0.04] md:rounded-lg md:bg-[#1a1c23] md:hover:bg-white/5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {t.facebook}
            </button>
            <GoogleLoginButton
              onSuccess={handleGoogleSignupSuccess}
              onError={handleGoogleSignupError}
              onClick={isApp ? handleGoogleSignupClick : undefined}
              isLoading={isLoading}
              text="Google"
              loadingText={t.sendingCode}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-medium text-white transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:bg-[#1a1c23] md:hover:bg-white/5"
            />
          </div>

          <div className="mt-auto pt-8">
            <p className="text-center text-sm text-white/50 md:text-gray-400">
              {t.hasAccount}{" "}
              <Link href={localizePath("/auth/login", locale)} className="font-semibold text-white underline decoration-white/60 underline-offset-2 transition hover:text-white/80 md:text-amber-500 md:no-underline md:hover:underline">
                {t.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

const REGISTER_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    signIn: "Sign In",
    createAccount: "Create Account",
    subtitle: "Join TinyTale for unlimited short dramas",
    username: "Username",
    usernamePlaceholder: "Username",
    emailAddress: "Email Address",
    emailPlaceholder: "Email address",
    password: "Password",
    passwordPlaceholder: "Password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm Password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    agreePrefix: "I agree to the",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    sendingCode: "Sending verification code...",
    orContinueWith: "Or continue with",
    facebook: "Facebook",
    hasAccount: "Already have an account?",
    agreeRequired: "You must agree to the Terms of Service and Privacy Policy.",
    passwordMin: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    invalidEmail: "Please enter a valid email address.",
    emailAlreadyRegistered: "This email is already registered. Please sign in instead.",
    checkingAccount: "Checking account availability...",
    genericError: "An error occurred",
    sendCodeFailed: "Failed to send verification code. Please try again.",
    googleFailed: "Google sign up failed. Please try again.",
    facebookFailed: "Facebook sign up failed. Please try again." },
  zh: {
    signIn: "登录",
    createAccount: "创建账号",
    subtitle: "加入 TinyTale，畅看优质短剧",
    username: "用户名",
    usernamePlaceholder: "用户名",
    emailAddress: "邮箱地址",
    emailPlaceholder: "邮箱地址",
    password: "密码",
    passwordPlaceholder: "密码",
    confirmPassword: "确认密码",
    confirmPasswordPlaceholder: "确认密码",
    hidePassword: "隐藏密码",
    showPassword: "显示密码",
    agreePrefix: "我同意",
    terms: "服务条款",
    and: "和",
    privacy: "隐私政策",
    sendingCode: "验证码发送中...",
    orContinueWith: "或使用以下方式继续",
    facebook: "Facebook",
    hasAccount: "已有账号？",
    agreeRequired: "你必须同意服务条款和隐私政策。",
    passwordMin: "密码至少需要 8 位。",
    passwordMismatch: "两次输入的密码不一致。",
    invalidEmail: "请输入有效的邮箱地址。",
    emailAlreadyRegistered: "该邮箱已注册，请直接登录。",
    checkingAccount: "正在检查账号是否已注册...",
    genericError: "发生错误",
    sendCodeFailed: "发送验证码失败，请重试。",
    googleFailed: "Google 注册失败，请重试。",
    facebookFailed: "Facebook 注册失败，请重试。" },
  ja: {
    signIn: "ログイン",
    createAccount: "アカウント作成",
    subtitle: "TinyTale に登録してショートドラマを視聴",
    username: "ユーザー名",
    usernamePlaceholder: "ユーザー名",
    emailAddress: "メールアドレス",
    emailPlaceholder: "メールアドレス",
    password: "パスワード",
    passwordPlaceholder: "パスワード",
    confirmPassword: "パスワード確認",
    confirmPasswordPlaceholder: "パスワード確認",
    hidePassword: "パスワードを隠す",
    showPassword: "パスワードを表示",
    agreePrefix: "私は",
    terms: "利用規約",
    and: "および",
    privacy: "プライバシーポリシー",
    sendingCode: "認証コード送信中...",
    orContinueWith: "または次で続行",
    facebook: "Facebook",
    hasAccount: "すでにアカウントをお持ちですか？",
    agreeRequired: "利用規約とプライバシーポリシーへの同意が必要です。",
    passwordMin: "パスワードは8文字以上必要です。",
    passwordMismatch: "パスワードが一致しません。",
    invalidEmail: "有効なメールアドレスを入力してください。",
    emailAlreadyRegistered: "このメールアドレスは既に登録されています。ログインしてください。",
    checkingAccount: "アカウントを確認中...",
    genericError: "エラーが発生しました",
    sendCodeFailed: "認証コード送信に失敗しました。",
    googleFailed: "Google 登録に失敗しました。",
    facebookFailed: "Facebook 登録に失敗しました。" },
  es: {
    signIn: "Entrar",
    createAccount: "Crear cuenta",
    subtitle: "Únete a TinyTale para ver dramas cortos sin límite",
    username: "Nombre de usuario",
    usernamePlaceholder: "Nombre de usuario",
    emailAddress: "Correo electrónico",
    emailPlaceholder: "Correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Confirmar contraseña",
    hidePassword: "Ocultar contraseña",
    showPassword: "Mostrar contraseña",
    agreePrefix: "Acepto los",
    terms: "Términos de servicio",
    and: "y la",
    privacy: "Política de privacidad",
    sendingCode: "Enviando código de verificación...",
    orContinueWith: "O continúa con",
    facebook: "Facebook",
    hasAccount: "¿Ya tienes cuenta?",
    agreeRequired: "Debes aceptar los Términos y la Política de privacidad.",
    passwordMin: "La contraseña debe tener al menos 8 caracteres.",
    passwordMismatch: "Las contraseñas no coinciden.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    emailAlreadyRegistered: "Este correo ya está registrado. Inicia sesión.",
    checkingAccount: "Verificando disponibilidad de la cuenta...",
    genericError: "Ocurrió un error",
    sendCodeFailed: "No se pudo enviar el código.",
    googleFailed: "Falló el registro con Google.",
    facebookFailed: "Falló el registro con Facebook." },
  pt: {
    signIn: "Entrar",
    createAccount: "Criar conta",
    subtitle: "Entre na TinyTale para assistir dramas curtos ilimitados",
    username: "Nome de usuário",
    usernamePlaceholder: "Nome de usuário",
    emailAddress: "E-mail",
    emailPlaceholder: "E-mail",
    password: "Senha",
    passwordPlaceholder: "Senha",
    confirmPassword: "Confirmar senha",
    confirmPasswordPlaceholder: "Confirmar senha",
    hidePassword: "Ocultar senha",
    showPassword: "Mostrar senha",
    agreePrefix: "Eu concordo com",
    terms: "Termos de Serviço",
    and: "e",
    privacy: "Política de Privacidade",
    sendingCode: "Enviando código de verificação...",
    orContinueWith: "Ou continue com",
    facebook: "Facebook",
    hasAccount: "Já tem uma conta?",
    agreeRequired: "Você deve concordar com os Termos e a Política de Privacidade.",
    passwordMin: "A senha deve ter pelo menos 8 caracteres.",
    passwordMismatch: "As senhas não coincidem.",
    invalidEmail: "Digite um e-mail válido.",
    emailAlreadyRegistered: "Este e-mail já está registrado. Faça login.",
    checkingAccount: "Verificando disponibilidade da conta...",
    genericError: "Ocorreu um erro",
    sendCodeFailed: "Falha ao enviar código.",
    googleFailed: "Falha no cadastro com Google.",
    facebookFailed: "Falha no cadastro com Facebook." },
  hi: {
    signIn: "साइन इन",
    createAccount: "खाता बनाएँ",
    subtitle: "अनलिमिटेड शॉर्ट ड्रामा के लिए TinyTale जॉइन करें",
    username: "यूज़रनेम",
    usernamePlaceholder: "यूज़रनेम",
    emailAddress: "ईमेल पता",
    emailPlaceholder: "ईमेल पता",
    password: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड",
    confirmPassword: "पासवर्ड पुष्टि करें",
    confirmPasswordPlaceholder: "पासवर्ड पुष्टि करें",
    hidePassword: "पासवर्ड छिपाएँ",
    showPassword: "पासवर्ड दिखाएँ",
    agreePrefix: "मैं",
    terms: "सेवा की शर्तों",
    and: "और",
    privacy: "गोपनीयता नीति",
    sendingCode: "वेरिफिकेशन कोड भेजा जा रहा है...",
    orContinueWith: "या इससे जारी रखें",
    facebook: "Facebook",
    hasAccount: "पहले से खाता है?",
    agreeRequired: "आपको शर्तों और गोपनीयता नीति से सहमत होना होगा।",
    passwordMin: "पासवर्ड कम से कम 8 अक्षर का होना चाहिए।",
    passwordMismatch: "पासवर्ड मेल नहीं खाते।",
    invalidEmail: "कृपया मान्य ईमेल पता दर्ज करें।",
    emailAlreadyRegistered: "यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।",
    checkingAccount: "खाते की उपलब्धता जाँची जा रही है...",
    genericError: "त्रुटि हुई",
    sendCodeFailed: "कोड भेजने में विफल।",
    googleFailed: "Google साइन अप विफल।",
    facebookFailed: "Facebook साइन अप विफल।" },
  id: {
    signIn: "Masuk",
    createAccount: "Buat akun",
    subtitle: "Bergabung dengan TinyTale untuk drama pendek tanpa batas",
    username: "Nama pengguna",
    usernamePlaceholder: "Nama pengguna",
    emailAddress: "Alamat email",
    emailPlaceholder: "Alamat email",
    password: "Kata sandi",
    passwordPlaceholder: "Kata sandi",
    confirmPassword: "Konfirmasi kata sandi",
    confirmPasswordPlaceholder: "Konfirmasi kata sandi",
    hidePassword: "Sembunyikan kata sandi",
    showPassword: "Tampilkan kata sandi",
    agreePrefix: "Saya setuju dengan",
    terms: "Syarat Layanan",
    and: "dan",
    privacy: "Kebijakan Privasi",
    sendingCode: "Mengirim kode verifikasi...",
    orContinueWith: "Atau lanjutkan dengan",
    facebook: "Facebook",
    hasAccount: "Sudah punya akun?",
    agreeRequired: "Anda harus menyetujui Syarat dan Kebijakan Privasi.",
    passwordMin: "Kata sandi minimal 8 karakter.",
    passwordMismatch: "Kata sandi tidak cocok.",
    invalidEmail: "Masukkan alamat email yang valid.",
    emailAlreadyRegistered: "Email ini sudah terdaftar. Silakan masuk.",
    checkingAccount: "Memeriksa ketersediaan akun...",
    genericError: "Terjadi kesalahan",
    sendCodeFailed: "Gagal mengirim kode verifikasi.",
    googleFailed: "Daftar Google gagal.",
    facebookFailed: "Daftar Facebook gagal." } };
