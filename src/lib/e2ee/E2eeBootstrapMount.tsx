"use client";

// Mounts the E2EE device-identity bootstrap for every signed-in faculty
// member the instant they load ANY faculty page -- not just the Message
// screens. This matches the mobile app's own real behavior exactly (its
// useE2eeBootstrap is called from app/(protected)/_layout.tsx, for every
// role, on every sign-in, no role check) -- see that file's own comment.
// Without this, a person who never happened to open Message themselves has
// no registered device, and anyone trying to message them gets a real,
// correct RECIPIENT_NOT_FOUND from the backend that nonetheless looks like a
// bug: the fix is bootstrapping proactively on login, the same as mobile
// does, not waiting for the recipient to visit Message first. Renders
// nothing -- purely a side-effecting mount point.

import { useE2eeBootstrap } from "./bootstrap";

export function E2eeBootstrapMount({ personId }: { personId: string }) {
  useE2eeBootstrap(personId);
  return null;
}
