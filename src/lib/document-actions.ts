"use server";

// Shared certificate/document upload -- backs a "Certificates" section on any
// profile (Student now, Faculty/Parent can reuse the same POST /documents/upload
// once they want one too). ownerDomain 'PEOPLE' + ownerObjectType/ownerObjectId
// scope a document to one specific person's record.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface DocumentActionState {
  error?: string;
}

export async function uploadDocumentAction(
  ownerObjectType: string,
  ownerObjectId: string,
  category: string,
  revalidatePaths: string[],
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }
  const docType = formData.get("docType");
  if (typeof docType !== "string" || docType.trim() === "") {
    return { error: "Certificate type is required." };
  }

  const uploadBody = new FormData();
  uploadBody.set("file", file);
  uploadBody.set("ownerDomain", "PEOPLE");
  uploadBody.set("ownerObjectType", ownerObjectType);
  uploadBody.set("ownerObjectId", ownerObjectId);
  uploadBody.set("category", category);
  uploadBody.set("docType", docType);

  const res = await apiFetch("/documents/upload", { method: "POST", body: uploadBody });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    return { error: message ?? "Couldn't upload that file. Nothing was changed." };
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return {};
}

export async function purgeDocumentAction(id: string, revalidatePaths: string[]): Promise<void> {
  const res = await apiFetch(`/documents/${id}/purge`, { method: "POST" });
  if (!res.ok) throw new Error("Couldn't remove this document. Nothing was changed.");
  for (const path of revalidatePaths) revalidatePath(path);
}
