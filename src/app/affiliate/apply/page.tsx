"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { promoterApi } from "@/lib/api";

const countries = [
  // East Asia
  "China", "Hong Kong", "Macau", "Taiwan", "Japan", "South Korea",
  "North Korea", "Mongolia",
  // Southeast Asia
  "Brunei", "Cambodia", "Indonesia", "Laos", "Malaysia", "Myanmar",
  "Philippines", "Singapore", "Thailand", "Timor-Leste", "Vietnam",
  // South Asia
  "Afghanistan", "Bangladesh", "Bhutan", "India", "Maldives", "Nepal",
  "Pakistan", "Sri Lanka",
  // Central Asia
  "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Uzbekistan",
  // West Asia / Middle East
  "Armenia", "Azerbaijan", "Bahrain", "Cyprus", "Georgia", "Iran", "Iraq",
  "Israel", "Jordan", "Kuwait", "Lebanon", "Oman", "Palestine", "Qatar",
  "Saudi Arabia", "Syria", "Turkey", "United Arab Emirates", "Yemen",
  // Europe
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy",
  "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta",
  "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia",
  "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino",
  "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
  "Ukraine", "United Kingdom", "Vatican City",
  // North America & Caribbean
  "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Canada",
  "Costa Rica", "Cuba", "Dominica", "Dominican Republic", "El Salvador",
  "Grenada", "Guatemala", "Haiti", "Honduras", "Jamaica", "Mexico",
  "Nicaragua", "Panama", "Puerto Rico", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Trinidad and Tobago", "United States",
  // South America
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador",
  "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela",
  // Africa
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo", "Côte d'Ivoire", "Democratic Republic of the Congo", "Djibouti",
  "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon",
  "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho",
  "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
  "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "São Tomé and Príncipe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  // Oceania
  "Australia", "Fiji", "Guam", "Kiribati", "Marshall Islands", "Micronesia",
  "Nauru", "New Zealand", "Palau", "Papua New Guinea", "Samoa",
  "Solomon Islands", "Tonga", "Tuvalu", "Vanuatu",
].sort();

type PaymentMethod = "bank" | "trx-usdt" | "paypal";

