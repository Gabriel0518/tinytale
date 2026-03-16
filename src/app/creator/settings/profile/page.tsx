import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorSettingsProfilePage() {
  return (
    <CreatorPlaceholderPage
      title="Profile Settings"
      route="/creator/settings/profile"
      description="Manage the creator identity shown across TinyTale, along with the portfolio and contact details used for operations."
      note="Profile settings should stay consistent with the creator-application model, so display fields and business metadata are now framed around the latest application schema."
      metrics={[
        { label: "Profile Surfaces", value: "3", helper: "Public creator card, review records, and internal operations all rely on this data.", tone: "blue" },
        { label: "Creative Metadata", value: "Genres + Bio", helper: "Genres, bio, and portfolio links should mirror approved creator information.", tone: "green" },
        { label: "Business Contact", value: "Required", helper: "Creator operations depend on an up-to-date email or phone contact.", tone: "amber" },
        { label: "Brand Assets", value: "Avatar", helper: "Profile imagery should be reusable across dashboard and admin review surfaces.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Public Identity",
          description: "This page should cover the fields visible to TinyTale staff and, where applicable, the creator-facing profile surfaces.",
          items: [
            "Display name and avatar",
            "Creator bio / studio intro",
            "Genres and primary language",
            "Country and creator type",
          ],
        },
        {
          title: "Operations Metadata",
          description: "The same screen also needs the business fields that support review, settlement contact, and future contract handling.",
          items: [
            "Business or representative name",
            "Support email and phone",
            "Portfolio links",
            "Future security and access preferences",
          ],
        },
      ]}
      actions={[
        { label: "Back to Settings", href: "/creator/settings" },
        { label: "Bank Account", href: "/creator/settings/bank-account", variant: "secondary" },
      ]}
    />
  );
}
