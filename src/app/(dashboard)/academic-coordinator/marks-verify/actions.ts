"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendBackMarksSubmission, verifyMarksSubmission } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function verifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sectionId = formData.get("sectionId");
  const examId = formData.get("examId");
  if (typeof sectionId !== "string" || typeof examId !== "string") return { error: "Missing section/exam." };
  try {
    await verifyMarksSubmission(sectionId, examId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not verify this submission." };
  }
  revalidatePath("/academic-coordinator/marks-verify");
  revalidatePath(`/academic-coordinator/marks-verify/${sectionId}/${examId}`);
  redirect("/academic-coordinator/marks-verify");
}

export async function sendBackAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sectionId = formData.get("sectionId");
  const examId = formData.get("examId");
  const comment = formData.get("comment");
  if (typeof sectionId !== "string" || typeof examId !== "string") return { error: "Missing section/exam." };
  if (typeof comment !== "string" || comment.trim().length < 3) return { error: "Add a short comment explaining what needs to change." };
  try {
    await sendBackMarksSubmission(sectionId, examId, comment.trim());
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send this submission back." };
  }
  revalidatePath("/academic-coordinator/marks-verify");
  revalidatePath(`/academic-coordinator/marks-verify/${sectionId}/${examId}`);
  redirect("/academic-coordinator/marks-verify");
}
