import CreatorPlaceholderPage from "../../../_components/CreatorPlaceholderPage";

export default function CreatorDramaAnalyticsPage() {
  return (
    <CreatorPlaceholderPage
      title="Drama Analytics"
      description="Cross-episode performance dashboard for a single drama, including trend charts and funnel diagnostics."
      route="/creator/dramas/[id]/analytics"
    />
  );
}
