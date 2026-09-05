"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  activateFeeStructure,
  createFeeStructure,
  deactivateFeeStructure,
  deleteFeeStructure,
  type FeeStructureLineInput,
} from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

function parseLines(formData: FormData): FeeStructureLineInput[] {
  const feeHeadIds = formData.getAll("lineFeeHeadId") as string[];
  const amounts = formData.getAll("lineAmountRupees") as string[];
  const dueDates = formData.getAll("lineDueDate") as string[];
  return feeHeadIds
    .map((feeHeadId, i) => ({
      feeHeadId,
      amountPaise: String(Math.round(Number(amounts[i] || "0") * 100)),
      dueDate: dueDates[i],
      instalmentNo: i + 1,
    }))
    .filter((l) => l.feeHeadId && l.dueDate && Number(l.amountPaise) > 0);
}

export async function createFeeStructureAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const lines = parseLines(formData);
  if (lines.length === 0) return { error: "Add at least one fee line" };

  let created;
  try {
    created = await createFeeStructure({
      academicYearId: String(formData.get("academicYearId")),
      gradeId: String(formData.get("gradeId")),
      mediumId: String(formData.get("mediumId") || "") || undefined,
      category: String(formData.get("category") || "") || undefined,
      lines,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/fee-structures");
  redirect(`/finance/fee-structures/${created.id}`);
}

export async function deleteFeeStructureAction(id: string): Promise<void> {
  await deleteFeeStructure(id);
  revalidatePath("/finance/fee-structures");
  redirect("/finance/fee-structures");
}

export async function activateFeeStructureAction(id: string): Promise<void> {
  await activateFeeStructure(id);
  revalidatePath(`/finance/fee-structures/${id}`);
}

export async function deactivateFeeStructureAction(id: string): Promise<void> {
  await deactivateFeeStructure(id);
  revalidatePath(`/finance/fee-structures/${id}`);
}
