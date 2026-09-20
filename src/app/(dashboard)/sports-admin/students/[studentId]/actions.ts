"use server";

import { revalidatePath } from "next/cache";
import { createSportsProfile, updateSportsProfile } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function enrollSportAction(
  studentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sportId = String(formData.get("sportId") ?? "").trim();
  const positionOrRole = String(formData.get("positionOrRole") ?? "").trim();
  if (!sportId) return { error: "Pick a sport." };

  try {
    await createSportsProfile(sportId, { studentId, positionOrRole: positionOrRole || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not enroll this player." };
  }
  revalidatePath(`/sports-admin/students/${studentId}`);
  revalidatePath("/sports-admin/students");
  return {};
}

// Edit already real (PATCH /sports/:sportId/profiles/:profileId); "Delete"
// is a Deactivate/Reactivate toggle via the same route's status field -- no
// hard-delete route exists.
export async function updateSportsProfileAction(
  studentId: string,
  sportId: string,
  profileId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const positionOrRole = String(formData.get("positionOrRole") ?? "").trim();
  try {
    await updateSportsProfile(sportId, profileId, { positionOrRole: positionOrRole || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this enrollment." };
  }
  revalidatePath(`/sports-admin/students/${studentId}`);
  return {};
}

export async function setSportsProfileStatusAction(
  studentId: string,
  sportId: string,
  profileId: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<{ error?: string }> {
  try {
    await updateSportsProfile(sportId, profileId, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this enrollment's status." };
  }
  revalidatePath(`/sports-admin/students/${studentId}`);
  revalidatePath("/sports-admin/students");
  return {};
}
