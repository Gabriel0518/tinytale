import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorSettlementDetailPage() {
  return (
    <CreatorPlaceholderPage
      title="Settlement Detail"
      description="Settlement detail with itemized earnings, deductions, payout method, and invoice artifacts."
      route="/creator/settlements/[id]"
    />
  );
}
