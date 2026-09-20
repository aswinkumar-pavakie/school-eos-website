"use server";

import { revalidatePath } from "next/cache";
import { createInjury, deleteInjury, updateInjury, type InjuryStatus } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createInjuryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const incidentDate = String(formData.get("incidentDate") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  if (!title) return { error: "Describe the injury or incident." };
  if (!incidentDate) return { error: "Pick the incident date." };

  try {
    await createInjury({
      studentId,
      sportId: String(formData.get("sportId") ?? "").trim() || undefined,
      title,
      description: String(formData.get("description") ?? "").trim() || undefined,
      incidentDate,
      guardianInformed: formData.get("guardianInformed") === "on",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record this incident." };
  }
  revalidatePath("/sports-admin/injuries");
  return {};
}

export async function updateInjuryStatusAction(id: string, status: InjuryStatus): Promise<void> {
  await updateInjury(id, { status });
  revalidatePath("/sports-admin/injuries");
}

export async function markGuardianInformedAction(id: string): Promise<void> {
  await updateInjury(id, { guardianInformed: true });
  revalidatePath("/sports-admin/injuries");
}

// Full-record edit + Delete -- genuinely unbuilt before this build (only
// status/guardianInformed were editable, no delete route existed at all).
export async function updateInjuryAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const incidentDate = String(formData.get("incidentDate") ?? "").trim();
  if (!title) return { error: "Describe the injury or incident." };
  if (!incidentDate) return { error: "Pick the incident date." };
  try {
    await updateInjury(id, {
      title,
      description: String(formData.get("description") ?? "").trim() || undefined,
      incidentDate,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this case." };
  }
  revalidatePath("/sports-admin/injuries");
  return {};
}

export async function deleteInjuryAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteInjury(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this case." };
  }
  revalidatePath("/sports-admin/injuries");
  return {};
}
