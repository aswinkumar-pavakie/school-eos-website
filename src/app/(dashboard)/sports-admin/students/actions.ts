"use server";

import { revalidatePath } from "next/cache";
import { createSportsProfile } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

// Design's own "+ Add player" primary button. There is no real
// create-a-brand-new-student capability for this role (that's Admin's
// admissions workflow) -- so this real action enrolls an EXISTING school
// student into a sport, the real capability this role does have (the same
// createSportsProfile write the per-student EnrollSportPanel already uses),
// which is what actually adds them to "the school sports roll" this page is
// titled after.
export async function addPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const sportId = String(formData.get("sportId") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  if (!sportId) return { error: "Pick a sport." };

  try {
    await createSportsProfile(sportId, {
      studentId,
      positionOrRole: String(formData.get("positionOrRole") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this player." };
  }
  revalidatePath("/sports-admin/students");
  return {};
}
