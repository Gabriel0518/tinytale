"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useFacebookLogin } from "@/lib/facebookSdk";
import { TURNSTILE_SITE_KEY } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";
import { usePlatform } from "@/hooks/usePlatform";
import { resolveLocaleCopy } from '@/lib/locale-copy';
import { dismissActiveKeyboard } from "@/lib/capacitor-bridge";
import { loginWithNativeFacebook, loginWithNativeGoogle } from "@/lib/native-social-login";

// Type declaration for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const REMEMBERED_LOGIN_EMAIL_KEY = "tinytale.remembered-login-email";

export default function LoginPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(LOGIN_TEXT, locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isAndroid, isApp } = usePlatform();
  const { login, googleLogin, facebookLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [shouldLoadTurnstile, setShouldLoadTurnstile] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const postLoginTarget = useMemo(() => {
    const redirect = (searchParams.get("redirect") || searchParams.get("returnUrl") || "").trim();
    if (redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }
    return localizePath("/user/profile", locale);
  }, [searchParams, locale]);
  const useAndroidNativeKeyboardLayout = isApp && isAndroid;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_LOGIN_EMAIL_KEY);
    if (!rememberedEmail) return;
    setEmail(rememberedEmail);
    setRememberMe(true);
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    if (!isMobile) {
      setShouldLoadTurnstile(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setShouldLoadTurnstile(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isMobile]);

  // Load Turnstile script and render widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !shouldLoadTurnstile) return;

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current) return;
      // Remove existing widget if any
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken('') });
    };

    // If script already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => renderWidget();
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [shouldLoadTurnstile]);

  const resetTurnstile = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken('');
  }, []);

  const completeAuthRedirect = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.assign(postLoginTarget);
      return;
    }
    router.push(postLoginTarget);
  }, [postLoginTarget, router]);

  const handleClose = useCallback(() => {
    void dismissActiveKeyboard();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(localizePath("/", locale));
  }, [locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    let shouldKeepLoading = false;
    const normalizedEmail = email.trim().toLowerCase();

    // Check Turnstile if configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(t.securityVerifyRequired);
      setIsLoading(false);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_LOGIN_EMAIL_KEY, normalizedEmail);
        } else {
          window.localStorage.removeItem(REMEMBERED_LOGIN_EMAIL_KEY);
        }
      }

      await login(normalizedEmail, password, turnstileToken);
      shouldKeepLoading = true;
      completeAuthRedirect();
    } catch (err: unknown) {
      // Reset Turnstile on error
      resetTurnstile();
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.loginFailed);
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLoginSuccess = useCallback(async (accessToken: string, idToken?: string) => {
    setIsLoading(true);
    setError("");
    let shouldKeepLoading = false;
    try {
      await googleLogin(idToken ? { accessToken, idToken } : accessToken);
      shouldKeepLoading = true;
      completeAuthRedirect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.googleLoginFailed);
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
    }
  }, [completeAuthRedirect, googleLogin, t.genericError, t.googleLoginFailed]);

  const handleGoogleLoginError = (error: string) => {
    setError(error);
  };

  const handleGoogleButtonClick = useCallback(async () => {
    if (!isApp) {
      return;
    }

    try {
      const result = await loginWithNativeGoogle();
      await handleGoogleLoginSuccess(result.accessToken, result.idToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.googleLoginFailed;
      setError(message || t.googleLoginFailed);
    }
  }, [handleGoogleLoginSuccess, isApp, t.googleLoginFailed]);

  const handleFacebookWebLogin = useFacebookLogin(
    async (accessToken) => {
      setIsLoading(true);
      setError("");
      let shouldKeepLoading = false;
      try {
        await facebookLogin(accessToken);
        shouldKeepLoading = true;
        completeAuthRedirect();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.genericError;
        setError(message || t.facebookLoginFailed);
      } finally {
        if (!shouldKeepLoading) {
          setIsLoading(false);
        }
      }
    },
    (error) => {
      setError(error);
    }
  );

  const handleFacebookLogin = useCallback(async () => {
    if (!isApp) {
      handleFacebookWebLogin();
      return;
    }

    setIsLoading(true);
    setError("");
    let shouldKeepLoading = false;
    try {
      const result = await loginWithNativeFacebook();
      await facebookLogin(result.accessToken);
      shouldKeepLoading = true;
      completeAuthRedirect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.facebookLoginFailed;
      setError(message || t.facebookLoginFailed);
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
    }
  }, [completeAuthRedirect, facebookLogin, handleFacebookWebLogin, isApp, t.facebookLoginFailed]);

  return (
    <AuthLayout
      mobileHeader={
        <header className="flex items-center justify-end px-6 pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.backHome}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
      }
      navRight={
        <Link href={localizePath("/auth/register", locale)} className="transition hover:text-white">
          {t.signUp}
        </Link>
      }
      contentClassName="items-start justify-start px-0 pb-0 pt-0 md:items-center md:justify-center md:px-4 md:py-8"
      hideFooterOnMobile
    >
      <>
        {isLoading ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#06070b]/96 px-6">
            <div className="w-full max-w-xs rounded-[24px] border border-white/10 bg-[#11131a] px-8 py-8 text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-white/15 border-t-[#ff6c82]" />
              <p className="text-lg font-semibold text-white">{t.loadingTitle}</p>
              <p className="mt-2 text-sm leading-6 text-gray-300">{t.loadingDescription}</p>
            </div>
          </div>
        ) : null}

        <div
          className={`${useAndroidNativeKeyboardLayout ? "overflow-visible" : "keyboard-safe-scroll keyboard-safe-form"} relative flex min-h-0 w-full flex-1 flex-col bg-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 md:max-w-md md:flex-none md:overflow-visible md:rounded-[28px] md:border md:border-white/10 md:bg-[#12151d] md:p-8`}
          style={
            isMobile && !useAndroidNativeKeyboardLayout
              ? {
                  maxHeight:
                    'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - min(var(--tinytale-keyboard-inset, 0px), 16rem) - 0.5rem)',
                }
              : undefined
          }
        >
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="mb-8 hidden justify-center md:flex">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <div className="mb-8 md:mb-6 md:text-center">
              <h1 className="text-[2.05rem] font-semibold tracking-[-0.04em] text-white md:text-2xl md:font-bold md:tracking-normal">
                {t.signIn}
              </h1>
              <p className="mt-2 max-w-[18rem] text-sm leading-6 text-white/55 md:mx-auto md:max-w-none md:text-sm md:text-gray-400">
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
                <label htmlFor="login-email" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                  {t.emailAddress}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-500 md:block">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="next"
                    autoCapitalize="none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:pr-4 md:placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-semibold text-white/92 md:text-xs md:uppercase md:tracking-[0.24em] md:text-gray-500">
                  {t.password}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 text-gray-500 md:block">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="h-12 w-full rounded-xl border border-white/10 bg-transparent px-4 pr-12 text-sm text-white placeholder:text-white/28 transition focus:border-[#ff5f80] focus:outline-none md:rounded-lg md:bg-[#1a1c23] md:pl-10 md:placeholder:text-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white/70 md:right-3 md:text-gray-500 md:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs text-white/78">
                <label className="inline-flex cursor-pointer items-center gap-2 text-white/78">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-full border border-white/15 bg-transparent text-[#ff5f80] focus:ring-[#ff5f80]/30"
                  />
                  <span>{t.rememberMe}</span>
                </label>
                <Link href={localizePath("/auth/reset-password", locale)} className="font-medium text-white/82 transition hover:text-white md:text-amber-500 md:hover:underline">
                  {t.forgotPassword}
                </Link>
              </div>

              {TURNSTILE_SITE_KEY && shouldLoadTurnstile && (
                <div className="flex justify-center">
                  <div ref={turnstileRef} />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full rounded-xl bg-white text-sm font-semibold text-[#0b0d10] transition hover:bg-white/90 disabled:opacity-50 md:rounded-lg md:bg-gradient-to-r md:from-amber-500 md:to-amber-600 md:text-white md:hover:from-amber-600 md:hover:to-amber-700"
              >
                {isLoading ? t.signingIn : t.signIn}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4 md:my-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-white/40 md:text-sm md:text-gray-500">{t.orContinueWith}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent text-sm font-medium text-white transition hover:bg-white/[0.04] md:rounded-lg md:bg-[#1a1c23] md:hover:bg-[#22242b]"
              >
                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {t.facebook}
              </button>
              <GoogleLoginButton
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                onClick={isApp ? handleGoogleButtonClick : undefined}
                isLoading={isLoading}
                text="Google"
                loadingText={t.signingIn}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-medium text-white transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50 md:rounded-lg md:bg-[#1a1c23] md:hover:bg-[#22242b]"
              />
            </div>

            <div className="mt-auto pt-8">
              <p className="text-center text-sm text-white/50 md:text-gray-400">
                {t.noAccount}{" "}
                <Link href={localizePath("/auth/register", locale)} className="font-semibold text-white underline decoration-white/60 underline-offset-2 transition hover:text-white/80 md:text-amber-500 md:no-underline md:hover:underline">
                  {t.signUp}
                </Link>
              </p>

              <div className="mt-4 hidden text-center md:block">
                <Link href={localizePath("/", locale)} className="text-sm text-gray-500 transition hover:text-gray-300">
                  &larr; {t.backHome}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    </AuthLayout>
  );
}

const LOGIN_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    signUp: "Sign Up",
    signIn: "Sign In",
    subtitle: "Welcome back! Sign in to continue watching your favorite dramas.",
    emailAddress: "Email Address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    forgotPassword: "Forgot password?",
    rememberMe: "Remember Me",
    signingIn: "Signing in...",
    orContinueWith: "Or continue with",
    facebook: "Facebook",
    noAccount: "Don't have an account?",
    backHome: "Back to Home",
    securityVerifyRequired: "Please complete the security verification.",
    genericError: "An error occurred",
    loginFailed: "Login failed. Please try again.",
    googleLoginFailed: "Google login failed. Please try again.",
    facebookLoginFailed: "Facebook login failed. Please try again.",
    loadingTitle: "Preparing your session",
    loadingDescription: "Please wait a moment while we securely sign you in." },
  zh: {
    signUp: "注册",
    signIn: "登录",
    subtitle: "欢迎回来！登录后继续观看你喜欢的短剧。",
    emailAddress: "邮箱地址",
    emailPlaceholder: "you@example.com",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    hidePassword: "隐藏密码",
    showPassword: "显示密码",
    forgotPassword: "忘记密码？",
    rememberMe: "记住我",
    signingIn: "登录中...",
    orContinueWith: "或使用以下方式继续",
    facebook: "Facebook",
    noAccount: "还没有账号？",
    backHome: "返回首页",
    securityVerifyRequired: "请完成安全验证。",
    genericError: "发生错误",
    loginFailed: "登录失败，请重试。",
    googleLoginFailed: "Google 登录失败，请重试。",
    facebookLoginFailed: "Facebook 登录失败，请重试。",
    loadingTitle: "正在进入账号",
    loadingDescription: "网络较慢时会多等待几秒，请保持当前页面。" },
  ja: {
    signUp: "新規登録",
    signIn: "ログイン",
    subtitle: "おかえりなさい。ログインして視聴を続けましょう。",
    emailAddress: "メールアドレス",
    emailPlaceholder: "you@example.com",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    hidePassword: "パスワードを隠す",
    showPassword: "パスワードを表示",
    forgotPassword: "パスワードをお忘れですか？",
    rememberMe: "ログイン状態を保持",
    signingIn: "ログイン中...",
    orContinueWith: "または次で続行",
    facebook: "Facebook",
    noAccount: "アカウントをお持ちでないですか？",
    backHome: "ホームに戻る",
    securityVerifyRequired: "セキュリティ認証を完了してください。",
    genericError: "エラーが発生しました",
    loginFailed: "ログインに失敗しました。再試行してください。",
    googleLoginFailed: "Google ログインに失敗しました。",
    facebookLoginFailed: "Facebook ログインに失敗しました。",
    loadingTitle: "セッションを準備しています",
    loadingDescription: "安全にログインしています。少々お待ちください。" },
  es: {
    signUp: "Registrarse",
    signIn: "Entrar",
    subtitle: "¡Bienvenido de nuevo! Inicia sesión para seguir viendo tus dramas favoritos.",
    emailAddress: "Correo electrónico",
    emailPlaceholder: "you@example.com",
    password: "Contraseña",
    passwordPlaceholder: "Introduce tu contraseña",
    hidePassword: "Ocultar contraseña",
    showPassword: "Mostrar contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    rememberMe: "Recordarme",
    signingIn: "Iniciando sesión...",
    orContinueWith: "O continúa con",
    facebook: "Facebook",
    noAccount: "¿No tienes cuenta?",
    backHome: "Volver al inicio",
    securityVerifyRequired: "Completa la verificación de seguridad.",
    genericError: "Ocurrió un error",
    loginFailed: "Error de inicio de sesión. Inténtalo de nuevo.",
    googleLoginFailed: "Falló el inicio con Google.",
    facebookLoginFailed: "Falló el inicio con Facebook.",
    loadingTitle: "Preparando tu sesión",
    loadingDescription: "Espera un momento mientras completamos el inicio de sesión." },
  pt: {
    signUp: "Cadastrar",
    signIn: "Entrar",
    subtitle: "Bem-vindo de volta! Faça login para continuar assistindo.",
    emailAddress: "E-mail",
    emailPlaceholder: "you@example.com",
    password: "Senha",
    passwordPlaceholder: "Digite sua senha",
    hidePassword: "Ocultar senha",
    showPassword: "Mostrar senha",
    forgotPassword: "Esqueceu a senha?",
    rememberMe: "Lembrar de mim",
    signingIn: "Entrando...",
    orContinueWith: "Ou continue com",
    facebook: "Facebook",
    noAccount: "Não tem uma conta?",
    backHome: "Voltar para a Home",
    securityVerifyRequired: "Conclua a verificação de segurança.",
    genericError: "Ocorreu um erro",
    loginFailed: "Falha no login. Tente novamente.",
    googleLoginFailed: "Falha no login com Google.",
    facebookLoginFailed: "Falha no login com Facebook.",
    loadingTitle: "Preparando sua sessão",
    loadingDescription: "Aguarde um instante enquanto concluímos seu login." },
  hi: {
    signUp: "साइन अप",
    signIn: "साइन इन",
    subtitle: "वापसी पर स्वागत है! देखने के लिए लॉगिन करें।",
    emailAddress: "ईमेल पता",
    emailPlaceholder: "you@example.com",
    password: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    hidePassword: "पासवर्ड छिपाएँ",
    showPassword: "पासवर्ड दिखाएँ",
    forgotPassword: "पासवर्ड भूल गए?",
    rememberMe: "मुझे याद रखें",
    signingIn: "साइन इन हो रहा है...",
    orContinueWith: "या इससे जारी रखें",
    facebook: "Facebook",
    noAccount: "खाता नहीं है?",
    backHome: "होम पर वापस जाएँ",
    securityVerifyRequired: "कृपया सुरक्षा सत्यापन पूरा करें।",
    genericError: "कोई त्रुटि हुई",
    loginFailed: "लॉगिन विफल हुआ।",
    googleLoginFailed: "Google लॉगिन विफल हुआ।",
    facebookLoginFailed: "Facebook लॉगिन विफल हुआ।",
    loadingTitle: "आपका सत्र तैयार किया जा रहा है",
    loadingDescription: "कृपया कुछ क्षण प्रतीक्षा करें, हम आपको सुरक्षित रूप से लॉगिन कर रहे हैं।" },
  id: {
    signUp: "Daftar",
    signIn: "Masuk",
    subtitle: "Selamat datang kembali! Masuk untuk lanjut menonton drama favoritmu.",
    emailAddress: "Alamat email",
    emailPlaceholder: "you@example.com",
    password: "Kata sandi",
    passwordPlaceholder: "Masukkan kata sandi",
    hidePassword: "Sembunyikan kata sandi",
    showPassword: "Tampilkan kata sandi",
    forgotPassword: "Lupa kata sandi?",
    rememberMe: "Ingat saya",
    signingIn: "Sedang masuk...",
    orContinueWith: "Atau lanjutkan dengan",
    facebook: "Facebook",
    noAccount: "Belum punya akun?",
    backHome: "Kembali ke Beranda",
    securityVerifyRequired: "Silakan selesaikan verifikasi keamanan.",
    genericError: "Terjadi kesalahan",
    loginFailed: "Gagal masuk. Coba lagi.",
    googleLoginFailed: "Login Google gagal.",
    facebookLoginFailed: "Login Facebook gagal.",
    loadingTitle: "Menyiapkan sesi Anda",
    loadingDescription: "Mohon tunggu sebentar, kami sedang menyelesaikan proses masuk Anda." } };
