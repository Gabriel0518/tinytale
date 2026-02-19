"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

const countries = [
  "United States", "United Kingdom", "Canada", "Germany", "France",
  "Brazil", "India", "Australia", "Japan", "Mexico", "Spain", "Italy",
  "Netherlands", "South Korea", "Turkey", "Argentina", "Colombia",
  "Saudi Arabia", "United Arab Emirates", "Nigeria", "South Africa",
  "Egypt", "Indonesia", "Philippines", "Thailand", "Vietnam", "Poland",
  "Sweden", "Portugal", "Chile",
];

type PaymentMethod = "bank" | "trx-usdt" | "paypal";

export default function AffiliateApplyPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [fullName, setFullName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [promotionChannels, setPromotionChannels] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const charLimit = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("You must agree to the Affiliate Terms of Service.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const paymentInfo: any = { method: paymentMethod };
      if (paymentMethod === "bank") paymentInfo.accountNumber = accountNumber;
      else if (paymentMethod === "trx-usdt") paymentInfo.walletAddress = walletAddress;
      else if (paymentMethod === "paypal") paymentInfo.paypalEmail = paypalEmail;

      await promoterApi.apply(token!, {
        fullName,
        businessEmail,
        country,
        promotionChannels,
        paymentMethod: paymentInfo,
      });
      router.push("/affiliate/pending");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg bg-[#1a1a2e] border border-gray-700/50 text-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center mb-8">
          Apply for Affiliate Program
        </h1>

        {/* Progress Indicator */}
        <div className="mb-10">
          <p className="text-sm text-gray-400 text-center mb-2">
            Step 2 of 4 &mdash; 50%
          </p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
              style={{ width: "50%" }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white mb-1">
              Personal Information
            </h2>

            <div>
              <label className={labelClass}>Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Business Email</label>
              <input
                type="email"
                required
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Country / Region</label>
              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass + " appearance-none cursor-pointer"}
              >
                <option value="" disabled>
                  Select your country
                </option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white mb-1">
              Payment Configuration
            </h2>

            <div className="flex flex-wrap gap-4">
              {([
                { value: "bank", label: "Bank Transfer" },
                { value: "trx-usdt", label: "TRX-USDT" },
                { value: "paypal", label: "PayPal" },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition ${
                    paymentMethod === opt.value
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-700/50 bg-[#1a1a2e] text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="accent-purple-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {paymentMethod === "bank" && (
              <div>
                <label className={labelClass}>Account Number / IBAN</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number or IBAN"
                  className={inputClass}
                />
              </div>
            )}

            {paymentMethod === "trx-usdt" && (
              <div>
                <label className={labelClass}>USDT Wallet Address</label>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your TRC-20 wallet address"
                  className={inputClass}
                />
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div>
                <label className={labelClass}>PayPal Email</label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your@paypal.com"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Promotion Channels */}
          <div className="bg-[#13131d] border border-gray-800/50 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white mb-1">
              Promotion Channels
            </h2>
            <textarea
              required
              maxLength={charLimit}
              rows={4}
              value={promotionChannels}
              onChange={(e) => setPromotionChannels(e.target.value)}
              placeholder="Describe how you plan to promote (e.g. YouTube, blog, social media, email list...)"
              className={inputClass + " resize-none"}
            />
            <p className="text-xs text-gray-500 text-right">
              {promotionChannels.length}/{charLimit}
            </p>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 accent-purple-500 rounded"
            />
            <span className="text-sm text-gray-400">
              I agree to the{" "}
              <Link href="/help?tab=terms" className="text-purple-400 underline hover:text-purple-300">
                Affiliate Terms of Service
              </Link>
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
