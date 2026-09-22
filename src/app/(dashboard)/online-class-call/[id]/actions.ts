"use server";

// Server Action layer for the shared Faculty/Parent Online Class call screen --
// mints the LiveKit join token server-side, using the SAME real backend
// authorization checks the mobile app's identical endpoints go through. Role
// detection (getCurrentActor) decides which client function gets called; a
// caller who isn't actually FACULTY or the right PARENT for this class gets
// the backend's own 403/404/409, same as everywhere else in this app.

import { getCurrentActor } from "@/lib/api";
import {
  endOnlineClassCall,
  muteOnlineClassParticipant,
  requestFacultyOnlineClassToken,
  type OnlineClassCallCredentials,
} from "@/lib/faculty-online-classes-api";
import { requestOnlineClassCallToken } from "@/lib/parent-api";

export async function requestOnlineClassCallTokenAction(
  id: string,
): Promise<OnlineClassCallCredentials> {
  const actor = await getCurrentActor();
  if (actor.roles.includes("FACULTY")) {
    return requestFacultyOnlineClassToken(id);
  }
  return requestOnlineClassCallToken(id);
}

/** Faculty-only -- the backend itself re-checks the FACULTY role and
 * ownership; this action just exists so the client component never imports
 * a faculty-only API function directly. */
export async function endOnlineClassCallAction(id: string): Promise<void> {
  await endOnlineClassCall(id);
}

export async function muteOnlineClassParticipantAction(
  id: string,
  identity: string,
  muted: boolean,
): Promise<void> {
  await muteOnlineClassParticipant(id, identity, muted);
}
