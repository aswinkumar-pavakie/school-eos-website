"use server";

import { revalidatePath } from "next/cache";
import { createObligation, deleteObligation, updateObligation, waiveObligation } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

function revalidateStudentWorkspace(): void {
  // Broadly invalidates every Student Workspace page (across all ids) since the
  // waived/deleted obligation's studentId isn't known here without an extra fetch.
  revalidatePath("/finance/students/[id]", "layout");
}

export async function createObligationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  const [assignmentId, studentId] = String(formData.get("assignmentAndStudent") ?? "").split("|");
  if (!assignmentId || !studentId) return { error: "Student · required" };
  try {
    await createObligation({
      assignmentId,
      studentId,
      feeHeadId: String(formData.get("feeHeadId") || "") || undefined,
      instalmentNo: Number(formData.get("instalmentNo") || "1"),
      amountPaise: String(Math.round(amountRupees * 100)),
      dueDate: String(formData.get("dueDate")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/obligations");
  revalidateStudentWorkspace();
  return {};
}

export async function updateObligationAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = String(formData.get("amountRupees") ?? "").trim();
  try {
    await updateObligation(id, {
      amountPaise: amountRupees ? String(Math.round(Number(amountRupees) * 100)) : undefined,
      dueDate: String(formData.get("dueDate") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath("/finance/obligations");
  revalidateStudentWorkspace();
  return {};
}

export async function deleteObligationAction(id: string): Promise<void> {
  await deleteObligation(id);
  revalidatePath("/finance/obligations");
  revalidateStudentWorkspace();
}

export async function waiveObligationAction(id: string, formData: FormData): Promise<void> {
  await waiveObligation(id, String(formData.get("reason") || "Waived by Finance"));
  revalidatePath("/finance/obligations");
  revalidateStudentWorkspace();
}
