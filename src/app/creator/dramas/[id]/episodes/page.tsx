export const dynamic = "force-dynamic";

import CreatorEpisodeUploadWorkspace from "../../../_components/CreatorEpisodeUploadWorkspace";

interface CreatorDramaEpisodesPageProps {
  params: {
    id: string;
  };
}

export default function CreatorDramaEpisodesPage({ params }: CreatorDramaEpisodesPageProps) {
  return <CreatorEpisodeUploadWorkspace initialDramaId={params.id} />;
}
