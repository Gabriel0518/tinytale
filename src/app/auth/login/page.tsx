"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback} from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import dynamicImport from "next/dynamic";
import { useFacebookLogin } from "@/lib/facebookSdk";
import { useToast } from "@/components/ui/Toast";
import { TURNSTILE_SITE_KEY } from "@/lib/api";
import {localizePath, SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

// Dynamically import GoogleLoginButton to avoid SSR issues
const GoogleLoginButton = dynamicImport(
  () => import("@/components/auth/GoogleLoginButton").then(mod => ({ default: mod.GoogleLoginButton })),
  { ssr: false }
);

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

export default function LoginPage() {
  const locale = useLocale();
  const t = LOGIN_TEXT[locale] || LOGIN_TEXT.en;
  const router = useRouter();
  const { login, googleLogin, facebookLogin } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load Turnstile script and render widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

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
  }, []);

  const resetTurnstile = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setTurnstileToken('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Check Turnstile if configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(t.securityVerifyRequired);
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password, turnstileToken);
      router.push(localizePath("/user/profile", locale));
    } catch (err: unknown) {
      // Reset Turnstile on error
      resetTurnstile();
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (accessToken: string) => {
    setIsLoading(true);
    setError("");
    try {
      await googleLogin(accessToken);
      router.push(localizePath("/user/profile", locale));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.genericError;
      setError(message || t.googleLoginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = (error: string) => {
    setError(error);
  };

  const handleFacebookLogin = useFacebookLogin(
    async (accessToken) => {
      setIsLoading(true);
      setError("");
      try {
        await facebookLogin(accessToken);
        router.push(localizePath("/user/profile", locale));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.genericError;
        setError(message || t.facebookLoginFailed);
      } finally {
        setIsLoading(false);
      }
    },
    (error) => {
      setError(error);
    }
  );

  return (
    <AuthLayout
      navRight={
        <Link href={localizePath("/auth/register", locale)} className="transition hover:text-white">
          {t.signUp}
        </Link>
      }
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
        {/* Gold Lock Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">{t.signIn}</h1>
          <p className="mt-2 text-sm text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              {t.emailAddress}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-[#1a1c23] py-3 pl-10 pr-4 text-white placeholder-gray-500 transition focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="login-password" className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              {t.password}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-[#1a1c23] py-3 pl-10 pr-12 text-white placeholder-gray-500 transition focus:border-amber-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
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

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link href={localizePath("/auth/reset-password", locale)} className="text-sm text-amber-500 hover:underline">
              {t.forgotPassword}
            </Link>
          </div>

          {/* Cloudflare Turnstile */}
          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <div ref={turnstileRef} />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-medium text-white transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
          >
            {isLoading ? t.signingIn : t.signIn}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm text-gray-500">{t.orContinueWith}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <GoogleLoginButton
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            isLoading={isLoading}
            text="Google"
          />
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1c23] py-3 text-sm font-medium text-white transition hover:bg-[#22242b]"
          >
            <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t.facebook}
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-gray-400">
          {t.noAccount}{" "}
          <Link href={localizePath("/auth/register", locale)} className="text-amber-500 hover:underline">
            {t.signUp}
          </Link>
        </p>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link href={localizePath("/", locale)} className="text-sm text-gray-500 transition hover:text-gray-300">
            &larr; {t.backHome}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

const LOGIN_TEXT: Record<SupportedLocale, Record<string, string>> = {
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
    signingIn: "Signing in...",
    orContinueWith: "Or continue with",
    facebook: "Facebook",
    noAccount: "Don't have an account?",
    backHome: "Back to Home",
    securityVerifyRequired: "Please complete the security verification.",
    genericError: "An error occurred",
    loginFailed: "Login failed. Please try again.",
    googleLoginFailed: "Google login failed. Please try again.",
    facebookLoginFailed: "Facebook login failed. Please try again." },
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
    signingIn: "登录中...",
    orContinueWith: "或使用以下方式继续",
    facebook: "Facebook",
    noAccount: "还没有账号？",
    backHome: "返回首页",
    securityVerifyRequired: "请完成安全验证。",
    genericError: "发生错误",
    loginFailed: "登录失败，请重试。",
    googleLoginFailed: "Google 登录失败，请重试。",
    facebookLoginFailed: "Facebook 登录失败，请重试。" },
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
    signingIn: "ログイン中...",
    orContinueWith: "または次で続行",
    facebook: "Facebook",
    noAccount: "アカウントをお持ちでないですか？",
    backHome: "ホームに戻る",
    securityVerifyRequired: "セキュリティ認証を完了してください。",
    genericError: "エラーが発生しました",
    loginFailed: "ログインに失敗しました。再試行してください。",
    googleLoginFailed: "Google ログインに失敗しました。",
    facebookLoginFailed: "Facebook ログインに失敗しました。" },
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
    signingIn: "Iniciando sesión...",
    orContinueWith: "O continúa con",
    facebook: "Facebook",
    noAccount: "¿No tienes cuenta?",
    backHome: "Volver al inicio",
    securityVerifyRequired: "Completa la verificación de seguridad.",
    genericError: "Ocurrió un error",
    loginFailed: "Error de inicio de sesión. Inténtalo de nuevo.",
    googleLoginFailed: "Falló el inicio con Google.",
    facebookLoginFailed: "Falló el inicio con Facebook." },
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
    signingIn: "Entrando...",
    orContinueWith: "Ou continue com",
    facebook: "Facebook",
    noAccount: "Não tem uma conta?",
    backHome: "Voltar para a Home",
    securityVerifyRequired: "Conclua a verificação de segurança.",
    genericError: "Ocorreu um erro",
    loginFailed: "Falha no login. Tente novamente.",
    googleLoginFailed: "Falha no login com Google.",
    facebookLoginFailed: "Falha no login com Facebook." },
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
    signingIn: "साइन इन हो रहा है...",
    orContinueWith: "या इससे जारी रखें",
    facebook: "Facebook",
    noAccount: "खाता नहीं है?",
    backHome: "होम पर वापस जाएँ",
    securityVerifyRequired: "कृपया सुरक्षा सत्यापन पूरा करें।",
    genericError: "कोई त्रुटि हुई",
    loginFailed: "लॉगिन विफल हुआ।",
    googleLoginFailed: "Google लॉगिन विफल हुआ।",
    facebookLoginFailed: "Facebook लॉगिन विफल हुआ।" },
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
    signingIn: "Sedang masuk...",
    orContinueWith: "Atau lanjutkan dengan",
    facebook: "Facebook",
    noAccount: "Belum punya akun?",
    backHome: "Kembali ke Beranda",
    securityVerifyRequired: "Silakan selesaikan verifikasi keamanan.",
    genericError: "Terjadi kesalahan",
    loginFailed: "Gagal masuk. Coba lagi.",
    googleLoginFailed: "Login Google gagal.",
    facebookLoginFailed: "Login Facebook gagal." } };
