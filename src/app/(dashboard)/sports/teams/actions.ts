"use server";

import { revalidatePath } from "next/cache";
import { addRosterMember, assignCoach, createTeam, endRosterMember } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sportId = String(formData.get("sportId") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!sportId) return { error: "Sport is required." };
  if (!academicYearId) return { error: "Academic year is required." };
  if (!name) return { error: "Team name is required." };

  try {
    await createTeam({
      sportId,
      academicYearId,
      name,
      sportCategoryId: String(formData.get("sportCategoryId") ?? "").trim() || undefined,
      houseId: String(formData.get("houseId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create team." };
  }
  revalidatePath("/sports/teams");
  return {};
}

export async function addRosterMemberAction(teamId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) return { error: "Student ID is required." };
  const jerseyNoRaw = String(formData.get("jerseyNo") ?? "").trim();

  try {
    await addRosterMember(teamId, {
      studentId,
      jerseyNo: jerseyNoRaw ? Number(jerseyNoRaw) : undefined,
      role: String(formData.get("role") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add roster member." };
  }
  revalidatePath("/sports/teams");
  return {};
}

// Fire-and-forget (bound straight to a plain <form action>, no useActionState) --
// a thrown error surfaces via the nearest error.tsx rather than an inline message.
export async function endRosterMemberAction(teamId: string, memberId: string): Promise<void> {
  await endRosterMember(teamId, memberId);
  revalidatePath("/sports/teams");
}

export async function assignCoachAction(teamId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const coachId = String(formData.get("coachId") ?? "").trim();
  if (!coachId) return { error: "Coach ID is required." };

  try {
    await assignCoach(teamId, coachId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign coach." };
  }
  revalidatePath("/sports/teams");
  return {};
}
