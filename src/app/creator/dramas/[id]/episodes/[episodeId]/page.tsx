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
import { useCreatorI18n } from '../../../../_lib/creator-i18n';

interface CreatorEpisodeDetailPageProps {
  params: {
    id: string;
    episodeId: string;
  };
  searchParams?: {
    mode?: string;
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

export default function CreatorEpisodeDetailPage({ params, searchParams }: CreatorEpisodeDetailPageProps) {
  const locale = useLocale();
  const { t } = useCreatorI18n();
  const { token } = useAuth();
  const backHref = localizePath(
    `/creator/dramas/${params.id}/episodes${String(searchParams?.mode || "").toLowerCase() === "revision" ? "?mode=revision" : ""}`,
    locale
  );
  const [episode, setEpisode] = useState<CreatorEpisodeItem | null>(null);
  const [dramaTitle, setDramaTitle] = useState('');
  const [analytics, setAnalytics] = useState<CreatorDramaAnalytics | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
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
          setError(t('Episode not found in creator workspace.'));
          setEpisode(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        setDramaTitle(String(dramaData?.title || t('Untitled Drama')));
        setEpisode(matchedEpisode);
        setFormTitle(String(matchedEpisode.title || ''));
        setFormDescription(String(matchedEpisode.description || ''));
        setAnalytics(analyticsRes?.data || null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || t('Failed to load episode detail.'));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.episodeId, params.id, t, token]);

  const episodePerformance = useMemo(() => analytics?.episodes.find((item) => item.id === params.episodeId), [analytics, params.episodeId]);

  async function handleSaveMetadata() {
    if (!token || !episode) return;
    const nextTitle = formTitle.trim();
    if (!nextTitle) {
      setError(t('Episode title is required.'));
      return;
    }

    setSaving(true);
    setError(null);
    setSaveNotice(null);
    try {
      const response = await creatorApi.updateDramaEpisode(token, params.id, params.episodeId, {
        title: nextTitle,
        description: formDescription.trim(),
      });
      setEpisode(response.data || { ...episode, title: nextTitle, description: formDescription.trim() });
      setFormTitle(String(response.data?.title || nextTitle));
      setFormDescription(String(response.data?.description || formDescription.trim()));
      setSaveNotice(t('Episode metadata saved.'));
    } catch (err: any) {
      setError(err?.message || t('Failed to save episode metadata.'));
    } finally {
      setSaving(false);
    }
  }

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
        <p className="text-[18px] font-bold text-[#0f172a]">{t('Unable to load episode detail')}</p>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{error || t('Episode data is unavailable.')}</p>
        <Link
          href={backHref}
          className="mt-5 inline-flex items-center gap-2 rounded-[14px] bg-[#1876f2] px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back to drama')}
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
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1876f2]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('Back to __ARG_0__', dramaTitle)}
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#1876f2]">{t('Episode Workspace')}</p>
            <h1 className="mt-2 text-[28px] font-black tracking-[-0.03em] text-[#0f172a]">{t('Ep __ARG_0__: __ARG_1__', episode.episodeNumber, episode.title || t('Untitled Episode'))}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748b]">
              {t('This page now reads from the real creator drama, episodes, and analytics APIs. Episode-level metrics use the current drama analytics dataset until a dedicated episode analytics endpoint is introduced.')}
            </p>
          </div>
          <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
            <p><span className="font-semibold text-[#0f172a]">{t('Status:')}</span> {t(episode.status)}</p>
            <p className="mt-1"><span className="font-semibold text-[#0f172a]">{t('Duration:')}</span> {t('__ARG_0__ sec', Math.max(0, Math.round(episode.duration || 0)))}</p>
            <p className="mt-1"><span className="font-semibold text-[#0f172a]">{t('Pricing:')}</span> {episode.isFree ? t('Free episode') : t('__ARG_0__ coins', episode.unlockPrice)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('Views')} value={episodePerformance?.viewsLabel || '0'} helper={t('30-day episode view count from creator drama analytics.')} icon={Eye} />
        <StatCard label={t('Completion')} value={episodePerformance ? `${Math.round(episodePerformance.completion * 100)}%` : '0%'} helper={t('Average completion from current watch histories.')} icon={TrendingUp} />
        <StatCard label={t('Watch Time')} value={episodePerformance?.watchTime || '0s'} helper={t('Average effective watch duration for this episode.')} icon={Clock3} />
        <StatCard label={t('Revenue')} value={episodePerformance?.revenue || '$0.00'} helper={t('Estimated revenue allocation from current drama analytics.')} icon={Lock} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)] md:p-7">
          <div className="mb-6 rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a]">{t('Episode Title & Synopsis')}</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748b]">{t('Update the storefront-facing episode title and short synopsis used across creator and review surfaces.')}</p>
              </div>
              <button
                type="button"
                onClick={handleSaveMetadata}
                disabled={saving}
                className="rounded-[14px] bg-[#1876f2] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t('Saving...') : t('Save Metadata')}
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Episode Title')}</span>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#d7dde8] bg-white px-4 text-[15px] text-[#0f172a] outline-none transition focus:border-[#1876f2]"
                  placeholder={t('Enter episode title')}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Episode Synopsis')}</span>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-[#d7dde8] bg-white px-4 py-3 text-[15px] text-[#0f172a] outline-none transition focus:border-[#1876f2]"
                  placeholder={t('Add a short synopsis for this episode')}
                />
              </label>
            </div>
            {saveNotice ? <p className="mt-3 text-sm font-medium text-[#15803d]">{saveNotice}</p> : null}
          </div>

          <h2 className="text-[18px] font-bold text-[#0f172a]">{t('Episode Metadata')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Media Delivery')}</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.streamVideoId ? t('Cloudflare Stream linked') : t('No stream asset linked')}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t('Video file: __ARG_0__.', episode.videoFileName || t('Not uploaded'))}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Subtitle Delivery')}</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.subtitleStatus ? t(episode.subtitleStatus) : t('none')}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t('Language: __ARG_0__.', episode.subtitleLanguage || t('Not set'))}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Thumbnail')}</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.thumbnail ? t('Uploaded') : t('Missing')}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t('Cover asset status: __ARG_0__.', episode.coverStatus ? t(episode.coverStatus) : t('none'))}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#94a3b8]">{t('Episode Access')}</p>
              <p className="mt-1 text-sm font-semibold text-[#0f172a]">{episode.isFree ? t('Free to watch') : t('Unlock required')}</p>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t('Current unlock rate: __ARG_0__.', episodePerformance?.unlockRate || '0.0%')}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(15,23,42,0.05)] md:p-7">
          <h2 className="text-[18px] font-bold text-[#0f172a]">{t('Catalog Context')}</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <Film className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">{t('Drama performance curve')}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t('__ARG_0__ status: __ARG_1__.', analytics?.title || dramaTitle, analytics?.status ? t(analytics.status) : t('Unknown'))}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <Globe2 className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">{t('Top audience geography')}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{analytics?.geography.rows?.[0] ? `${analytics.geography.rows[0].label} • ${analytics.geography.rows[0].share}%` : t('No geography data yet.')}</p>
            </div>
            <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-[#1876f2]">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0f172a]">{t('Performance note')}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{analytics?.highlights?.[0]?.helper || t('More granular episode analytics will be added once a dedicated endpoint is available.')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
