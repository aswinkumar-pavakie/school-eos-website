"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelImportJob, confirmImportJob, createImportJob, validateImportJob, type ImportRow } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createImportJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let created;
  try {
    created = await createImportJob({
      fileName: String(formData.get("fileName")),
      sourceObjectKey: String(formData.get("fileName")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/obligations/imports");
  redirect(`/finance/obligations/imports/${created.id}`);
}

// The Student select's own value is "assignmentId|studentId" (one assignment IS one
// student — picking it carries both ids at once, no separate raw-id field needed).
function parseRows(formData: FormData): ImportRow[] {
  const assignmentAndStudent = formData.getAll("assignmentAndStudent") as string[];
  const instalments = formData.getAll("instalmentNo") as string[];
  const amounts = formData.getAll("amountRupees") as string[];
  const dueDates = formData.getAll("dueDate") as string[];
  return assignmentAndStudent
    .map((combined, i) => {
      const [assignmentId, studentId] = combined.split("|");
      return {
        assignmentId: assignmentId ?? "",
        studentId: studentId ?? "",
        instalmentNo: Number(instalments[i] || "1"),
        amountPaise: String(Math.round(Number(amounts[i] || "0") * 100)),
        dueDate: dueDates[i],
      };
    })
    .filter((r) => r.assignmentId && r.studentId && r.dueDate && Number(r.amountPaise) > 0);
}

export async function validateImportJobAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const rows = parseRows(formData);
  if (rows.length === 0) return { error: "Add at least one row" };
  try {
    await validateImportJob(id, rows);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Validate failed." };
  }
  revalidatePath(`/finance/obligations/imports/${id}`);
  return {};
}

export async function confirmImportJobAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const rows = parseRows(formData);
  try {
    await confirmImportJob(id, rows);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Confirm failed." };
  }
  revalidatePath(`/finance/obligations/imports/${id}`);
  revalidatePath("/finance/obligations");
  return {};
}

export async function cancelImportJobAction(id: string): Promise<void> {
  await cancelImportJob(id);
  revalidatePath(`/finance/obligations/imports/${id}`);
}
