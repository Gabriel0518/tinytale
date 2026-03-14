import CreatorPlaceholderPage from "../../../_components/CreatorPlaceholderPage";

export default function CreatorDramaEpisodesPage() {
  return (
    <CreatorPlaceholderPage
      title="Episode Management"
      description="Episode list under a drama with upload status, lock strategy, and operation shortcuts for each episode."
      route="/creator/dramas/[id]/episodes"
    />
  );
}
