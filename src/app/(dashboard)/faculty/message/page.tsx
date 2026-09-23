// Real, secure, E2EE-encrypted messaging -- this replaces the earlier
// legacy-/messages-backed "Message" screen entirely. Now renders the shared
// src/components/shared-ui/messaging/MessagesListClient -- Faculty's screen
// is the canonical design every other role's own Messages feature also
// renders verbatim (see parent/messages/page.tsx, and MessagingApp.tsx for
// the 10 roles sharing a generic messaging portal).

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "@/components/shared-ui/messaging/MessagesListClient";

export default async function MessagePage() {
  try {
    const actor = await getCurrentActor();
    return <MessagesListClient personId={actor.personId} newMessageHref="/faculty/message/new" requestsHref="/faculty/message/requests" />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
