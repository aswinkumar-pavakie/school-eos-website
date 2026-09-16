"use server";

// Same real backend calls the older /faculty/coordinator/exams pages already
// use (faculty-coordinator-api.ts, not duplicated) -- these wrappers just
// revalidate the new portal's own paths instead of the old ones.

import { revalidatePath } from "next/cache";
import {
  advanceExamState,
  createCoordinatorExam,
  createExamSubject,
  updateExamSubject,
} from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function createExamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const gradeIds = formData.getAll("gradeIds").map(String).filter(Boolean);
  if (gradeIds.length === 0) return { error: "Pick at least one grade." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Exam name is required." };
  try {
    await createCoordinatorExam({
      name,
      examType: String(formData.get("examType") ?? "") || "UNIT_TEST",
      term: String(formData.get("term") ?? "") || undefined,
      gradeIds,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create exam." };
  }
  revalidatePath("/academic-coordinator/exams");
  return {};
}

export async function advanceExamAction(examId: string): Promise<void> {
  await advanceExamState(examId);
  revalidatePath(`/academic-coordinator/exams/${examId}`);
  revalidatePath("/academic-coordinator/exams");
}

export async function createExamSubjectAction(examId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const maxMarksRaw = String(formData.get("maxMarks") ?? "").trim();
  const passMarksRaw = String(formData.get("passMarks") ?? "").trim();
  const subjectOfferingId = String(formData.get("subjectOfferingId") ?? "");
  if (!subjectOfferingId) return { error: "Pick a class/subject." };
  try {
    await createExamSubject(examId, {
      subjectOfferingId,
      maxMarks: Number(maxMarksRaw || "50"),
      passMarks: passMarksRaw ? Number(passMarksRaw) : undefined,
      examDate: String(formData.get("examDate") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this class." };
  }
  revalidatePath(`/academic-coordinator/exams/${examId}`);
  return {};
}

export async function updateExamSubjectDateAction(examSubjectId: string, examId: string, examDate: string): Promise<void> {
  await updateExamSubject(examSubjectId, { examDate });
  revalidatePath(`/academic-coordinator/exams/${examId}`);
}
