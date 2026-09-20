"use server";

import { revalidatePath } from "next/cache";
import { createCoach, updateCoach } from "@/lib/sports-admin-api";

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

// Edit already real (PATCH /coaches/:id); "Delete" is a Deactivate/
// Reactivate toggle via the same route's status field -- no hard-delete
// route exists.
export async function updateCoachAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Full name is required." };
  try {
    await updateCoach(id, {
      fullName,
      contactPhone: String(formData.get("contactPhone") ?? "").trim() || undefined,
      qualification: String(formData.get("qualification") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this coach." };
  }
  revalidatePath("/sports-admin/coaches");
  return {};
}

export async function setCoachStatusAction(id: string, status: "ACTIVE" | "INACTIVE"): Promise<{ error?: string }> {
  try {
    await updateCoach(id, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this coach's status." };
  }
  revalidatePath("/sports-admin/coaches");
  return {};
}
