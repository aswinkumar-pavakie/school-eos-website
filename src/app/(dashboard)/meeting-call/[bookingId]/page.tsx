// Parent-Teacher Meeting -- 1:1 video call, shared Faculty/Parent page (the
// call itself is symmetric -- either side can publish+subscribe, see the
// backend's own mintJoinToken grants). Reached from the "Join call" control
// on an APPROVED booking, in either faculty/parent-meetings or
// parent/meetings. Thin Server Component -- camera/mic access needs client
// code, so this just renders the Client Component; token minting itself
// happens via actions.ts's requestCallTokenAction, called from CallRoom on
// mount (not here at render time), so a slow/failed LiveKit connection
// shows its own loading/error state instead of blocking this page's SSR.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getCurrentActor } from "@/lib/api";
import { CallRoom } from "./CallRoom";

export default async function MeetingCallPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  try {
    // Real auth check up front -- an unauthenticated visitor never reaches
    // the client component at all (same posture as every other page here).
    await getCurrentActor();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    throw err;
  }
  return <CallRoom bookingId={bookingId} />;
}
