"use server";

import { revalidatePath } from "next/cache";
import { createTrial, deleteTrial, updateTrial, type TrialRound, type TrialStatus } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createTrialAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const sportId = String(formData.get("sportId") ?? "").trim();
  const round = String(formData.get("round") ?? "").trim() as TrialRound;
  const trialDate = String(formData.get("trialDate") ?? "").trim();
  if (!studentId) return { error: "Pick a candidate." };
  if (!sportId) return { error: "Pick a sport." };
  if (!trialDate) return { error: "Pick a trial date." };

  try {
    await createTrial({
      studentId,
      sportId,
      round,
      trialDate,
      score: String(formData.get("score") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not schedule this trial." };
  }
  revalidatePath("/sports-admin/trials");
  return {};
}

export async function updateTrialStatusAction(id: string, status: TrialStatus): Promise<void> {
  await updateTrial(id, { status });
  revalidatePath("/sports-admin/trials");
}

// Full-record edit + Delete -- genuinely unbuilt before this build (only
// status/score/notes were editable, no delete route existed at all).
export async function updateTrialAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const round = String(formData.get("round") ?? "").trim() as TrialRound;
  const trialDate = String(formData.get("trialDate") ?? "").trim();
  if (!trialDate) return { error: "Pick a trial date." };
  try {
    await updateTrial(id, {
      round,
      trialDate,
      score: String(formData.get("score") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this trial." };
  }
  revalidatePath("/sports-admin/trials");
  return {};
}

export async function deleteTrialAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteTrial(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this trial." };
  }
  revalidatePath("/sports-admin/trials");
  return {};
}
