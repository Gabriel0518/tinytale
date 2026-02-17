"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { passwordApi } from "@/lib/api";

export default function ResetPasswordPage() {
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
      setError("Please enter your email address.");
      return;
    }
    setIsSending(true);
    setError("");
    try {
      await passwordApi.sendResetCode(email);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || "Failed to send verification code.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setError("Please enter both email and verification code.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await passwordApi.verifyCode(email, code);
      router.push(`/auth/reset-password/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
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
        <h1 className="mb-2 text-center text-2xl font-bold text-white">Reset Password</h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Enter your email address and verification code to reset your password.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Email Address
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input
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
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
              Verification Code
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="w-full rounded-lg border border-white/10 bg-[#1a1c23] py-3 pl-10 pr-24 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || countdown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending..." : countdown > 0 ? `${countdown}s` : "Get Code"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-semibold text-black transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify and Reset"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-white/10" />

        {/* Back to Sign In */}
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-gray-400 transition hover:text-white">
            <svg className="mr-1 inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