export default function AffiliateApplyPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [fullName, setFullName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [country, setCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ibanSwiftCode, setIbanSwiftCode] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [bankCity, setBankCity] = useState("");
  const [bankState, setBankState] = useState("");
  const [bankPostalCode, setBankPostalCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [promotionChannels, setPromotionChannels] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const charLimit = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("You must agree to the Affiliate Terms of Service.");
      return;
    }
    if (!token) {
      router.push(`/auth/login?redirect=/affiliate/apply`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const paymentInfo: any = { method: paymentMethod };
      if (paymentMethod === "bank") {
        paymentInfo.bankName = bankName;
        paymentInfo.branchName = branchName;
        paymentInfo.accountNumber = accountNumber;
        paymentInfo.ibanSwiftCode = ibanSwiftCode;
        paymentInfo.address = bankAddress;
        paymentInfo.city = bankCity;
        paymentInfo.state = bankState;
        paymentInfo.postalCode = bankPostalCode;
      } else if (paymentMethod === "trx-usdt") paymentInfo.walletAddress = walletAddress;
      else if (paymentMethod === "paypal") paymentInfo.paypalEmail = paypalEmail;

      await promoterApi.apply(token, {
        fullName,
        businessEmail,
        country,
        promotionChannels,
        paymentMethod: paymentInfo,
      });
      router.push("/affiliate/pending");
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("invalid token") || msg.toLowerCase().includes("no token")) {
        router.push(`/auth/login?redirect=/affiliate/apply`);
        return;
      }
      setError(msg);
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Chase Bank, HSBC"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Branch Name</label>
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Main Street Branch"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Account Number</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter your account number"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>IBAN / SWIFT Code</label>
                    <input
                      type="text"
                      required
                      value={ibanSwiftCode}
                      onChange={(e) => setIbanSwiftCode(e.target.value)}
                      placeholder="e.g. CHASUS33 or GB29NWBK..."
                      className={inputClass}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 -mt-1">Personal Address (for bank verification)</p>

                <div>
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text"
                    required
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    placeholder="123 Main Street, Apt 4B"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      required
                      value={bankCity}
                      onChange={(e) => setBankCity(e.target.value)}
                      placeholder="City"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State / Province</label>
                    <input
                      type="text"
                      required
                      value={bankState}
                      onChange={(e) => setBankState(e.target.value)}
                      placeholder="State"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Postal Code</label>
                    <input
                      type="text"
                      required
                      value={bankPostalCode}
                      onChange={(e) => setBankPostalCode(e.target.value)}
                      placeholder="Zip / Postal"
                      className={inputClass}
                    />
                  </div>
                </div>
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
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-purple-400 underline hover:text-purple-300"
              >
                Affiliate Terms of Service
              </button>
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

      {/* Affiliate Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#13131d] border border-gray-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">Affiliate Program Terms of Service</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-white transition text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-gray-300 leading-relaxed flex-1">
              <p className="text-xs text-gray-500">Last Updated: February 2026</p>

              <section>
                <h3 className="text-white font-semibold mb-2">1. Introduction</h3>
                <p>
                  Welcome to the TinyTale Affiliate Program (&quot;Program&quot;). By applying to and participating in this Program, you (&quot;Affiliate&quot;, &quot;you&quot;, or &quot;your&quot;) agree to be bound by these Affiliate Terms of Service (&quot;Agreement&quot;). This Agreement is between you and TinyTale Inc. (&quot;TinyTale&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">2. Program Enrollment</h3>
                <p>
                  To enroll in the Program, you must submit an application through our website. We reserve the right to accept or reject any application at our sole discretion. You must be at least 18 years of age and have a valid payment method to participate. Providing false or misleading information in your application will result in immediate disqualification.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">3. Commission Structure</h3>
                <p>
                  Affiliates earn commissions based on qualifying actions generated through their unique referral links. The current commission rate is up to 50% revenue share on referred user purchases. Commission rates may be adjusted at any time with 30 days prior notice. Commissions are calculated on net revenue after refunds, chargebacks, and applicable taxes.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">4. Payment Terms</h3>
                <p>
                  Commissions are paid on a monthly basis, with a minimum payout threshold of $50 USD. Payments are processed within 15 business days after the end of each calendar month. You are responsible for providing accurate payment information and for any taxes owed on commission income. TinyTale supports payments via bank transfer, TRX-USDT, and PayPal.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">5. Affiliate Obligations</h3>
                <p>As an Affiliate, you agree to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  <li>Promote TinyTale in a professional and ethical manner</li>
                  <li>Not engage in spam, unsolicited messaging, or deceptive advertising</li>
                  <li>Not use paid search ads that bid on TinyTale branded keywords</li>
                  <li>Not create fake accounts or generate fraudulent referrals</li>
                  <li>Comply with all applicable laws and regulations, including FTC disclosure requirements</li>
                  <li>Clearly disclose your affiliate relationship in all promotional content</li>
                  <li>Not make false or misleading claims about TinyTale products or services</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">6. Prohibited Activities</h3>
                <p>The following activities are strictly prohibited and will result in immediate termination:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  <li>Self-referrals or referring your own accounts</li>
                  <li>Cookie stuffing, click fraud, or traffic manipulation</li>
                  <li>Using malware, adware, or browser extensions to generate referrals</li>
                  <li>Promoting TinyTale on adult, violent, or illegal content websites</li>
                  <li>Impersonating TinyTale or creating confusingly similar branding</li>
                  <li>Incentivizing users to sign up solely for the purpose of earning commissions</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">7. Intellectual Property</h3>
                <p>
                  TinyTale grants you a limited, non-exclusive, revocable license to use our approved marketing materials, logos, and creative assets solely for the purpose of promoting TinyTale under this Program. You may not modify our trademarks or create derivative works without prior written consent.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">8. Cookie Duration & Attribution</h3>
                <p>
                  Referral tracking uses a 30-day cookie window. If a referred user makes a qualifying purchase within 30 days of clicking your referral link, you will receive the applicable commission. Last-click attribution applies when multiple affiliates refer the same user.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">9. Termination</h3>
                <p>
                  Either party may terminate this Agreement at any time with 14 days written notice. TinyTale may immediately terminate your participation if you violate any terms of this Agreement. Upon termination, all pending commissions above the minimum threshold will be paid within 30 days, provided they were earned through legitimate means. Any commissions earned through fraudulent activity will be forfeited.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">10. Limitation of Liability</h3>
                <p>
                  TinyTale shall not be liable for any indirect, incidental, special, or consequential damages arising from your participation in the Program. Our total liability shall not exceed the total commissions paid to you in the 12 months preceding any claim. We are not responsible for technical issues, tracking failures, or third-party service disruptions that may affect commission tracking.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">11. Modifications</h3>
                <p>
                  TinyTale reserves the right to modify these terms at any time. Material changes will be communicated via email at least 30 days before taking effect. Your continued participation in the Program after such changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">12. Governing Law</h3>
                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under this Agreement shall be resolved through binding arbitration in San Francisco, California.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-700/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700/50 hover:border-gray-600 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
