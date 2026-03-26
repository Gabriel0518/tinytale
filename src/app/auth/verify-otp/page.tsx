'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense} from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import OTPInput from '@/components/ui/OTPInput';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { apiCombined as api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import {localizePath, SupportedLocale } from '@/lib/i18n';
import { useLocale } from "@/hooks/useLocale";
import { resolveLocaleCopy } from '@/lib/locale-copy';

function VerifyOTPContent() {
  const locale = useLocale();
  const t = resolveLocaleCopy(VERIFY_OTP_TEXT, locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: authRegister } = useAuth();

  const email = searchParams.get('email');
  const purpose = searchParams.get('purpose') as 'register' | 'login' | 'reset-password' | 'email-change';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!email || !purpose) {
      router.push(localizePath('/auth/login', locale));
    }
  }, [email, purpose, router, locale]);

  const handleVerify = async () => {
    if (code.length !== 6 || !email || !purpose) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Verify the code
      await api.verifyCode(email, code, purpose);

      // Step 2: Handle post-verification actions based on purpose
      if (purpose === 'register') {
        // Complete registration after successful verification
        const pendingData = sessionStorage.getItem('pendingRegistration');
        if (pendingData) {
          const { email, password, nickname, referredBy } = JSON.parse(pendingData);

          try {
            // Register the user using AuthContext (this will set login state)
            await authRegister(email, password, nickname, referredBy);

            // Clear pending data
            sessionStorage.removeItem('pendingRegistration');

            // Redirect to user profile page (user is now logged in)
            router.push(`${localizePath('/user/profile', locale)}?message=${encodeURIComponent(t.registerSuccessMessage)}`);
          } catch (regError: any) {
            setError(regError.message || t.registerFailed);
            setLoading(false);
            return;
          }
        } else {
          setError(t.registrationDataMissing);
          setLoading(false);
          return;
        }
      } else {
        // Handle other purposes
        switch (purpose) {
          case 'login':
            router.push(localizePath('/', locale));
            break;
          case 'reset-password':
            router.push(`${localizePath('/auth/reset-password/verify', locale)}?email=${encodeURIComponent(email)}`);
            break;
          case 'email-change':
            router.push(`${localizePath('/user/profile', locale)}?message=${encodeURIComponent(t.emailVerifiedMessage)}`);
            break;
          default:
            router.push(localizePath('/', locale));
        }
      }
    } catch (err: any) {
      setError(err.message || t.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !purpose) return;

    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.sendVerificationCode(email, purpose);
      setSuccessMessage(t.codeResent);
      setTimerReset(prev => prev + 1);
      setTimerExpired(false);
      setCode('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || t.resendFailed);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email || !purpose) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #4a4020 0%, #3a3318 100%)' }}>
        {/* Top Border Decoration */}
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, transparent 0%, #f2b90d 50%, transparent 100%)' }}></div>

        <div className="p-10">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(242, 185, 13, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z" fill="#f2b90d"/>
                <path d="M12 8C10.9 8 10 8.9 10 10V14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14V10C14 8.9 13.1 8 12 8Z" fill="#3a3318"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3" style={{ color: '#f5f5f5' }}>
              {t.title}
            </h2>
            <p className="text-sm" style={{ color: '#b8b8b8' }}>
              {t.subtitle}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <OTPInput
              value={code}
              onChange={setCode}
              error={!!error}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <p className="text-sm text-center" style={{ color: '#22c55e' }}>{successMessage}</p>
            </div>
          )}

          {/* Timer Section */}
          <div className="mb-8">
            <CountdownTimer
              initialSeconds={119}
              onExpire={() => setTimerExpired(true)}
              onReset={timerReset}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading || timerExpired}
              className="w-full py-4 font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: code.length === 6 && !loading && !timerExpired ? '#f2b90d' : '#8a7a3d',
                color: '#1a1a1a',
                boxShadow: '0 4px 14px rgba(242, 185, 13, 0.3)'
              }}
            >
              {loading ? t.verifying : t.verifyContinue}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {t.notReceived}{' '}
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-medium ml-1 disabled:opacity-50 hover:underline"
                  style={{ color: '#f2b90d' }}
                >
                  {resendLoading ? t.sending : t.resendCode}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Help */}
        <div className="px-8 py-4 flex items-center justify-center gap-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderTop: '1px solid rgba(242, 185, 13, 0.1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#6b7280" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            {t.contactSupport}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  const locale = useLocale();
  const t = resolveLocaleCopy(VERIFY_OTP_TEXT, locale);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F1014' }}>
          <div className="text-primary">{t.loading}</div>
        </div>
      }>
      <VerifyOTPContent />
    </Suspense>
  );
}

