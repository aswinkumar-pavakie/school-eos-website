"use server";

import { revalidatePath } from "next/cache";
import { createEquipmentItem, issueEquipment, returnEquipment } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function issueEquipmentAction(equipmentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const signaturePngBase64 = String(formData.get("signaturePngBase64") ?? "").trim();
  const issuedToStudentId = String(formData.get("issuedToStudentId") ?? "").trim();
  const issuedToTeamId = String(formData.get("issuedToTeamId") ?? "").trim();

  if (!issuedToStudentId && !issuedToTeamId) return { error: "Either a student or a squad is required." };
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
    return { error: err instanceof Error ? err.message : "Could not issue this equipment." };
  }
  revalidatePath("/sports-admin/equipment");
  return {};
}

export async function returnEquipmentAction(issueId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await returnEquipment(issueId, String(formData.get("conditionOnReturn") ?? "").trim() || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record this return." };
  }
  revalidatePath("/sports-admin/equipment");
  return {};
}

export async function createEquipmentItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const quantityRaw = String(formData.get("quantityTotal") ?? "").trim();
  if (!name) return { error: "Item name is required." };
  const quantityTotal = Number(quantityRaw);
  if (!Number.isFinite(quantityTotal) || quantityTotal < 0) return { error: "Enter a valid total quantity." };

  try {
    await createEquipmentItem({
      name,
      quantityTotal,
      sportId: String(formData.get("sportId") ?? "").trim() || undefined,
      condition: String(formData.get("condition") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this item." };
  }
  revalidatePath("/sports-admin/equipment");
  return {};
}
