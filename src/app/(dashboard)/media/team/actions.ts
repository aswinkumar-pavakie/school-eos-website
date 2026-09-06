"use server";

import { revalidatePath } from "next/cache";
import { createMediaTeamMember, updateMediaTeamMember } from "@/lib/media-api";

export interface FormState {
  error?: string;
}

function parseSkills(raw: FormDataEntryValue | null): string[] | undefined {
  const value = String(raw ?? "").trim();
  if (!value) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function createMediaTeamMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Full name is required." };

  try {
    await createMediaTeamMember({
      fullName,
      designation: String(formData.get("designation") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      skills: parseSkills(formData.get("skills")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add team member." };
  }
  revalidatePath("/media/team");
  return {};
}

export async function updateMediaTeamMemberAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateMediaTeamMember(id, {
      fullName: String(formData.get("fullName") ?? "").trim() || undefined,
      designation: String(formData.get("designation") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      skills: parseSkills(formData.get("skills")),
      status: formData.get("status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update team member." };
  }
  revalidatePath("/media/team");
  return {};
}
