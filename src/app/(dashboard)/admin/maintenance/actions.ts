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

function collect(formData: FormData, keys: string[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  return payload;
}

async function runMutation(
  path: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
  requestId?: string,
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/maintenance");
  if (requestId) revalidatePath(`/admin/maintenance/${requestId}`);
  return {};
}

export async function createRepairRequestAction(
  inventoryItemId: string | undefined,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload = collect(formData, ["title", "issueType", "location", "priority", "description", "requestedOn"]);
  if (inventoryItemId) payload.inventoryItemId = inventoryItemId;
  return runMutation("/repair-requests", "POST", payload);
}

export async function updateRepairRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/repair-requests/${id}`,
    "PATCH",
    collect(formData, ["title", "issueType", "location", "priority", "description"]),
    id,
  );
}

export async function assignRepairRequestAction(
  id: string,
  assignedToPersonId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (!assignedToPersonId) return { error: "Pick who this work is being assigned to." };
  const payload: Record<string, unknown> = { assignedToPersonId };
  const assignedOn = formData.get("assignedOn");
  if (typeof assignedOn === "string" && assignedOn.trim() !== "") payload.assignedOn = assignedOn;
  return runMutation(`/repair-requests/${id}/assign`, "POST", payload, id);
}

export async function startRepairRequestAction(id: string): Promise<void> {
  await apiFetch(`/repair-requests/${id}/start`, { method: "POST" });
  revalidatePath("/admin/maintenance");
  revalidatePath(`/admin/maintenance/${id}`);
}

export async function completeRepairRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/repair-requests/${id}/complete`,
    "POST",
    collect(formData, ["completedOn", "repairAction", "completionNotes", "costPaise"]),
    id,
  );
}

export async function cancelRepairRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/repair-requests/${id}/cancel`, "POST", collect(formData, ["notes"]), id);
}
