// Real, secure, E2EE-encrypted messaging -- renders the shared
// src/components/shared-ui/messaging/MessagesListClient, the same canonical
// screen Faculty's own faculty/message/page.tsx renders.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "@/components/shared-ui/messaging/MessagesListClient";

export default async function ParentMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return <MessagesListClient personId={actor.personId} newMessageHref="/parent/messages/new" requestsHref="/parent/messages/requests" />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages." />;
  }
}
