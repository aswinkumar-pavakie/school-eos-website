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
  itemId?: string,
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/inventory");
  if (itemId) revalidatePath(`/admin/inventory/items/${itemId}`);
  return {};
}

// Categories
export async function createInventoryCategoryAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/inventory-categories", "POST", collect(formData, ["name"]));
}
export async function updateInventoryCategoryAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-categories/${id}`, "PATCH", collect(formData, ["name", "status"]));
}

// Items -- plain create/edit
export async function createInventoryItemAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/inventory-items",
    "POST",
    collect(formData, [
      "name",
      "categoryId",
      "assetCode",
      "quantity",
      "lowStockThreshold",
      "location",
      "description",
      "acquisitionDate",
      "acquisitionCostPaise",
      "vendor",
    ]),
  );
}
export async function updateInventoryItemAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/inventory-items/${id}`,
    "PATCH",
    collect(formData, [
      "name",
      "categoryId",
      "assetCode",
      "lowStockThreshold",
      "location",
      "description",
      "acquisitionDate",
      "acquisitionCostPaise",
      "vendor",
    ]),
    id,
  );
}

// Items -- stock/status actions
export async function addStockAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/add-stock`, "POST", collect(formData, ["quantity", "notes"]), id);
}
export async function adjustStockAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/adjust-stock`, "POST", collect(formData, ["quantity", "reason"]), id);
}
export async function issueInventoryItemAction(
  id: string,
  assignedToPersonId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (!assignedToPersonId) return { error: "Pick who this item is being issued to." };
  const payload: Record<string, unknown> = { assignedToPersonId };
  const assignedOn = formData.get("assignedOn");
  if (typeof assignedOn === "string" && assignedOn.trim() !== "") payload.assignedOn = assignedOn;
  return runMutation(`/inventory-items/${id}/issue`, "POST", payload, id);
}
export async function returnInventoryItemAction(id: string): Promise<void> {
  await apiFetch(`/inventory-items/${id}/return`, { method: "POST" });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/items/${id}`);
}
export async function transferInventoryItemAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/transfer`, "POST", collect(formData, ["location"]), id);
}
export async function markInventoryItemDamagedAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/mark-damaged`, "POST", collect(formData, ["notes"]), id);
}
export async function markInventoryItemLostAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/mark-lost`, "POST", collect(formData, ["notes"]), id);
}
export async function retireInventoryItemAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/inventory-items/${id}/retire`, "POST", collect(formData, ["notes"]), id);
}
