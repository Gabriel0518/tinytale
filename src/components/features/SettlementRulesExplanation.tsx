"use client";

import { Info, TrendingUp, Shield, DollarSign, Clock } from "lucide-react";

export function SettlementRulesExplanation() {
  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Settlement Rules
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Understand how your revenue is calculated and when you&apos;ll receive payments
          </p>
        </div>
      </div>

      {/* 收入分配示例 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">
          Revenue Split Example (Gold Tier)
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Based on $1,000 gross revenue
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
            <span className="text-gray-700">Gross Revenue</span>
            <span className="font-mono font-semibold text-gray-900">$1,000.00</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-2">
            <span className="text-gray-700">Payment Processing Fee (5%)</span>
            <span className="font-mono font-semibold text-orange-600">-$50.00</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 font-medium">
            <span className="text-gray-900">Distributable Amount</span>
            <span className="font-mono font-semibold text-gray-900">$950.00</span>
          </div>
          <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Your Share (70%)</span>
              <span className="font-mono font-semibold text-emerald-600">$665.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Platform Share (30%)</span>
              <span className="font-mono font-semibold text-gray-500">$285.00</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-violet-50 px-4 py-2">
            <span className="text-gray-700">Refund Reserve (10%)</span>
            <span className="font-mono font-semibold text-violet-600">-$100.00</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2 font-bold">
            <span className="text-emerald-700">Your Net Settlement</span>
            <span className="font-mono text-lg text-emerald-700">$565.00</span>
          </div>
        </div>
      </div>

      {/* 创作者等级 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Creator Tiers</h3>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Your revenue share increases as you grow on the platform
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥉</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bronze Tier</p>
                <p className="text-xs text-gray-600">New creators</p>
              </div>
            </div>
            <span className="text-lg font-bold text-amber-700">50%</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥈</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Silver Tier</p>
                <p className="text-xs text-gray-600">Established creators</p>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-700">60%</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥇</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Gold Tier</p>
                <p className="text-xs text-gray-600">Top performers</p>
              </div>
            </div>
            <span className="text-lg font-bold text-yellow-700">70%</span>
          </div>
        </div>
      </div>

      {/* 滚动储备金 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-900">Rolling Reserve</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-gray-700">
          We hold 10% of your gross revenue as a refund reserve for 30 days. This protects both you and the platform from refund risk.
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-violet-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              How it works
            </p>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-violet-600">•</span>
                <span>Month 1: We hold $100 from your $1,000 revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600">•</span>
                <span>Month 2: If no refunds occurred, we return the full $100</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-600">•</span>
                <span>If refunds occurred: We return (reserve - refunds)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Example with refunds
            </p>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <p>• Month 1 reserve: $100</p>
              <p>• Month 1 refunds: $30</p>
              <p>• Month 2 return: $70 ($100 - $30)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 支付时间表 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Payment Schedule</h3>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Monthly Statement</p>
              <p className="mt-1 text-xs text-gray-600">
                Generated on the 1st of each month for the previous month&apos;s revenue
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Review Period</p>
              <p className="mt-1 text-xs text-gray-600">
                48-hour review window for you to confirm or dispute the statement
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payout Release</p>
              <p className="mt-1 text-xs text-gray-600">
                Funds transferred to your verified bank account on the 5th of the month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 重要提示 */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Important Notes
            </p>
            <ul className="mt-2 space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Minimum payout threshold: $50 USD</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Bank account must be verified before payout release</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>All amounts are calculated in USD</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Payment processing fees cover Stripe and other payment gateway costs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
