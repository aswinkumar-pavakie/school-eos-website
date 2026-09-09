"use server";

import { revalidatePath } from "next/cache";
import { createAppraisal } from "@/lib/faculty-staff-api";

export interface FormState {
  error?: string;
}

export async function createAppraisalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const selfAssessment = String(formData.get("selfAssessment") ?? "");
  if (selfAssessment.trim().length < 20) return { error: "Self assessment must be at least 20 characters." };
  try {
    await createAppraisal({
      cycle: String(formData.get("cycle") ?? ""),
      selfAssessment,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit appraisal." };
  }
  revalidatePath("/faculty/appraisal");
  return {};
}
