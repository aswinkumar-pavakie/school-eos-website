"use server";

import { revalidatePath } from "next/cache";
import { assignClassAdvisor, assignOfferingTeacher } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function assignOfferingTeacherAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const subjectOfferingId = String(formData.get("subjectOfferingId") ?? "");
  const teacherStaffId = String(formData.get("teacherStaffId") ?? "");
  if (!subjectOfferingId || !teacherStaffId) return { error: "Pick a teacher." };
  try {
    await assignOfferingTeacher(subjectOfferingId, teacherStaffId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign this teacher." };
  }
  revalidatePath("/academic-coordinator/approvals");
  revalidatePath("/academic-coordinator");
  return {};
}

export async function assignAdvisorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sectionId = String(formData.get("sectionId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  if (!sectionId || !personId) return { error: "Pick a teacher." };
  try {
    await assignClassAdvisor(sectionId, personId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign this advisor." };
  }
  revalidatePath("/academic-coordinator/approvals");
  revalidatePath("/academic-coordinator");
  return {};
}
