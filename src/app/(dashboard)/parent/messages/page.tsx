// Real, secure, E2EE-encrypted messaging -- the same real, already-built
// school-eos-messaging microservice (real MLS end-to-end encryption --
// see src/lib/e2ee/* for the full crypto) that Faculty's own Message
// screen already uses. messaging-actions.ts and lib/e2ee/* are entirely
// role-agnostic on the client side, so this reuses them directly, restyled
// to the parent design system.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "./MessagesListClient";

export default async function ParentMessagesPage() {
  try {
    const actor = await getCurrentActor();
    return (
      <div className="parent-scope">
        <MessagesListClient personId={actor.personId} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages." />;
  }
}
