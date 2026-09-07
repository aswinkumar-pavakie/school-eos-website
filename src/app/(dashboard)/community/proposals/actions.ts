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

export async function createProposalAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const res = await apiFetch("/community-proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/proposals");
  return {};
}

export async function resubmitProposalAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = formData.get("id");
  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const res = await apiFetch(`/community-proposals/${id}/resubmit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/proposals");
  revalidatePath(`/community/proposals/${id}`);
  return {};
}
