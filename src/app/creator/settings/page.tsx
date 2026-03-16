import CreatorPlaceholderPage from "../_components/CreatorPlaceholderPage";

export default function CreatorSettingsPage() {
  return (
    <CreatorPlaceholderPage
      title="Creator Settings"
      route="/creator/settings"
      description="Manage creator identity, bank-account readiness, and operational preferences from one control center."
      note="The latest docs split creator settings into profile, bank account, and workflow preferences. This hub now reflects that IA instead of acting as a generic placeholder."
      metrics={[
        { label: "Profile Scope", value: "Public + Internal", helper: "Creators maintain both public profile details and internal business metadata.", tone: "blue" },
        { label: "Payout Readiness", value: "Bank Review", helper: "Settlement release depends on a verified bank account.", tone: "green" },
        { label: "High-Risk Flow", value: "Confirm Required", helper: "Bank changes and critical account updates should require explicit confirmation.", tone: "amber" },
        { label: "Notification Control", value: "Creator Ops", helper: "Settings should eventually expose channel preferences for operational alerts.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Profile Management",
          description: "Keep public branding, bio, genres, and portfolio links aligned with the creator application and creator-center presentation.",
          items: [
            "Display name, avatar, and bio",
            "Genres and primary language",
            "Portfolio links and creator introduction",
            "Business contact information",
          ],
        },
        {
          title: "Payout Configuration",
          description: "Bank-account setup and review state belong in settings so creators can resolve payout blockers before the next settlement cycle.",
          items: [
            "Bank-account information entry",
            "Verification-document upload",
            "Review status and rejection feedback",
            "Reminder when payout is blocked",
          ],
        },
      ]}
      actions={[
        { label: "Profile Settings", href: "/creator/settings/profile" },
        { label: "Bank Account", href: "/creator/settings/bank-account", variant: "secondary" },
      ]}
    />
  );
}
