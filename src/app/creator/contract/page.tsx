import CreatorPlaceholderPage from "../_components/CreatorPlaceholderPage";

export default function CreatorContractPage() {
  return (
    <CreatorPlaceholderPage
      title="Contract & Agreements"
      route="/creator/contract"
      description="Review your active creator agreement, future upgrade invites, and the terms that control revenue-share changes across TinyTale."
      note="The latest creator docs require contracts to be rendered in-page with full-text reading, explicit acceptance, version history, and upgrade flows separate from creator application approval."
      metrics={[
        { label: "Current Tier", value: "Standard", helper: "Default approved creators start on the standard agreement.", tone: "blue" },
        { label: "Creator Share", value: "30%", helper: "Upgrade invites can raise the creator split to 50% or 60%.", tone: "green" },
        { label: "Upgrade Paths", value: "2", helper: "Signed Creator and Exclusive Creator remain future invitation tiers.", tone: "amber" },
        { label: "Signature Flow", value: "In-Page", helper: "All future agreements must be reviewed and accepted inside the creator center.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Active Agreement",
          description: "The main contract card should summarize the effective share ratio, start/end dates, obligations, and whether bank verification blocks settlement release.",
          items: [
            "Agreement version and effective date",
            "Revenue split and settlement currency",
            "Termination and renewal rules",
            "Linked creator profile and verification status",
          ],
        },
        {
          title: "Upgrade Invite Flow",
          description: "When TinyTale offers a stronger commercial tier, this page needs an invitation card, full-term reader, accept/decline actions, and an audit trail.",
          items: [
            "Standard: platform 70% / creator 30%",
            "Signed Creator: platform 50% / creator 50%",
            "Exclusive Creator: platform 40% / creator 60%",
            "Versioned acceptance history with timestamps",
          ],
        },
      ]}
      actions={[
        { label: "Open Settlements", href: "/creator/settlements" },
        { label: "Profile Settings", href: "/creator/settings/profile", variant: "secondary" },
      ]}
    />
  );
}
