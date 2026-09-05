"use server";

import { revalidatePath } from "next/cache";
import { createConcession, deleteConcession, updateConcession, type ConcessionType } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createConcessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const kind = String(formData.get("kind"));
  const amountRupees = String(formData.get("amountRupees") || "");
  const percent = String(formData.get("percent") || "");

  try {
    await createConcession({
      studentId: String(formData.get("studentId")),
      academicYearId: String(formData.get("academicYearId")),
      concessionType: String(formData.get("concessionType")) as ConcessionType,
      amountPaise: kind === "amount" && amountRupees ? String(Math.round(Number(amountRupees) * 100)) : undefined,
      percent: kind === "percent" && percent ? percent : undefined,
      reason: String(formData.get("reason")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/concessions");
  return {};
}

export async function deleteConcessionAction(id: string): Promise<void> {
  await deleteConcession(id);
  revalidatePath("/finance/concessions");
}

// Only the amount/percent/reason are ever editable, and only while still PENDING —
// the backend itself re-checks state and the amount/percent XOR on every call.
export async function updateConcessionAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const kind = String(formData.get("kind"));
  const amountRupees = String(formData.get("amountRupees") || "");
  const percent = String(formData.get("percent") || "");
  try {
    await updateConcession(id, {
      amountPaise: kind === "amount" && amountRupees ? String(Math.round(Number(amountRupees) * 100)) : undefined,
      percent: kind === "percent" && percent ? percent : undefined,
      reason: String(formData.get("reason") || "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath(`/finance/concessions/${id}`);
  revalidatePath("/finance/concessions");
  return {};
}
