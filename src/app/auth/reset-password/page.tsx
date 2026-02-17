"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Call API to send reset email
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-success/20">
            <Mail size={32} className="text-accent-success" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Check Your Email</h1>
          <p className="mb-6 text-text-secondary">
            We&apos;ve sent a verification code to <span className="text-white">{email}</span>
          </p>
          <Link
            href="/auth/reset-password/verify"
            className="inline-block w-full rounded-lg bg-accent-primary py-3 font-medium text-white transition hover:bg-red-700"
          >
            Enter Verification Code
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-text-tertiary hover:text-white transition-colors"
          >
            Didn&apos;t receive it? Send again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-white transition hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-text-secondary">
            Enter your email and we&apos;ll send you a verification code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-white/10 bg-bg-elevated px-4 py-3 text-white placeholder-text-tertiary focus:border-accent-primary focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-accent-primary py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-tertiary">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-accent-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
