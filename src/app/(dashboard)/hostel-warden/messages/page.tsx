// Real E2EE messaging for Hostel Warden (website) -- same shared
// MessagingApp every other newly-connected role uses
// (src/components/messaging-ui/MessagingApp.tsx). This role was already
// backend-authorized for messaging; only the website nav/page were missing.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagingApp } from "@/components/messaging-ui/MessagingApp";

export default async function HostelWardenMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return <MessagingApp personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
