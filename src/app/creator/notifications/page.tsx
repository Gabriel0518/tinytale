import CreatorPlaceholderPage from "../_components/CreatorPlaceholderPage";

export default function CreatorNotificationsPage() {
  return (
    <CreatorPlaceholderPage
      title="Notifications"
      route="/creator/notifications"
      description="Centralize creator updates for application review, drama review, contract invites, settlement progress, bank verification, and support replies."
      note="The updated docs define notifications as the system handoff for every creator workflow change: application status, content review, contract, settlement, bank review, and ticket replies."
      metrics={[
        { label: "Core Channels", value: "2", helper: "In-app notifications plus email cover the main creator state changes.", tone: "blue" },
        { label: "Trigger Groups", value: "6", helper: "Application, content, contract, settlement, bank review, and support are the main notification clusters.", tone: "green" },
        { label: "Bulk Action", value: "Mark All Read", helper: "The list view should support unread filtering and one-click clearing.", tone: "amber" },
        { label: "Priority Events", value: "Review + Payout", helper: "Approval, rejection, settlement, and bank-review outcomes must surface prominently.", tone: "slate" },
      ]}
      sections={[
        {
          title: "Workflow Notifications",
          description: "Notifications need to mirror every creator lifecycle step so state changes are visible even when the user is not on the target page.",
          items: [
            "Application submitted, approved, rejected, or sent back for more info",
            "Drama review result and moderation feedback",
            "Contract invitation and agreement updates",
            "Settlement generation, payout, and dispute updates",
          ],
        },
        {
          title: "Message Management",
          description: "This page should become the filterable inbox for creator operations, with type chips, unread controls, and deep links into the relevant workflow page.",
          items: [
            "Unread-only filter",
            "Notification type grouping",
            "Mark single item or all as read",
            "Deep links into tickets, settlements, and drama reviews",
          ],
        },
      ]}
      actions={[
        { label: "Open Tickets", href: "/creator/tickets" },
        { label: "Open Settlements", href: "/creator/settlements", variant: "secondary" },
      ]}
    />
  );
}
