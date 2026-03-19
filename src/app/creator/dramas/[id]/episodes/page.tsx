export const dynamic = "force-dynamic";

import CreatorEpisodeUploadWorkspace from "../../../_components/CreatorEpisodeUploadWorkspace";

interface CreatorDramaEpisodesPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    mode?: string;
  };
}

export default function CreatorDramaEpisodesPage({ params, searchParams }: CreatorDramaEpisodesPageProps) {
  return (
    <CreatorEpisodeUploadWorkspace
      initialDramaId={params.id}
      revisionOnly={String(searchParams?.mode || "").toLowerCase() === "revision"}
    />
  );
}
