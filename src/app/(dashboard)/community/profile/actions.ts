"use server";

// Community proposing add/remove for its OWN roster -- reviewed by Principal
// through the existing generic approvals engine (COMMUNITY_MEMBERSHIP_ADD /
// COMMUNITY_MEMBERSHIP_REMOVE request types), not a direct write. Admin's own
// direct add/remove (admin/community/actions.ts) is untouched and unrelated.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function requestAddMembershipAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = { studentId: formData.get("studentId") };
  const roleInCommunity = formData.get("roleInCommunity");
  if (typeof roleInCommunity === "string" && roleInCommunity.trim() !== "") {
    payload.roleInCommunity = roleInCommunity;
  }

  const res = await apiFetch("/community-membership-requests/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/profile");
  return {};
}

export async function requestRemoveMembershipAction(membershipId: string): Promise<{ error?: string }> {
  const res = await apiFetch("/community-membership-requests/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membershipId }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/profile");
  return {};
}
