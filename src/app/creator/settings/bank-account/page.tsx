import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorSettingsBankAccountPage() {
  return (
    <CreatorPlaceholderPage
      title="Bank Account"
      route="/creator/settings/bank-account"
      description="Configure the verified bank account TinyTale uses for creator settlements and payout proof."
      note="Bank transfer is the only payout method in the updated creator docs. The form must capture bank details, SWIFT/BIC, routing requirements, and verification documents before settlement can be released."
      metrics={[
        { label: "Payout Method", value: "Bank Transfer", helper: "TinyTale finance pays creators through manual bank remittance.", tone: "blue" },
        { label: "Default Currency", value: "USD", helper: "The creator-center settlement view and bank form stay aligned to USD payouts.", tone: "green" },
        { label: "Verification", value: "Required", helper: "Unverified accounts should block payout release and show a clear warning.", tone: "amber" },
        { label: "Proof Upload", value: "Statement / Letter", helper: "Bank statement or bank confirmation letter must be collected as evidence.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Bank Details Form",
          description: "The latest docs define a complete international bank form instead of a minimal payout placeholder.",
          items: [
            "Account holder or company name",
            "Bank name and bank address",
            "Account number or IBAN",
            "Bank country, currency, SWIFT / BIC",
          ],
        },
        {
          title: "Conditional Validation",
          description: "Country-specific requirements and verification state must be visible before creators expect a payout.",
          items: [
            "Routing number for US accounts",
            "Verification document upload",
            "Pending / verified / rejected status chip",
            "Re-review flow after account edits",
          ],
        },
      ]}
      actions={[
        { label: "Open Settlements", href: "/creator/settlements" },
        { label: "Back to Settings", href: "/creator/settings", variant: "secondary" },
      ]}
    />
  );
}
