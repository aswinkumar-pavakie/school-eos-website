"use server";

import { revalidatePath } from "next/cache";
import { createAchievement } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createAchievementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const placement = String(formData.get("placement") ?? "").trim();
  const awardedOn = String(formData.get("awardedOn") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  if (!placement) return { error: "Placement is required." };
  if (!awardedOn) return { error: "Pick a date." };
  // Backend requires at least one of teamId/tournamentId -- this screen only
  // offers a squad picker, so it's the one that's required here.
  if (!teamId) return { error: "Pick the squad this achievement belongs to." };

  try {
    await createAchievement({
      studentId,
      placement,
      awardedOn,
      teamId,
      level: String(formData.get("level") ?? "").trim() || undefined,
      title: String(formData.get("title") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record this achievement." };
  }
  revalidatePath("/sports-admin/achievements");
  return {};
}
