// Online Class -- in-app LiveKit call, shared Faculty/Parent page (the call
// itself is symmetric on the wire -- both sides publish+subscribe -- but the
// CONTROLS differ: faculty gets roster moderation + End, parent gets Raise
// hand + Leave. See CallRoom's own role prop). Reached from "Start"/"Resume"
// on the faculty Online Class list, or "Join" on the parent one. Thin Server
// Component -- camera/mic access needs client code, so this just resolves
// which role the viewer is and renders the Client Component; token minting
// itself happens in CallRoom on mount via actions.ts, not here at render
// time, so a slow/failed LiveKit connection shows its own loading/error
// state instead of blocking this page's SSR.

import { redirect } from "next/navigation";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { CallRoom } from "./CallRoom";

export default async function OnlineClassCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let isFaculty: boolean;
  try {
    const actor = await getCurrentActor();
    isFaculty = actor.roles.includes("FACULTY");
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    throw err;
  }
  return <CallRoom classId={id} role={isFaculty ? "faculty" : "parent"} />;
}
