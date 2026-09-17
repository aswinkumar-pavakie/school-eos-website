"use server";

// Real mark-read against the real backend endpoint (POST /notifications/:id/read)
// -- ownership is enforced server-side (personId from the authenticated
// session, never the client), so this can never mark another person's
// notification read even if a stale/guessed id were submitted.

import { revalidatePath } from "next/cache";
import { markNotificationRead } from "@/lib/notifications-api";

export async function markNotificationReadAction(id: string): Promise<{ error?: string }> {
  try {
    await markNotificationRead(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't mark this as read." };
  }
  revalidatePath("/correspondent/notifications");
  return {};
}
