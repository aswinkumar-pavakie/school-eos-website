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

async function runMutation(path: string, method: "POST" | "PATCH", payload: Record<string, unknown>): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/settings");
  return {};
}

export async function updateSchoolAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  return runMutation(
    "/school",
    "PATCH",
    collect(formData, [
      "name",
      "code",
      "board",
      "schoolType",
      "recognitionNo",
      "stateSchoolCode",
      "addressLine1",
      "addressLine2",
      "city",
      "district",
      "state",
      "pincode",
      "contactPhone",
      "contactEmail",
      "timezone",
      "defaultLocale",
    ]),
  );
}

export async function createCampusAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  return runMutation("/campuses", "POST", collect(formData, ["name", "code", "address", "status"]));
}
export async function updateCampusAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  return runMutation(`/campuses/${id}`, "PATCH", collect(formData, ["name", "code", "address", "status"]));
}
export async function setPrimaryCampusAction(id: string): Promise<FormActionState> {
  const res = await apiFetch(`/campuses/${id}/set-primary`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/settings");
  return {};
}

export async function createDepartmentAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  return runMutation("/departments", "POST", collect(formData, ["name", "code", "hodStaffId", "status"]));
}
export async function updateDepartmentAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  return runMutation(`/departments/${id}`, "PATCH", collect(formData, ["name", "code", "hodStaffId", "status"]));
}
