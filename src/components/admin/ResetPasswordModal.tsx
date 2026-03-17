"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/adminApi";
import { translateAdminText, useAdminLocale } from "@/lib/admin-i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  admin: { _id: string; username: string; fullName: string; email: string } | null;
}

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=";
  const all = upper + lower + digits + symbols;
  const pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = pw.length; i < 12; i++) {
    pw.push(all[Math.floor(Math.random() * all.length)]);
  }
  return pw.sort(() => Math.random() - 0.5).join("");
}

type Strength = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(pw: string): Strength {
  if (pw.length < 8) return "weak";
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  if (hasUpper && hasLower && hasDigit && hasSymbol) return "strong";
  if (hasUpper && hasLower) return "good";
  return "fair";
}

const strengthConfig: Record<Strength, { color: string; bars: number; label: string }> = {
  weak: { color: "bg-red-500", bars: 1, label: "Weak" },
  fair: { color: "bg-orange-500", bars: 2, label: "Fair" },
  good: { color: "bg-yellow-500", bars: 3, label: "Good" },
  strong: { color: "bg-green-500", bars: 4, label: "Strong" },
};

export default function ResetPasswordModal({ open, onClose, onConfirm, admin }: Props) {
  const { locale } = useAdminLocale();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
      setSendEmail(true);
      setSubmitting(false);
      setError("");
    }
  }, [open]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, handleEscape]);

  const handleSubmit = async () => {
    if (!admin || !password || password !== confirmPassword) return;
    setSubmitting(true);
    setError("");
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token") || "demo-token"
          : "demo-token";
      await api.post(
        `/api/admin/settings/admins/${admin._id}/reset-password`,
        { password, sendEmail },
        { token }
      );
      onConfirm();
    } catch (err: any) {
      setError(translateAdminText(err?.message || "Failed to reset password", locale));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !admin) return null;

  const strength = password ? getPasswordStrength(password) : null;
  const cfg = strength ? strengthConfig[strength] : null;
  const initials = admin.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = password.length >= 8 && passwordsMatch;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-700/50 bg-[#1a1a2e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-700/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Reset Password</h2>
              <p className="text-sm text-gray-400">Securely update access credentials.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700/50 hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {/* Target Admin Info */}
          <div className="rounded-lg border border-gray-700/50 bg-[#13131d] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Target Administrator</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="font-medium text-white">{admin.fullName}</p>
                <p className="text-sm text-gray-400">{admin.email}</p>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">New Password</label>
              <button
                type="button"
                onClick={() => {
                  const pw = generatePassword();
                  setPassword(pw);
                  setConfirmPassword(pw);
                }}
                className="rounded bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20"
              >
                Generate
              </button>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-gray-700/50 bg-[#13131d] py-2.5 pl-9 pr-10 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Strength Indicator */}
            {password && cfg && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i <= cfg.bars ? cfg.color : "bg-gray-700"}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Strength: <span className={cfg.color.replace("bg-", "text-")}>{cfg.label}</span>
                </p>
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-500">Min 8 chars, mixed case &amp; numbers.</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Confirm New Password</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full rounded-lg border bg-[#13131d] py-2.5 pl-9 pr-10 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:ring-1 ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-700/50 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
              >
                {showConfirm ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match.</p>
            )}
          </div>

          {/* Send email checkbox */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-[#13131d] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Send new password via email</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            {submitting ? "Resetting..." : "Confirm Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
