// Real E2EE messaging for Correspondent -- same shared MessagingApp every
// other newly-connected role uses (src/components/messaging-ui/MessagingApp.tsx).

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagingApp } from "@/components/messaging-ui/MessagingApp";

export default async function CorrespondentMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return <MessagingApp personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
