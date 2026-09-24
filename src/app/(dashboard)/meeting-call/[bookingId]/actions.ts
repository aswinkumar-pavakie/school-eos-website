"use server";

// Server Action layer for the shared Faculty/Parent video-call page --
// mints the LiveKit join token server-side (using the SAME real
// authorization checks the mobile app's identical endpoints already go
// through; nothing here re-implements or weakens that). Real role
// detection (getCurrentActor) decides which of the two backend endpoints
// gets called; a caller who isn't actually FACULTY or PARENT on this exact
// booking gets the backend's own 403/404, same as everywhere else in this
// app -- this layer never decides authorization itself.

import { getCurrentActor } from "@/lib/api";
import { requestFacultyCallToken, type MeetingCallCredentials } from "@/lib/faculty-staff-api";
import { requestParentCallToken } from "@/lib/parent-api";

export async function requestCallTokenAction(bookingId: string): Promise<MeetingCallCredentials> {
  const actor = await getCurrentActor();
  // A Class Teacher login (CLASS_ADVISOR only) hosts parent meetings too --
  // the backend's faculty call-token endpoint accepts it, so it must not be
  // treated as the parent side.
  if (actor.roles.includes("FACULTY") || actor.roles.includes("CLASS_ADVISOR")) {
    return requestFacultyCallToken(bookingId);
  }
  return requestParentCallToken(bookingId);
}