const VERIFY_OTP_TEXT: FlexibleRecord<SupportedLocale, Record<string, string>> = {
  en: {
    title: "Security Verification",
    subtitle: "We've sent a 6-digit verification code to your registered device. Please enter it below.",
    verifying: "Verifying...",
    verifyContinue: "Verify & Continue",
    notReceived: "Didn't receive the code?",
    sending: "Sending...",
    resendCode: "Resend Code",
    contactSupport: "Contact support for assistance",
    registerSuccessMessage: "Registration successful! Welcome to TinyTale.",
    registerFailed: "Registration failed. Please try again.",
    registrationDataMissing: "Registration data not found. Please start over.",
    emailVerifiedMessage: "Email verified successfully!",
    invalidCode: "Invalid verification code",
    codeResent: "Code resent successfully!",
    resendFailed: "Failed to resend code",
    loading: "Loading..." },
  zh: {
    title: "安全验证",
    subtitle: "我们已向你的设备发送 6 位验证码，请在下方输入。",
    verifying: "验证中...",
    verifyContinue: "验证并继续",
    notReceived: "没有收到验证码？",
    sending: "发送中...",
    resendCode: "重新发送",
    contactSupport: "如需帮助请联系支持",
    registerSuccessMessage: "注册成功！欢迎来到 TinyTale。",
    registerFailed: "注册失败，请重试。",
    registrationDataMissing: "未找到注册信息，请重新开始。",
    emailVerifiedMessage: "邮箱验证成功！",
    invalidCode: "验证码无效",
    codeResent: "验证码已重新发送！",
    resendFailed: "重新发送失败",
    loading: "加载中..." },
  ja: {
    title: "セキュリティ認証",
    subtitle: "6桁の認証コードを送信しました。下に入力してください。",
    verifying: "確認中...",
    verifyContinue: "確認して続行",
    notReceived: "コードが届きませんか？",
    sending: "送信中...",
    resendCode: "コード再送",
    contactSupport: "サポートにお問い合わせください",
    registerSuccessMessage: "登録成功！TinyTale へようこそ。",
    registerFailed: "登録に失敗しました。",
    registrationDataMissing: "登録データが見つかりません。",
    emailVerifiedMessage: "メール認証が完了しました！",
    invalidCode: "認証コードが無効です",
    codeResent: "コードを再送しました！",
    resendFailed: "再送に失敗しました",
    loading: "読み込み中..." },
  es: {
    title: "Verificación de seguridad",
    subtitle: "Enviamos un código de 6 dígitos. Introdúcelo abajo.",
    verifying: "Verificando...",
    verifyContinue: "Verificar y continuar",
    notReceived: "¿No recibiste el código?",
    sending: "Enviando...",
    resendCode: "Reenviar código",
    contactSupport: "Contacta a soporte para ayuda",
    registerSuccessMessage: "¡Registro exitoso! Bienvenido a TinyTale.",
    registerFailed: "El registro falló.",
    registrationDataMissing: "No se encontraron datos de registro.",
    emailVerifiedMessage: "¡Correo verificado con éxito!",
    invalidCode: "Código de verificación inválido",
    codeResent: "¡Código reenviado con éxito!",
    resendFailed: "No se pudo reenviar el código",
    loading: "Cargando..." },
  pt: {
    title: "Verificação de segurança",
    subtitle: "Enviamos um código de 6 dígitos. Digite abaixo.",
    verifying: "Verificando...",
    verifyContinue: "Verificar e continuar",
    notReceived: "Não recebeu o código?",
    sending: "Enviando...",
    resendCode: "Reenviar código",
    contactSupport: "Fale com o suporte para ajuda",
    registerSuccessMessage: "Cadastro concluído! Bem-vindo ao TinyTale.",
    registerFailed: "Falha no cadastro.",
    registrationDataMissing: "Dados de cadastro não encontrados.",
    emailVerifiedMessage: "E-mail verificado com sucesso!",
    invalidCode: "Código de verificação inválido",
    codeResent: "Código reenviado com sucesso!",
    resendFailed: "Falha ao reenviar código",
    loading: "Carregando..." },
  hi: {
    title: "सुरक्षा सत्यापन",
    subtitle: "हमने 6-अंकों का कोड भेजा है। कृपया नीचे दर्ज करें।",
    verifying: "सत्यापन हो रहा है...",
    verifyContinue: "सत्यापित करें और जारी रखें",
    notReceived: "कोड नहीं मिला?",
    sending: "भेजा जा रहा है...",
    resendCode: "कोड फिर भेजें",
    contactSupport: "सहायता के लिए सपोर्ट से संपर्क करें",
    registerSuccessMessage: "पंजीकरण सफल! TinyTale में आपका स्वागत है।",
    registerFailed: "पंजीकरण विफल रहा।",
    registrationDataMissing: "पंजीकरण डेटा नहीं मिला।",
    emailVerifiedMessage: "ईमेल सफलतापूर्वक सत्यापित हुआ!",
    invalidCode: "अमान्य सत्यापन कोड",
    codeResent: "कोड फिर से भेज दिया गया!",
    resendFailed: "कोड दोबारा भेजने में विफल",
    loading: "लोड हो रहा है..." },
  id: {
    title: "Verifikasi keamanan",
    subtitle: "Kami telah mengirim kode 6 digit. Masukkan di bawah.",
    verifying: "Memverifikasi...",
    verifyContinue: "Verifikasi & lanjutkan",
    notReceived: "Belum menerima kode?",
    sending: "Mengirim...",
    resendCode: "Kirim ulang kode",
    contactSupport: "Hubungi dukungan untuk bantuan",
    registerSuccessMessage: "Registrasi berhasil! Selamat datang di TinyTale.",
    registerFailed: "Registrasi gagal.",
    registrationDataMissing: "Data registrasi tidak ditemukan.",
    emailVerifiedMessage: "Email berhasil diverifikasi!",
    invalidCode: "Kode verifikasi tidak valid",
    codeResent: "Kode berhasil dikirim ulang!",
    resendFailed: "Gagal mengirim ulang kode",
    loading: "Memuat..." } };
