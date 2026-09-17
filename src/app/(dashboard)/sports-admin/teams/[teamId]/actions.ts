"use server";

import { revalidatePath } from "next/cache";
import { addRosterMember, assignCoach, endRosterMember } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
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
