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

export async function createAnnouncementAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const audienceType = formData.get("audienceType");
  const payload: Record<string, unknown> = {
    title: formData.get("title"),
    body: formData.get("body"),
    priority: formData.get("priority"),
    isEmergency: formData.get("isEmergency") === "on",
    audienceType,
  };
  const category = formData.get("category");
  if (typeof category === "string" && category.trim() !== "") payload.category = category;
  const expiresAt = formData.get("expiresAt");
  if (typeof expiresAt === "string" && expiresAt.trim() !== "") payload.expiresAt = expiresAt;

  if (audienceType === "ROLE") {
    const targetRoles = formData.getAll("targetRoles").filter((v): v is string => typeof v === "string" && v !== "");
    if (targetRoles.length === 0) return { error: "Pick at least one role to send this to." };
    payload.targetRoles = targetRoles;
  }

  const res = await apiFetch("/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/announcements");
  return {};
}

export async function archiveAnnouncementAction(id: string): Promise<void> {
  const res = await apiFetch(`/announcements/${id}/archive`, { method: "POST" });
  if (!res.ok) throw new Error("Couldn't archive this announcement. Nothing was changed.");
  revalidatePath("/admin/announcements");
}
