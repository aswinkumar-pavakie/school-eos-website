"use server";

import { revalidatePath } from "next/cache";
import { createTrainingSession } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createTrainingSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  if (!teamId) return { error: "Pick a squad." };
  if (!date || !time) return { error: "Pick a date and time." };

  try {
    await createTrainingSession({
      teamId,
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      focus: String(formData.get("focus") ?? "").trim() || undefined,
      conductedByCoachId: String(formData.get("conductedByCoachId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not schedule this session." };
  }
  revalidatePath("/sports-admin/sessions");
  return {};
}
