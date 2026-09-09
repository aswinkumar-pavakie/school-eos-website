"use server";

import { revalidatePath } from "next/cache";
import { createSportsProfile, updateSportsProfile } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createProfileAction(sportId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) return { error: "Student ID is required." };

  try {
    await createSportsProfile(sportId, {
      studentId,
      positionOrRole: String(formData.get("positionOrRole") ?? "").trim() || undefined,
      joinedOn: String(formData.get("joinedOn") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save profile." };
  }
  revalidatePath("/sports/profiles");
  return {};
}

export async function updateProfileAction(sportId: string, profileId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateSportsProfile(sportId, profileId, {
      positionOrRole: String(formData.get("positionOrRole") ?? "").trim() || undefined,
      status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update profile." };
  }
  revalidatePath("/sports/profiles");
  return {};
}
