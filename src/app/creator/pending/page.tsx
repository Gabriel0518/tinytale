import CreatorPlaceholderPage from "../_components/CreatorPlaceholderPage";

export default function CreatorPendingPage() {
  return (
    <CreatorPlaceholderPage
      title="Application Under Review"
      description="Your creator application is currently in review. This page is shown automatically for users with pending or in-review status."
      route="/creator/pending"
    />
  );
}
