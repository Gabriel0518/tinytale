"use client";

import { Shield, Clock, TrendingDown, Info } from "lucide-react";

interface ReserveBalanceDisplayProps {
  currentReserveUsd: number;
  expectedReturnDate: string;
  lastMonthRefundsUsd?: number;
}

export function ReserveBalanceDisplay({
  currentReserveUsd,
  expectedReturnDate,
  lastMonthRefundsUsd = 0,
}: ReserveBalanceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const expectedReturn = Math.max(0, currentReserveUsd - lastMonthRefundsUsd);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-violet-400" />
        <h3 className="text-lg font-bold text-[#0f172a]">Rolling Reserve</h3>
      </div>

      <p className="text-sm leading-6 text-[#64748b]">
        We hold 10% of your gross revenue as a refund reserve for 30 days. This protects both you and the platform from refund risk.
      </p>

      {/* Current Reserve */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Current Reserve Balance
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-violet-700">
              {formatCurrency(currentReserveUsd)}
            </p>
            <p className="mt-2 text-xs text-violet-600">
              From last month&apos;s revenue
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
            <Shield className="h-6 w-6 text-violet-600" />
          </div>
        </div>
      </div>

      {/* Expected Return */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Expected Return
            </p>
          </div>
          <p className="mt-2 text-xl font-bold text-[#0f172a]">
            {formatDate(expectedReturnDate)}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            In your next settlement
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Amount Returning
            </p>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600">
            {formatCurrency(expectedReturn)}
          </p>
          {lastMonthRefundsUsd > 0 && (
            <p className="mt-1 text-xs text-gray-600">
              After {formatCurrency(lastMonthRefundsUsd)} refunds
            </p>
          )}
        </div>
      </div>

      {/* How it Works */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">How it works</p>
            <ul className="mt-2 space-y-1.5 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>We hold 10% of your gross revenue each month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>If no refunds occur, the full amount returns next month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>If refunds occur, we deduct them from the reserve</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Any remaining balance is returned to you</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
