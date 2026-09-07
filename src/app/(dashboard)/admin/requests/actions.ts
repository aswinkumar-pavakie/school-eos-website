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

async function runMutation(path: string, payload: Record<string, unknown>, id?: string): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/requests");
  if (id) revalidatePath(`/admin/requests/${id}`);
  return {};
}

export async function createApprovalRequestAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const requestType = formData.get("requestType");
  const payload: Record<string, unknown> = {
    requestType,
    description: formData.get("description"),
  };
  const requestedByPersonId = formData.get("requestedByPersonId");
  if (typeof requestedByPersonId === "string" && requestedByPersonId.trim() !== "") {
    payload.requestedByPersonId = requestedByPersonId;
  }
  const reason = formData.get("reason");
  if (typeof reason === "string" && reason.trim() !== "") payload.reason = reason;

  const actionPayload: Record<string, unknown> = {};
  const actionKeys = [
    "action",
    "targetPersonId",
    "roleCode",
    "scopeType",
    "scopeId",
    "roleAssignmentId",
    "attendanceRecordId",
    "newStatus",
    "studentId",
    "field",
    "newValue",
    "itemId",
    "assignedToPersonId",
    "location",
    "title",
    "inventoryItemId",
    "issueType",
    "priority",
  ];
  for (const key of actionKeys) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") actionPayload[key] = value;
  }
  // Repair requests reuse the top-level description as their own description.
  if (requestType === "REPAIR_MAINTENANCE_REQUEST") actionPayload.description = payload.description;
  if (Object.keys(actionPayload).length > 0) payload.actionPayload = actionPayload;

  return runMutation("/approval-requests", payload);
}

export async function approveApprovalRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  const comment = formData.get("comment");
  const payload: Record<string, unknown> = {};
  if (typeof comment === "string" && comment.trim() !== "") payload.comment = comment;
  return runMutation(`/approval-requests/${id}/approve`, payload, id);
}

export async function rejectApprovalRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  const comment = formData.get("comment");
  const payload: Record<string, unknown> = {};
  if (typeof comment === "string" && comment.trim() !== "") payload.comment = comment;
  return runMutation(`/approval-requests/${id}/reject`, payload, id);
}

export async function sendBackApprovalRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/approval-requests/${id}/send-back`, { comment: formData.get("comment") }, id);
}

export async function resubmitApprovalRequestAction(id: string, _prev: FormActionState, formData: FormData) {
  const payload: Record<string, unknown> = {};
  const description = formData.get("description");
  if (typeof description === "string" && description.trim() !== "") payload.description = description;
  const comment = formData.get("comment");
  if (typeof comment === "string" && comment.trim() !== "") payload.comment = comment;
  return runMutation(`/approval-requests/${id}/resubmit`, payload, id);
}
