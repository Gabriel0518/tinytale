"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { passwordApi } from "@/lib/api";

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score: number): { label: string; color: string } {
  if (score <= 1) return { label: "Weak", color: "red" };
  if (score === 2) return { label: "Fair", color: "orange" };
  if (score === 3) return { label: "Medium", color: "yellow" };
  return { label: "Strong", color: "green" };
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedCode = sessionStorage.getItem('resetCode') || '';
    if (!email || !storedCode) {
      router.push('/auth/reset-password');
      return;
    }
    setCode(storedCode);
  }, [email, router]);

  const strength = getPasswordStrength(newPassword);
  const { label: strengthLabel } = getStrengthLabel(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await passwordApi.resetPassword(email, code, newPassword);
      sessionStorage.removeItem('resetCode');
      router.push("/auth/login?reset=success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      navRight={
        <Link href="/help" className="text-sm text-gray-400 hover:text-white transition">
          Help Center
        </Link>
      }
    >
      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <LockIcon className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Create New Password
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Your new password must be different from previous used passwords.
          </p>

          {/* Error */}
          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-900/50 border border-red-700 p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="verify-new-password" className="block uppercase text-xs tracking-wider text-gray-500 mb-2">
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="verify-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex gap-1.5 flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${getBarColor(i, strength)}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${getTextColor(strength)}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Must be at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="verify-confirm-password" className="block uppercase text-xs tracking-wider text-gray-500 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="verify-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-[#1a1c23] border border-white/10 rounded-lg py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg py-3 font-medium text-white transition disabled:opacity-50"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-1"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F1014]">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <NewPasswordContent />
    </Suspense>
  );
}
