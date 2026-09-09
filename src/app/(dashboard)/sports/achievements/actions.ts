"use server";

import { revalidatePath } from "next/cache";
import { createAchievement } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createAchievementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const tournamentId = String(formData.get("tournamentId") ?? "").trim();
  const placement = String(formData.get("placement") ?? "").trim();
  const awardedOn = String(formData.get("awardedOn") ?? "").trim();

  if (!studentId) return { error: "Student ID is required." };
  if (!teamId && !tournamentId) return { error: "Either a team or a tournament is required." };
  if (!placement) return { error: "Placement is required." };
  if (!awardedOn) return { error: "Awarded date is required." };

  try {
    await createAchievement({
      studentId,
      teamId: teamId || undefined,
      tournamentId: tournamentId || undefined,
      placement,
      awardedOn,
      title: String(formData.get("title") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record achievement." };
  }
  revalidatePath("/sports/achievements");
  return {};
}
