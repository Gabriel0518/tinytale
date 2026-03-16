import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorSettlementDetailPage() {
  return (
    <CreatorPlaceholderPage
      title="Settlement Detail"
      route="/creator/settlements/[id]"
      description="Drill into one settlement cycle to see the exact breakdown from gross unlock revenue through fees, revenue-share logic, and final payout."
      note="The detail page is now structured around the new settlement contract: gross revenue, channel fees, settlement base, creator split, deductions, and payout proof must all be visible in one record."
      metrics={[
        { label: "Revenue Chain", value: "5 Steps", helper: "Gross revenue -> channel fees -> base -> creator share -> net payout.", tone: "blue" },
        { label: "Dispute Window", value: "Before Payout", helper: "Creators raise disputes before finance marks the statement as paid.", tone: "amber" },
        { label: "Payout Proof", value: "Required", helper: "Paid statements should include transfer reference and finance evidence.", tone: "green" },
        { label: "Linked Operations", value: "Tickets", helper: "Each disputed statement should link to a creator support thread.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Statement Breakdown",
          description: "This screen will surface per-drama revenue contributions, weighted conversion, fee deductions, clawback logic, and the final creator share for the cycle.",
          items: [
            "Drama and episode contribution rows",
            "Weighted coin-to-USD conversion for the cycle",
            "Refund clawbacks and deduction limits",
            "Net creator payout after policy rules",
          ],
        },
        {
          title: "Settlement Workflow",
          description: "The state machine should make it obvious whether the statement is waiting for creator confirmation, finance review, payout, or dispute resolution.",
          items: [
            "Confirm or dispute action state",
            "Finance review notes",
            "Bank-account snapshot at payout time",
            "Payout reference and completion timestamp",
          ],
        },
      ]}
      actions={[
        { label: "Back to Settlements", href: "/creator/settlements" },
        { label: "Open Tickets", href: "/creator/tickets", variant: "secondary" },
      ]}
    />
  );
}
