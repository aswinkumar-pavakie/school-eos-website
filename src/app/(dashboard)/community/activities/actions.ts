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

export async function createInitiativeAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const payload: Record<string, unknown> = { proposalId: formData.get("proposalId") };
  const plannedDate = formData.get("plannedDate");
  if (typeof plannedDate === "string" && plannedDate !== "") payload.plannedDate = plannedDate;
  const venue = formData.get("venue");
  if (typeof venue === "string" && venue.trim() !== "") payload.venue = venue;

  const res = await apiFetch("/community-initiatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/activities");
  return {};
}

// Phase 9 -- editable only while PLANNED (enforced server-side, not just by
// which form the UI shows).
export async function updateInitiativeAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = formData.get("id");
  const payload: Record<string, unknown> = {
    title: formData.get("title"),
    description: formData.get("description"),
  };
  const plannedDate = formData.get("plannedDate");
  if (typeof plannedDate === "string" && plannedDate !== "") payload.plannedDate = plannedDate;
  const venue = formData.get("venue");
  if (typeof venue === "string" && venue.trim() !== "") payload.venue = venue;

  const res = await apiFetch(`/community-initiatives/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/activities");
  revalidatePath(`/community/activities/${id}`);
  return {};
}

export async function startInitiativeAction(id: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/community-initiatives/${id}/start`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/activities");
  revalidatePath(`/community/activities/${id}`);
  return {};
}

// Form action, not a bare button -- completion now optionally captures an
// outcome (Phase 7), so this needs real form input, not just an id.
export async function completeInitiativeAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = formData.get("id");
  const payload: Record<string, unknown> = {};
  const outcome = formData.get("outcome");
  if (typeof outcome === "string" && outcome.trim() !== "") payload.outcome = outcome;

  const res = await apiFetch(`/community-initiatives/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/community/activities");
  revalidatePath(`/community/activities/${id}`);
  return {};
}

export async function updateProgressAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = formData.get("id");
  const payload = { progressNotes: formData.get("progressNotes") };

  const res = await apiFetch(`/community-initiatives/${id}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/community/activities/${id}`);
  return {};
}
