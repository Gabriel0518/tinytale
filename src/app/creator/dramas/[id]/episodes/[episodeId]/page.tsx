'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock3, Eye, Film, Globe2, Lock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { creatorApi } from '@/lib/api';
import { localizePath } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';
import type { CreatorDramaAnalytics, CreatorEpisodeItem } from '@/types/creator';

interface CreatorEpisodeDetailPageProps {
  params: {
    id: string;
    episodeId: string;
  };
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: typeof Eye }) {
  return (
    <article className="rounded-[24px] border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)]">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#1876f2]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{label}</p>
      <p className="mt-1 text-[22px] font-black tracking-[-0.03em] text-[#0f172a]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748b]">{helper}</p>
    </article>
  );
}

export default function CreatorEpisodeDetailPage({ params }: CreatorEpisodeDetailPageProps) {
  const locale = useLocale();
  const { token } = useAuth();
  const [episode, setEpisode] = useState<CreatorEpisodeItem | null>(null);
  const [dramaTitle, setDramaTitle] = useState('');
  const [analytics, setAnalytics] = useState<CreatorDramaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      creatorApi.getDramaById(token, params.id),
      creatorApi.getDramaEpisodes(token, params.id),
      creatorApi.getDramaAnalytics(token, params.id, '30d'),
    ])
      .then(([dramaRes, episodesRes, analyticsRes]) => {
        if (cancelled) return;
        const dramaData = dramaRes?.data;
        const episodes = episodesRes?.data?.episodes || [];
        const matchedEpisode = episodes.find((item) => item._id === params.episodeId) || null;

        if (!matchedEpisode) {
          setError('Episode not found in creator workspace.');
          setEpisode(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        setDramaTitle(String(dramaData?.title || 'Untitled Drama'));
        setEpisode(matchedEpisode);
        setAnalytics(analyticsRes?.data || null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load episode detail.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.episodeId, params.id, token]);

  const episodePerformance = useMemo(() => analytics?.episodes.find((item) => item.id === params.episodeId), [analytics, params.episodeId]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)]">
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1876f2] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-8 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)]">
        <p className="text-[18px] font-bold text-[#0f172a]">Unable to load episode detail</p>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{error || 'Episode data is unavailable.'}</p>
        <Link
          href={localizePath(`/creator/dramas/${params.id}`, locale)}
          className="mt-5 inline-flex items-center gap-2 rounded-[14px] bg-[#1876f2] px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to drama
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)] md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href={localizePath(`/creator/dramas/${params.id}`, locale)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1876f2]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {dramaTitle}
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">Episode Workspace</p>
            <h1 className="mt-2 text-[28px] font-black tracking-[-0.03em] text-[#0f172a]">Ep {episode.episodeNumber}: {episode.title || 'Untitled Episode'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748b]">
              This page now reads from the real creator drama, episodes, and analytics APIs. Episode-level metrics use the current drama analytics dataset until a dedicated episode analytics endpoint is introduced.
            </p>
          </div>
          <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
            <p><span className="font-semibold text-[#0f172a]">Status:</span> {episode.status}</p>
            <p className="mt-1"><span className="font-semibold text-[#0f172a]">Duration:</span> {Math.max(0, Math.round(episode.duration || 0))} sec</p>
            <p className="mt-1"><span className="font-semibold text-[#0f172a]">Pricing:</span> {episode.isFree ? 'Free episode' : `${episode.unlockPrice} coins`}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Views" value={episodePerformance?.viewsLabel || '0'} helper="30-day episode view count from creator drama analytics." icon={Eye} />
        <StatCard label="Completion" value={episodePerformance ? `${Math.round(episodePerformance.completion * 100)}%` : '0%'} helper="Average completion from current watch histories." icon={TrendingUp} />
        <StatCard label="Watch Time" value={episodePerformance?.watchTime || '0s'} helper="Average effective watch duration for this episode." icon={Clock3} />
        <StatCard label="Revenue" value={episodePerformance?.revenue || '$0.00'} helper="Estimated revenue allocation from current drama analytics." icon={Lock} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)] md:p-7">
          <h2 className="text-[18px] font-bold text-[#0f172a]">Episode Metadata</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">Media Delivery</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.streamVideoId ? 'Cloudflare Stream linked' : 'No stream asset linked'}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Video file: {episode.videoFileName || 'Not uploaded'}.</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">Subtitle Delivery</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.subtitleStatus || 'none'}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Language: {episode.subtitleLanguage || 'Not set'}.</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">Thumbnail</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.thumbnail ? 'Uploaded' : 'Missing'}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Cover asset status: {episode.coverStatus || 'none'}.</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">Episode Access</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.isFree ? 'Free to watch' : 'Unlock required'}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">Current unlock rate: {episodePerformance?.unlockRate || '0.0%'}.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)] md:p-7">
          <h2 className="text-[18px] font-bold text-[#0f172a]">Catalog Context</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <Film className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">Drama performance curve</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{analytics?.title || dramaTitle} status: {analytics?.status || 'Unknown'}.</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <Globe2 className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">Top audience geography</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{analytics?.geography.rows?.[0] ? `${analytics.geography.rows[0].label} • ${analytics.geography.rows[0].share}%` : 'No geography data yet.'}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">Performance note</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{analytics?.highlights?.[0]?.helper || 'More granular episode analytics will be added once a dedicated endpoint is available.'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
