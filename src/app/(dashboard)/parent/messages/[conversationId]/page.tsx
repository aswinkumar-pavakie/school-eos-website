import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "@/components/shared-ui/messaging/MessagesListClient";

export default async function ParentConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const actor = await getCurrentActor();
    return (
      <MessagesListClient
        personId={actor.personId}
        initialConversationId={conversationId}
        newMessageHref="/parent/messages/new"
        requestsHref="/parent/messages/requests"
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't open this conversation." />;
  }
}
