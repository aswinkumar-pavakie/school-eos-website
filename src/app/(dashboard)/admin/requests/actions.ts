"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { approveRequest, rejectRequest, sendBackRequest } from "@/lib/finance-api";

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

// (id, formData) => result wrappers for InlineDecisionCard's list-card
// actions. Approve's comment is optional (a plain click with no reason still
// works); Reject's comment is ALSO optional on this module specifically
// (DecideApprovalRequestDto.comment) -- Admin's own reject doesn't require a
// reason, unlike Principal's /approvals module -- but still accepts one when
// typed, since the shared InlineDecisionCard offers the box either way for a
// consistent interaction. Send back's comment is required
// (SendBackApprovalRequestDto) -- enforced here and by the backend.
export async function approveApprovalRequestInline(id: string, formData: FormData): Promise<FormActionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  return runMutation(`/approval-requests/${id}/approve`, comment ? { comment } : {}, id);
}

export async function rejectApprovalRequestInline(id: string, formData: FormData): Promise<FormActionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  return runMutation(`/approval-requests/${id}/reject`, comment ? { comment } : {}, id);
}

export async function sendBackApprovalRequestInline(id: string, formData: FormData): Promise<FormActionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason/comment · required" };
  return runMutation(`/approval-requests/${id}/send-back`, { comment }, id);
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

// Wiring fix: this module (/approval-requests) is deliberately scoped to only
// the 6 ADMIN_REQUEST_TYPES Admin authors itself (see admin-request-types.ts's
// own comment) -- but the generic approvals engine (approval_policy /
// GET /approvals, the same one Principal's own Requests page reads) can also
// legitimately route a request to ADMIN as approver (e.g. STAFF_LEAVE_REQUEST
// when the Principal is the one on leave -- self-approval is blocked, so it
// routes to Admin instead). Before this, such a request existed, was real,
// and was correctly assigned to Admin -- but Admin's UI had no surface that
// ever queried the generic engine at all, so it was permanently invisible
// here regardless of how correctly it routed. These wrappers reuse the exact
// same finance-api.ts client functions Principal's own /principal/requests
// page already uses against the same real /approvals/:id/approve|reject|
// send-back endpoints -- not a new engine, not a duplicate approval system.
export async function approveGenericApprovalInline(id: string, formData: FormData): Promise<FormActionState> {
  try {
    await approveRequest(id, String(formData.get("comment") ?? "").trim() || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Approve failed." };
  }
  revalidatePath("/admin/requests");
  return {};
}

export async function rejectGenericApprovalInline(id: string, formData: FormData): Promise<FormActionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason · required" };
  try {
    await rejectRequest(id, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reject failed." };
  }
  revalidatePath("/admin/requests");
  return {};
}

export async function sendBackGenericApprovalInline(id: string, formData: FormData): Promise<FormActionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason/comment · required" };
  try {
    await sendBackRequest(id, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Send back failed." };
  }
  revalidatePath("/admin/requests");
  return {};
}
