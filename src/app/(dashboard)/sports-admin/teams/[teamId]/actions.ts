"use server";

import { revalidatePath } from "next/cache";
import { addRosterMember, assignCoach, endRosterMember, updateTeam } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

// Edit/Delete (as deactivate) for the team itself -- genuinely unbuilt
// before this build (see backend's sports-faculty-teams.controller.ts own
// comment).
export async function updateTeamAction(teamId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Squad name is required." };
  try {
    await updateTeam(teamId, { name });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this squad." };
  }
  revalidatePath(`/sports-admin/teams/${teamId}`);
  revalidatePath("/sports-admin/teams");
  return {};
}

export async function setTeamStatusAction(teamId: string, status: "ACTIVE" | "INACTIVE"): Promise<{ error?: string }> {
  try {
    await updateTeam(teamId, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this squad's status." };
  }
  revalidatePath(`/sports-admin/teams/${teamId}`);
  revalidatePath("/sports-admin/teams");
  return {};
}

export async function addRosterMemberAction(teamId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  const jerseyRaw = String(formData.get("jerseyNo") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  try {
    await addRosterMember(teamId, {
      studentId,
      jerseyNo: jerseyRaw ? Number(jerseyRaw) : undefined,
      role: role || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this player to the squad." };
  }
  revalidatePath(`/sports-admin/teams/${teamId}`);
  return {};
}

export async function endRosterMemberAction(teamId: string, memberId: string): Promise<FormState> {
  try {
    await endRosterMember(teamId, memberId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not remove this player." };
  }
  revalidatePath(`/sports-admin/teams/${teamId}`);
  return {};
}

export async function assignCoachAction(teamId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const coachId = String(formData.get("coachId") ?? "").trim();
  if (!coachId) return { error: "Pick a coach." };
  try {
    await assignCoach(teamId, coachId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign this coach." };
  }
  revalidatePath(`/sports-admin/teams/${teamId}`);
  return {};
}
