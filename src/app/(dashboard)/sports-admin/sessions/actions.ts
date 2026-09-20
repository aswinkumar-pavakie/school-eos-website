"use server";

import { revalidatePath } from "next/cache";
import { createTrainingSession, updateTrainingSession } from "@/lib/sports-admin-api";

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

export async function updateSessionStatusAction(id: string, status: string): Promise<void> {
  await updateTrainingSession(id, { status });
  revalidatePath("/sports-admin/sessions");
}

// Full-record edit -- already real on the backend (PATCH accepts
// scheduledAt/venue/focus/conductedByCoachId/status), just not previously
// surfaced as a form here (only the status dropdown was wired).
export async function updateSessionAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  if (!date || !time) return { error: "Pick a date and time." };
  try {
    await updateTrainingSession(id, {
      scheduledAt: new Date(`${date}T${time}`).toISOString(),
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      focus: String(formData.get("focus") ?? "").trim() || undefined,
      conductedByCoachId: String(formData.get("conductedByCoachId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this session." };
  }
  revalidatePath("/sports-admin/sessions");
  return {};
}
