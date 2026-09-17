"use server";

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

export async function grantRoleAssignmentAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const personId = formData.get("personId");
  if (typeof personId !== "string" || !personId) return { error: "Pick a person." };

  const payload: Record<string, unknown> = {
    personId,
    roleCode: formData.get("roleCode"),
    scopeType: formData.get("scopeType"),
  };
  const scopeId = formData.get("scopeId");
  if (typeof scopeId === "string" && scopeId.trim() !== "") payload.scopeId = scopeId.trim();
  const scopeStage = formData.get("scopeStage");
  if (typeof scopeStage === "string" && scopeStage.trim() !== "") payload.scopeStage = scopeStage.trim();
  const academicYearId = formData.get("academicYearId");
  if (typeof academicYearId === "string" && academicYearId.trim() !== "") payload.academicYearId = academicYearId.trim();

  const res = await apiFetch("/role-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/access-control");
  return {};
}

export async function revokeRoleAssignmentAction(id: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/role-assignments/${id}/revoke`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/access-control");
  return {};
}
