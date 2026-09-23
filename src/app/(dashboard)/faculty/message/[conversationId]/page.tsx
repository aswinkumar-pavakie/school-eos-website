import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "@/components/shared-ui/messaging/MessagesListClient";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const actor = await getCurrentActor();
    return (
      <MessagesListClient
        personId={actor.personId}
        initialConversationId={conversationId}
        newMessageHref="/faculty/message/new"
        requestsHref="/faculty/message/requests"
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't open this conversation. Nothing was changed -- try again." />;
  }
}
