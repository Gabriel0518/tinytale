export const dynamic = "force-dynamic";

import CreatorEpisodeUploadWorkspace from "../../_components/CreatorEpisodeUploadWorkspace";

interface CreatorDramaDetailPageProps {
  params: {
    id: string;
  };
}

export default function CreatorDramaDetailPage({ params }: CreatorDramaDetailPageProps) {
  return <CreatorEpisodeUploadWorkspace initialDramaId={params.id} />;
}
