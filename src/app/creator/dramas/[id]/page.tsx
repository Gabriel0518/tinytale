import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorDramaDetailPage() {
  return (
    <CreatorPlaceholderPage
      title="Drama Detail"
      description="Drama-level detail page for story metadata, release settings, monetization strategy, and lifecycle status."
      route="/creator/dramas/[id]"
    />
  );
}
