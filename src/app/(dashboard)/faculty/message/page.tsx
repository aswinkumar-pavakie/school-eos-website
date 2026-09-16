// Real, secure, E2EE-encrypted messaging -- this replaces the earlier
// legacy-/messages-backed "Message" screen entirely. This IS the mobile
// app's own real "Events... no, Messaging" feature (app/(protected)/
// messaging/*, src/features/messaging-v2/*), backed by the same real,
// already-built school-eos-messaging microservice (real MLS end-to-end
// encryption -- see src/lib/e2ee/* for the full, faithfully-ported crypto).
// Structure/flow/copy matches that real mobile screen exactly: an empty
// state, a pending-requests banner, and a flat conversation list -- not the
// earlier pixel-mockup design.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { MessagesListClient } from "./MessagesListClient";

export default async function MessagePage() {
  try {
    const actor = await getCurrentActor();
    return <MessagesListClient personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load messages. Nothing was changed -- try again." />;
  }
}
