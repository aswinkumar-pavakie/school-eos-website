"use server";

import { joinOnlineClass } from "@/lib/parent-api";

export async function joinOnlineClassAction(id: string): Promise<{ meetingUrl?: string; error?: string }> {
  try {
    const { meetingUrl } = await joinOnlineClass(id);
    return { meetingUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not join this class." };
  }
}
