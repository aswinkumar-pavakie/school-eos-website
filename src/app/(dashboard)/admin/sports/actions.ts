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
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/sports");
  return {};
}

// Sports
export async function createSportAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/sports", "POST", collect(formData, ["name", "sportType", "resultType"]));
}
export async function updateSportAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/sports/${id}`, "PATCH", collect(formData, ["name", "sportType", "resultType", "status"]));
}

// Sport categories
export async function createSportCategoryAction(sportId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/sports/${sportId}/categories`, "POST", collect(formData, ["name", "ageGroup", "gender"]));
}
export async function updateSportCategoryAction(categoryId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/sport-categories/${categoryId}`, "PATCH", collect(formData, ["name", "ageGroup", "gender"]));
}

// Equipment
export async function createEquipmentAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/equipment",
    "POST",
    collect(formData, ["name", "sportId", "quantityTotal", "quantityAvailable", "condition"]),
  );
}
export async function updateEquipmentAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/equipment/${id}`,
    "PATCH",
    collect(formData, ["name", "sportId", "quantityTotal", "quantityAvailable", "condition"]),
  );
}

// Coaches
export async function createCoachAction(_prev: FormActionState, formData: FormData) {
  const payload = collect(formData, [
    "personId",
    "fullName",
    "contactPhone",
    "qualification",
    "policeVerificationRef",
    "verificationExpiry",
  ]);
  payload.isExternal = formData.get("isExternal") === "on";
  return runMutation("/coaches", "POST", payload);
}
export async function updateCoachAction(id: string, _prev: FormActionState, formData: FormData) {
  const payload = collect(formData, [
    "personId",
    "fullName",
    "contactPhone",
    "qualification",
    "policeVerificationRef",
    "verificationExpiry",
    "status",
  ]);
  payload.isExternal = formData.get("isExternal") === "on";
  return runMutation(`/coaches/${id}`, "PATCH", payload);
}
