import CreatorPlaceholderPage from "../../_components/CreatorPlaceholderPage";

export default function CreatorTicketDetailPage() {
  return (
    <CreatorPlaceholderPage
      title="Ticket Detail"
      description="Conversation-style ticket detail page showing issue timeline, responses, and attachments."
      route="/creator/tickets/[id]"
    />
  );
}
