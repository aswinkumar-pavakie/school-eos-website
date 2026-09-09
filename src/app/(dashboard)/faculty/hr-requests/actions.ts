"use server";

import { revalidatePath } from "next/cache";
import { createHrRequest } from "@/lib/faculty-staff-api";

export interface FormState {
  error?: string;
}

export async function createHrRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createHrRequest({
      category: String(formData.get("category") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit request." };
  }
  revalidatePath("/faculty/hr-requests");
  return {};
}
