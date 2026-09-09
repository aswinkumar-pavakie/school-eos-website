"use server";

import { revalidatePath } from "next/cache";
import { createOdRequest } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createOdRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!teamId) return { error: "Team is required." };
  if (!eventDate) return { error: "Event date is required." };
  if (!reason) return { error: "Reason is required." };

  try {
    await createOdRequest({
      teamId,
      eventDate,
      reason,
      fixtureId: String(formData.get("fixtureId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit OD request." };
  }
  revalidatePath("/sports/od-requests");
  return {};
}
