"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"code" | "password">("code");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setIsLoading(true);
    try {
      // TODO: Verify code with API
      await new Promise((r) => setTimeout(r, 800));
      setStep("password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Call reset password API
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-white transition hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        {step === "code" ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Enter Code</h1>
              <p className="mt-2 text-text-secondary">
                Enter the 6-digit code sent to your email
              </p>
            </div>
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex justify-center gap-3">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="h-14 w-12 rounded-lg border border-white/10 bg-bg-elevated text-center text-xl font-bold text-white focus:border-accent-primary focus:outline-none"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={isLoading || code.join("").length !== 6}
                className="w-full rounded-lg bg-accent-primary py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">New Password</h1>
              <p className="mt-2 text-text-secondary">
                Create a new password for your account
              </p>
            </div>
            {error && (
              <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-3 pr-12 text-white placeholder-text-tertiary focus:border-accent-primary focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-3 text-white placeholder-text-tertiary focus:border-accent-primary focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-accent-primary py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
