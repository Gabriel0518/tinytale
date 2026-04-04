"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Award, ArrowUp, ArrowDown } from "lucide-react";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

interface TierStats {
  tier: 'bronze' | 'silver' | 'gold';
  count: number;
  percentage: number;
  avgRevenue: number;
  totalRevenue: number;
}

interface AnalyticsData {
  tierDistribution: TierStats[];
  totalCreators: number;
  totalRevenue: number;
  avgRevenuePerCreator: number;
  recentChanges: Array<{
    creatorName: string;
    oldTier: string;
    newTier: string;
    date: string;
  }>;
}

const TIER_CONFIG = {
  bronze: {
    label: 'Bronze',
    icon: '🥉',
    color: '#CD7F32',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    shareRate: 50,
  },
  silver: {
    label: 'Silver',
    icon: '🥈',
    color: '#C0C0C0',
    bgColor: 'bg-gray-400/10',
    textColor: 'text-gray-300',
    shareRate: 60,
  },
  gold: {
    label: 'Gold',
    icon: '🥇',
    color: '#FFD700',
    bgColor: 'bg-yellow-400/10',
    textColor: 'text-yellow-400',
    shareRate: 70,
  },
};

export default function CreatorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      // 这里调用后端 API 获取分析数据
      // const response = await adminApi.getCreatorAnalytics();

      // 模拟数据（实际应该从后端获取）
      const mockData: AnalyticsData = {
        tierDistribution: [
          { tier: 'bronze', count: 45, percentage: 60, avgRevenue: 1200, totalRevenue: 54000 },
          { tier: 'silver', count: 22, percentage: 29.3, avgRevenue: 3500, totalRevenue: 77000 },
          { tier: 'gold', count: 8, percentage: 10.7, avgRevenue: 8500, totalRevenue: 68000 },
        ],
        totalCreators: 75,
        totalRevenue: 199000,
        avgRevenuePerCreator: 2653,
        recentChanges: [
          { creatorName: 'Alice Chen', oldTier: 'bronze', newTier: 'silver', date: '2026-04-03' },
          { creatorName: 'Bob Smith', oldTier: 'silver', newTier: 'gold', date: '2026-04-02' },
          { creatorName: 'Carol Wang', oldTier: 'bronze', newTier: 'silver', date: '2026-04-01' },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        Failed to load analytics data
      </div>
    );
  }

  const maxCount = Math.max(...data.tierDistribution.map(t => t.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
              <h1 className="text-3xl font-bold text-white">Creator Analytics</h1>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Tier distribution, revenue analysis, and performance insights
            </p>
          </div>
        </div>
      </section>

      {/* Overview Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Creators</p>
              <p className="text-2xl font-bold text-white">{data.totalCreators}</p>
            </div>
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${(data.totalRevenue / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg per Creator</p>
              <p className="text-2xl font-bold text-white">
                ${data.avgRevenuePerCreator.toLocaleString()}
              </p>
            </div>
          </div>
        </article>

        <article className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gold Tier</p>
              <p className="text-2xl font-bold text-white">
                {data.tierDistribution.find(t => t.tier === 'gold')?.count || 0}
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* Tier Distribution */}
      <section className={panelClassName}>
        <h2 className="mb-4 text-lg font-semibold text-white">Tier Distribution</h2>
        <div className="space-y-4">
          {data.tierDistribution.map((tierStat) => {
            const config = TIER_CONFIG[tierStat.tier];
            const barWidth = (tierStat.count / maxCount) * 100;

            return (
              <div key={tierStat.tier} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className={`font-semibold ${config.textColor}`}>
                      {config.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({config.shareRate}% share)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {tierStat.count} creators ({tierStat.percentage.toFixed(1)}%)
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">
                      ${(tierStat.totalRevenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full ${config.bgColor} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Avg: ${tierStat.avgRevenue.toLocaleString()}/creator</span>
                  <span>Total: ${tierStat.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Revenue by Tier */}
      <section className="grid gap-4 md:grid-cols-3">
        {data.tierDistribution.map((tierStat) => {
          const config = TIER_CONFIG[tierStat.tier];
          const revenuePercentage = (tierStat.totalRevenue / data.totalRevenue) * 100;

          return (
            <article key={tierStat.tier} className={panelClassName}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  <span className={`font-semibold ${config.textColor}`}>
                    {config.label}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {config.shareRate}% share
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-400">Total Revenue</span>
                  <span className="text-xl font-bold text-white">
                    ${(tierStat.totalRevenue / 1000).toFixed(1)}k
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-400">Creators</span>
                  <span className="font-semibold text-gray-300">
                    {tierStat.count}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-400">Avg/Creator</span>
                  <span className="font-semibold text-gray-300">
                    ${tierStat.avgRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">% of Total</span>
                    <span className="text-sm font-semibold text-indigo-400">
                      {revenuePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Recent Tier Changes */}
      <section className={panelClassName}>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Tier Changes</h2>
        {data.recentChanges.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No recent tier changes</p>
        ) : (
          <div className="space-y-3">
            {data.recentChanges.map((change, idx) => {
              const oldConfig = TIER_CONFIG[change.oldTier as keyof typeof TIER_CONFIG];
              const newConfig = TIER_CONFIG[change.newTier as keyof typeof TIER_CONFIG];
              const isUpgrade = newConfig.shareRate > oldConfig.shareRate;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[#0f0f17] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg ${isUpgrade ? 'bg-green-500/10' : 'bg-orange-500/10'} p-2`}>
                      {isUpgrade ? (
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{change.creatorName}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(change.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${oldConfig.bgColor} ${oldConfig.textColor}`}>
                      {oldConfig.icon} {oldConfig.label}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${newConfig.bgColor} ${newConfig.textColor}`}>
                      {newConfig.icon} {newConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
