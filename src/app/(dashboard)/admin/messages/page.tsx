// Real E2EE messaging for Admin -- same shared MessagingApp every other
// newly-connected role uses (src/components/messaging-ui/MessagingApp.tsx),
// wired to the real school-eos-messaging microservice. See
// messaging-roles.constant.ts for the backend authorization change that
// makes this role messaging-enabled at all.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagingApp } from "@/components/messaging-ui/MessagingApp";

export default async function AdminMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return <MessagingApp personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
