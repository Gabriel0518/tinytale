export const dynamic = 'force-dynamic';

import CreatorAnalyticsExperience from '../../../_components/analytics/CreatorAnalyticsExperience';

interface CreatorDramaAnalyticsPageProps {
  params: {
    id: string;
  };
}

export default function CreatorDramaAnalyticsPage({ params }: CreatorDramaAnalyticsPageProps) {
  return <CreatorAnalyticsExperience mode="drama" dramaId={params.id} />;
}
