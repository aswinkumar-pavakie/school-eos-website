"use server";

import { revalidatePath } from "next/cache";
import { createCoach } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createCoachAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const isExternal = formData.get("isExternal") === "on";
  const personId = String(formData.get("personId") ?? "").trim();
  if (!fullName) return { error: "Full name is required." };
  if (!isExternal && !personId) return { error: "An in-house coach must be linked to an existing staff member." };

  try {
    await createCoach({
      fullName,
      isExternal,
      personId: isExternal ? undefined : personId,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || undefined,
      qualification: String(formData.get("qualification") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this coach." };
  }
  revalidatePath("/sports-admin/coaches");
  return {};
}
