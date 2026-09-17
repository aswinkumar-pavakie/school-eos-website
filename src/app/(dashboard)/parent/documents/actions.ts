"use server";

import { revalidatePath } from "next/cache";
import { createDocumentRequest, DOCUMENT_TYPES, type DocumentType } from "@/lib/parent-api";

export async function createDocumentRequestAction(studentId: string, docType: DocumentType, reason: string): Promise<void> {
  if (!studentId) throw new Error("No child selected.");
  if (!DOCUMENT_TYPES.includes(docType)) throw new Error("Select a document type.");
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new Error("A reason is required.");

  await createDocumentRequest(studentId, docType, trimmedReason);
  revalidatePath("/parent/documents");
}
