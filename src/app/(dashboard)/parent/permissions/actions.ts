"use server";

import { revalidatePath } from "next/cache";
import { rejectPermissionRequest, signPermissionRequest } from "@/lib/parent-api";

export interface FormState {
  error?: string;
}

export async function rejectPermissionRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const requestId = String(formData.get("requestId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!requestId) return { error: "Missing request." };

  try {
    await rejectPermissionRequest(requestId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reject this request." };
  }
  revalidatePath(`/parent/permissions?studentId=${studentId}&requestId=${requestId}`);
  return {};
}

export async function signPermissionRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const requestId = String(formData.get("requestId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const signaturePngBase64 = String(formData.get("signaturePngBase64") ?? "");
  if (!requestId) return { error: "Missing request." };
  if (!signaturePngBase64) return { error: "Please sign in the box above before approving." };

  try {
    await signPermissionRequest(requestId, signaturePngBase64);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit the signature." };
  }
  revalidatePath(`/parent/permissions?studentId=${studentId}&requestId=${requestId}`);
  return {};
}
