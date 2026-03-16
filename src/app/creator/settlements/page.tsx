import CreatorPlaceholderPage from "../_components/CreatorPlaceholderPage";

export default function CreatorSettlementsPage() {
  return (
    <CreatorPlaceholderPage
      title="Settlement Center"
      route="/creator/settlements"
      description="Track monthly statements, payout eligibility, bank-account readiness, and the deductions chain that leads to your net USD payout."
      note="The new docs lock settlement currency to USD, require a verified bank account before payout, and expose the calculation chain from coin unlocks to creator net earnings."
      metrics={[
        { label: "Settlement Currency", value: "USD", helper: "All creator revenue is displayed and paid in USD.", tone: "blue" },
        { label: "Minimum Payout", value: "$50", helper: "Balances below the threshold roll into the next cycle.", tone: "amber" },
        { label: "Freeze Window", value: "15 Days", helper: "Recent earnings stay frozen to absorb refund clawbacks.", tone: "slate" },
        { label: "Payout Method", value: "Bank Transfer", helper: "Finance marks statements as paid after manual bank remittance.", tone: "green" },
      ]}
      sections={[
        {
          title: "Monthly Statement List",
          description: "The list view should show each cycle's gross unlock revenue, channel fees, net settlement base, creator share, and payout status.",
          items: [
            "Cycle date range and statement ID",
            "Gross unlock revenue and weighted USD conversion",
            "Stripe or channel fees deducted before revenue share",
            "Creator net amount and payout state",
          ],
        },
        {
          title: "Disputes & Confirmation",
          description: "Creators confirm each statement or open a ticket when a payout, fee deduction, or drama-level amount looks wrong.",
          items: [
            "Statement review and confirmation CTA",
            "Dispute handoff into Creator Tickets",
            "Linked bank verification status",
            "Manual payout proof after finance completion",
          ],
        },
      ]}
      actions={[
        { label: "Bank Account", href: "/creator/settings/bank-account" },
        { label: "Support Tickets", href: "/creator/tickets", variant: "secondary" },
      ]}
    />
  );
}
