import CreatorPlaceholderPage from "../../../../_components/CreatorPlaceholderPage";

export default function CreatorEpisodeDetailPage() {
  return (
    <CreatorPlaceholderPage
      title="Episode Detail & Performance"
      description="Detailed episode workspace for playback data, completion funnel, retention, revenue contribution, comments quality, and content optimization actions."
      route="/creator/dramas/[id]/episodes/[episodeId]"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">Episode Core Info</h2>
          <p className="mt-2 text-sm text-[#64748b]">Title, index, duration, publish status, price/lock strategy, and upload quality state.</p>
        </article>
        <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">Playback & Retention</h2>
          <p className="mt-2 text-sm text-[#64748b]">Views, unique viewers, completion rate, average watch time, and key drop-off timestamps.</p>
        </article>
        <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">Revenue & Conversion</h2>
          <p className="mt-2 text-sm text-[#64748b]">Unlock conversions, revenue by period, ARPU, and attribution to traffic channels.</p>
        </article>
        <article className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <h2 className="text-sm font-semibold text-[#0f172a]">Quality Feedback</h2>
          <p className="mt-2 text-sm text-[#64748b]">Comment sentiment, report count, policy flags, and recommended next optimization actions.</p>
        </article>
      </div>
    </CreatorPlaceholderPage>
  );
}
