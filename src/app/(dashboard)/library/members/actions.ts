"use server";

import { revalidatePath } from "next/cache";
import { createMember, reactivateMember, suspendMember, updateMember } from "@/lib/library-api";
import type { MemberType } from "@/lib/library-api";

export interface FormActionState {
  error?: string;
}

export async function createMemberAction(personId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  if (!personId) return { error: "Pick a person first." };
  const memberType = String(formData.get("memberType") ?? "") as MemberType;
  const maxBooksRaw = formData.get("maxBooksAllowed");
  try {
    await createMember({
      personId,
      memberType,
      maxBooksAllowed: typeof maxBooksRaw === "string" && maxBooksRaw.trim() !== "" ? Number(maxBooksRaw) : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/library/members");
  return {};
}

export async function updateMemberAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const maxBooksRaw = formData.get("maxBooksAllowed");
  try {
    await updateMember(id, {
      maxBooksAllowed: typeof maxBooksRaw === "string" && maxBooksRaw.trim() !== "" ? Number(maxBooksRaw) : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath("/library/members");
  revalidatePath(`/library/members/${id}`);
  return {};
}

export async function suspendMemberAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to suspend a member." };
  try {
    await suspendMember(id, reason);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Suspend failed." };
  }
  revalidatePath("/library/members");
  revalidatePath(`/library/members/${id}`);
  return {};
}

export async function reactivateMemberAction(id: string): Promise<void> {
  await reactivateMember(id);
  revalidatePath("/library/members");
  revalidatePath(`/library/members/${id}`);
}
