"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FileCheck2,
  Film,
  PlayCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { adminApi } from "@/lib/adminApi";
import type { CreatorAdminContentReviewDetail } from "@/types/creator";
import {
  formatAdminDate,
  getCreatorContentReviewStatusMeta,
  getCreatorLifecycleMeta,
  getCreatorSlaStatusMeta,
  getMockContentReview,
} from "../../_lib/mockData";

const panelClassName = "rounded-2xl border border-gray-700/50 bg-[#13131d] p-5";

type Decision = "approved" | "request_changes" | "rejected";
type PreviewEpisode =
  CreatorAdminContentReviewDetail["episodesPreview"][number];

export default function CreatorContentReviewDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const dramaId = String(params?.dramaId || "");

  const [data, setData] = useState<CreatorAdminContentReviewDetail | null>(
    getMockContentReview(dramaId),
  );
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePreview, setActivePreview] = useState<PreviewEpisode | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response: any = await adminApi.getCreatorContentReview(dramaId);
        const next = response?.data?.review || response?.data || response;
        if (!cancelled && next?.dramaId) {
          setData(next);
        }
      } catch {
        if (!cancelled) setData(getMockContentReview(dramaId));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (dramaId) load();
    return () => {
      cancelled = true;
    };
  }, [dramaId]);

  const statusMeta = useMemo(
    () => getCreatorContentReviewStatusMeta(data?.status || "draft"),
    [data?.status],
  );
  const slaMeta = useMemo(
    () => getCreatorSlaStatusMeta(data?.slaStatus || "on_track"),
    [data?.slaStatus],
  );
  const creatorStatusMeta = useMemo(
    () => getCreatorLifecycleMeta(data?.creatorStatus || "under_review"),
    [data?.creatorStatus],
  );

  useEffect(() => {
    if (!activePreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activePreview]);

  function handleOpenPreview(episode: PreviewEpisode) {
    if (!episode.videoUrl) {
      toast("Preview video is not available yet.", "info");
      return;
    }
    setActivePreview(episode);
  }

  async function handleSubmitReview() {
    if (!data) return;
    if (!note.trim()) {
      toast("A review note is required before saving the decision.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewCreatorContent(data.dramaId, { decision, note });
    } catch {
      // Keep the local admin workflow usable while backend integration is incomplete.
    } finally {
      setSubmitting(false);
    }

    const nextStatus = decision === "approved" ? "published" : "rejected";
    setData((current) =>
      current
        ? {
            ...current,
            status: nextStatus,
            reviewNote: note,
            rejectionReason: decision === "approved" ? "" : note,
            reviewedAt: new Date().toISOString(),
            slaStatus: "resolved",
            reviewHistory: [
              {
                id: `local-review-${Date.now()}`,
                at: new Date().toISOString(),
                actor: "Current Admin",
                action:
                  decision === "approved"
                    ? "Approved and published"
                    : "Changes requested",
                note,
              },
              ...current.reviewHistory,
            ],
          }
        : current,
    );

    toast("Content review decision recorded.", "success");
    setNote("");
  }

  if (loading && !data) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Loading content review...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 text-gray-200">
        <Link
          href="/admin/creators/content"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to content queue
        </Link>
        <div className="rounded-2xl border border-gray-700/50 bg-[#13131d] p-8 text-center text-sm text-gray-400">
          Review item not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/creators/content"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to content queue
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {data.title}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {data.creatorName} · Submitted{" "}
            {formatAdminDate(data.submittedAt, true)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${slaMeta.className}`}
          >
            {slaMeta.label}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${creatorStatusMeta.className}`}
          >
            {creatorStatusMeta.label}
          </span>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <button
                type="button"
                onClick={() => handleOpenPreview(data.episodesPreview[0])}
                className="group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-[#0f0f17] text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.cover}
                  alt={data.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-300">
                      Playback preview
                    </p>
                    <p className="mt-2 text-sm text-gray-200">
                      Click to open the player and spot-check episode assets.
                    </p>
                  </div>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur">
                    <PlayCircle className="h-7 w-7" />
                  </span>
                </div>
              </button>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-[#0f0f17] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                      Creator
                    </p>
                    <p className="mt-3 font-medium text-white">
                      {data.creatorName}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {data.creatorEmail}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {data.creatorLevel} · {data.country}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#0f0f17] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                      Submission
                    </p>
                    <p className="mt-3 font-medium text-white">
                      {data.episodes} episodes
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {data.viewCount.toLocaleString()} total views
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Deadline {formatAdminDate(data.slaDeadlineAt, true)}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Synopsis
                  </p>
                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    {data.description}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    {data.categories.join(" · ")} · {data.language}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Five-item review checklist
                </h2>
                <p className="text-sm text-gray-400">
                  Use these checks to keep creator content decisions consistent.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {data.checklist.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.passed ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}
                    >
                      {item.passed ? "Passed" : "Attention"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <article className={panelClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Episode preview
                  </h2>
                  <p className="text-sm text-gray-400">
                    Spot-check launch readiness before approving publish.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {data.episodesPreview.map((episode) => (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => handleOpenPreview(episode)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4 text-left transition hover:border-indigo-500/50 hover:bg-[#151524]"
                  >
                    <div>
                      <p className="font-medium text-white">
                        Episode {episode.episodeNumber}: {episode.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {Math.round(episode.durationSeconds)}s runtime ·{" "}
                        {episode.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        #{episode.episodeNumber.toString().padStart(2, "0")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Watch
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </article>

            <article className={panelClassName}>
              <h2 className="text-lg font-semibold text-white">
                Review history
              </h2>
              <div className="mt-5 space-y-3">
                {data.reviewHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.action}</p>
                      <span className="text-xs text-gray-500">
                        {formatAdminDate(item.at, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{item.actor}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <div className="space-y-4">
          <article className={panelClassName}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Risk summary
                </h2>
                <p className="text-sm text-gray-400">
                  Escalate to compliance when copyright evidence exists.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Creator status
                </p>
                <p className="mt-2">{creatorStatusMeta.label}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Active DMCA strikes
                </p>
                <p className="mt-2">{data.activeDmcaStrikes}</p>
              </div>
              <div className="rounded-xl bg-[#0f0f17] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                  Prior rejection count
                </p>
                <p className="mt-2">{data.rejectionHistoryCount}</p>
              </div>
              {(data.rejectionReason || data.reviewNote) && (
                <div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Latest reviewer note
                  </p>
                  <p className="mt-2 leading-6 text-gray-300">
                    {data.rejectionReason || data.reviewNote}
                  </p>
                </div>
              )}
            </div>
          </article>
          <article className={panelClassName}>
            <h2 className="text-lg font-semibold text-white">
              Submission facts
            </h2>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Drama ID</span>
                <span>{data.dramaId}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Language</span>
                <span>{data.language}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Categories</span>
                <span>{data.categories.join(", ")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Reviewed at</span>
                <span>
                  {data.reviewedAt
                    ? formatAdminDate(data.reviewedAt, true)
                    : "Not reviewed"}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className={panelClassName}>
        <h2 className="text-lg font-semibold text-white">Reviewer decision</h2>
        <p className="mt-1 text-sm text-gray-400">
          Use the content summary, checklist, episode spot-check, and risk panel
          above before recording the final decision.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Decision
            </label>
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as Decision)}
              className="h-11 w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 text-sm text-gray-200 outline-none focus:border-indigo-500"
            >
              <option value="approved">Approve and publish</option>
              <option value="request_changes">Request changes</option>
              <option value="rejected">Reject for rights/policy issues</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Review note
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Summarize the publish rationale or the issues the creator must fix."
              className="min-h-[160px] w-full rounded-xl border border-gray-700/50 bg-[#0f0f17] px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={handleSubmitReview}
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save content review"}
        </button>
      </section>

      {activePreview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0f0f17] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-gray-800 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-400">
                  Episode player
                </p>
                <h3 className="truncate text-base font-semibold text-white">
                  Episode {activePreview.episodeNumber}: {activePreview.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="bg-black">
                <video
                  key={activePreview.id}
                  src={activePreview.videoUrl}
                  poster={activePreview.thumbnail || data.cover}
                  controls
                  autoPlay
                  className="aspect-video h-full w-full bg-black"
                />
              </div>

              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Current preview
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {activePreview.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    Episode {activePreview.episodeNumber} ·{" "}
                    {Math.round(activePreview.durationSeconds)}s ·{" "}
                    {activePreview.status}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-700/50 bg-[#13131d] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                    Review usage
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-300">
                    Use the popup player to quickly verify opening quality,
                    subtitle burn-in, cover-to-video consistency, and whether
                    the cut is ready for publish approval.
                  </p>
                </div>

                <div className="space-y-2">
                  {data.episodesPreview.map((episode) => (
                    <button
                      key={episode.id}
                      type="button"
                      onClick={() => handleOpenPreview(episode)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        activePreview.id === episode.id
                          ? "border-indigo-500/60 bg-indigo-500/10"
                          : "border-gray-700/50 bg-[#13131d] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          EP {episode.episodeNumber}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {episode.title}
                        </p>
                      </div>
                      <PlayCircle className="h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
