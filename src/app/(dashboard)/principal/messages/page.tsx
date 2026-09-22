// Real E2EE messaging for Principal (website) -- same shared MessagingApp
// every other newly-connected role uses
// (src/components/messaging-ui/MessagingApp.tsx). Principal already has
// this working on mobile; this was the missing website side.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagingApp } from "@/components/messaging-ui/MessagingApp";

export default async function PrincipalMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return <MessagingApp personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
