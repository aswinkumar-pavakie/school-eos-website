"use server";

import { revalidatePath } from "next/cache";
import { createEquipmentIndent, issueEquipment, returnEquipment } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function issueEquipmentAction(equipmentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const signaturePngBase64 = String(formData.get("signaturePngBase64") ?? "").trim();
  const issuedToStudentId = String(formData.get("issuedToStudentId") ?? "").trim();
  const issuedToTeamId = String(formData.get("issuedToTeamId") ?? "").trim();

  if (!issuedToStudentId && !issuedToTeamId) return { error: "Either a student or a team is required." };
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity < 1) return { error: "Quantity must be at least 1." };
  if (!reason) return { error: "Reason is required." };
  if (!signaturePngBase64) return { error: "A signature is required." };

  try {
    await issueEquipment(
      equipmentId,
      {
        issuedToStudentId: issuedToStudentId || undefined,
        issuedToTeamId: issuedToTeamId || undefined,
        quantity,
        reason,
        dueOn: String(formData.get("dueOn") ?? "").trim() || undefined,
        signaturePngBase64,
      },
      crypto.randomUUID(),
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not issue equipment." };
  }
  revalidatePath("/sports/equipment");
  return {};
}

export async function returnEquipmentAction(issueId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await returnEquipment(issueId, String(formData.get("conditionOnReturn") ?? "").trim() || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record return." };
  }
  revalidatePath("/sports/equipment");
  return {};
}

export async function createIndentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const equipmentId = String(formData.get("equipmentId") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!equipmentId) return { error: "Equipment is required." };
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity < 1) return { error: "Quantity must be at least 1." };
  if (!reason) return { error: "Reason is required." };

  try {
    await createEquipmentIndent({ equipmentId, quantity, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit restock request." };
  }
  revalidatePath("/sports/equipment");
  return {};
}
