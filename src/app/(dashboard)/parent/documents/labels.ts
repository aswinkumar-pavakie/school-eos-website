import type { DocumentType } from "@/lib/document-types";

/** "BONAFIDE_CERTIFICATE" -> "Bonafide Certificate" -- shared by the page's
 * own list and the new-request modal's <SelectField> options. */
export function docTypeLabel(docType: DocumentType): string {
  return docType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
