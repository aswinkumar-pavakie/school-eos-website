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
  revalidatePath("/admin/settings");
  return {};
}

// School profile
export async function updateSchoolAction(_prev: FormActionState, formData: FormData) {
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

// Document retention policies -- category is the primary key (a string), not a
// generated id. isPermanent/retentionYears are mutually exclusive -- the form only
// ever sends one of them (see RetentionPoliciesPanel.tsx).
export async function createRetentionPolicyAction(_prev: FormActionState, formData: FormData) {
  const payload = collect(formData, ["category", "description", "retentionYears", "anchor", "graceDays"]);
  payload.isPermanent = formData.get("isPermanent") === "on";
  payload.isRestricted = formData.get("isRestricted") === "on";
  if (payload.isPermanent) delete payload.retentionYears;
  return runMutation("/document-retention-policies", "POST", payload);
}
export async function updateRetentionPolicyAction(
  category: string,
  _prev: FormActionState,
  formData: FormData,
) {
  const payload = collect(formData, ["description", "retentionYears", "anchor", "graceDays"]);
  payload.isPermanent = formData.get("isPermanent") === "on";
  payload.isRestricted = formData.get("isRestricted") === "on";
  if (payload.isPermanent) delete payload.retentionYears;
  return runMutation(`/document-retention-policies/${category}`, "PATCH", payload);
}

// Terminals -- terminalType gates which of vehicleId/vendorId is sent (BUS needs
// vehicleId, CANTEEN needs vendorId, GATE/LIBRARY need neither) -- a mismatch is a
// clean 400 from the backend, surfaced through the normal error path.
export async function createTerminalAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/terminals",
    "POST",
    collect(formData, [
      "terminalUid",
      "terminalType",
      "label",
      "vehicleId",
      "vendorId",
      "authSecretRef",
      "firmwareVersion",
    ]),
  );
}
export async function updateTerminalAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/terminals/${id}`,
    "PATCH",
    collect(formData, [
      "terminalUid",
      "terminalType",
      "label",
      "vehicleId",
      "vendorId",
      "authSecretRef",
      "firmwareVersion",
      "status",
    ]),
  );
}
