"use server";

import { revalidatePath } from "next/cache";
import { createDocumentRequest, DOCUMENT_TYPES, type DocumentType } from "@/lib/parent-api";

export interface FormState {
  error?: string;
}

export async function createDocumentRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const docTypeRaw = String(formData.get("docType") ?? "") as DocumentType;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!studentId) return { error: "No child selected." };
  if (!DOCUMENT_TYPES.includes(docTypeRaw)) return { error: "Select a document type." };
  if (!reason) return { error: "A reason is required." };

  try {
    await createDocumentRequest(studentId, docTypeRaw, reason);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit the request." };
  }
  revalidatePath("/parent/documents");
  return {};
}
