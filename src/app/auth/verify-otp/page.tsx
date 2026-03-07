'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OTPInput from '@/components/ui/OTPInput';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { api } from '@/lib/api';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      router.push('/auth/login');
    }
  }, [email, purpose, router]);

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
          const { email, password, nickname } = JSON.parse(pendingData);

          try {
            // Register the user
            await api.register(email, password, nickname);

            // Clear pending data
            sessionStorage.removeItem('pendingRegistration');

            // Redirect to home page (user is now logged in)
            router.push('/?message=Registration successful! Welcome to TinyTale.');
          } catch (regError: any) {
            setError(regError.message || 'Registration failed. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          setError('Registration data not found. Please start over.');
          setLoading(false);
          return;
        }
      } else {
        // Handle other purposes
        switch (purpose) {
          case 'login':
            router.push('/');
            break;
          case 'reset-password':
            router.push(`/auth/reset-password/new?email=${email}`);
            break;
          case 'email-change':
            router.push('/user/profile?message=Email verified successfully!');
            break;
          default:
            router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
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
      setSuccessMessage('Code resent successfully!');
      setTimerReset(prev => prev + 1);
      setTimerExpired(false);
      setCode('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
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
              Security Verification
            </h2>
            <p className="text-sm" style={{ color: '#b8b8b8' }}>
              We've sent a 6-digit verification code to your registered device. Please enter it below.
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
              {loading ? 'Verifying...' : 'Verify & Continue'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                Didn't receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="font-medium ml-1 disabled:opacity-50 hover:underline"
                  style={{ color: '#f2b90d' }}
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
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
            Contact support for assistance
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F1014' }}>
        <div className="text-primary">Loading...</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
