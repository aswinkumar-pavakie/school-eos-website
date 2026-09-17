import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { ConversationClient } from "./ConversationClient";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const actor = await getCurrentActor();
    return <ConversationClient conversationId={conversationId} personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't open this conversation. Nothing was changed -- try again." />;
  }
}
