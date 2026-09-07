"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function createExamAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    name: formData.get("name"),
    examType: formData.get("examType"),
    academicYearId: formData.get("academicYearId"),
  };
  const term = formData.get("term");
  if (typeof term === "string" && term.trim() !== "") payload.term = term;
  const gradeScaleId = formData.get("gradeScaleId");
  if (typeof gradeScaleId === "string" && gradeScaleId !== "") payload.gradeScaleId = gradeScaleId;

  const res = await apiFetch("/examinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/examinations");
  return {};
}

export async function updateExamAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const id = formData.get("id");
  const payload: Record<string, unknown> = {
    name: formData.get("name"),
    examType: formData.get("examType"),
  };
  const term = formData.get("term");
  if (typeof term === "string") payload.term = term;
  const gradeScaleId = formData.get("gradeScaleId");
  if (typeof gradeScaleId === "string" && gradeScaleId !== "") payload.gradeScaleId = gradeScaleId;

  const res = await apiFetch(`/examinations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/examinations");
  revalidatePath(`/admin/examinations/${id}`);
  return {};
}

export async function publishExamAction(id: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/examinations/${id}/publish`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/examinations");
  revalidatePath(`/admin/examinations/${id}`);
  revalidatePath("/admin/examination-timetable");
  return {};
}

export async function lockExamAction(id: string): Promise<{ error?: string }> {
  const res = await apiFetch(`/examinations/${id}/lock`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/examinations");
  revalidatePath(`/admin/examinations/${id}`);
  revalidatePath("/admin/examination-timetable");
  return {};
}

export async function createExamScheduleAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const examId = formData.get("examId");
  const payload: Record<string, unknown> = {
    subjectOfferingId: formData.get("subjectOfferingId"),
    maxMarks: Number(formData.get("maxMarks")),
  };
  const examDate = formData.get("examDate");
  if (typeof examDate === "string" && examDate !== "") payload.examDate = examDate;
  const startTime = formData.get("startTime");
  if (typeof startTime === "string" && startTime !== "") payload.startTime = startTime;
  const durationMinutes = formData.get("durationMinutes");
  if (typeof durationMinutes === "string" && durationMinutes !== "") payload.durationMinutes = Number(durationMinutes);
  const room = formData.get("room");
  if (typeof room === "string" && room.trim() !== "") payload.room = room;
  const passMarks = formData.get("passMarks");
  if (typeof passMarks === "string" && passMarks !== "") payload.passMarks = Number(passMarks);
  const hasPractical = formData.get("hasPractical") === "on";
  payload.hasPractical = hasPractical;
  const practicalMax = formData.get("practicalMax");
  if (typeof practicalMax === "string" && practicalMax !== "") payload.practicalMax = Number(practicalMax);
  const internalMax = formData.get("internalMax");
  if (typeof internalMax === "string" && internalMax !== "") payload.internalMax = Number(internalMax);

  const res = await apiFetch(`/examinations/${examId}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/examinations/${examId}`);
  revalidatePath("/admin/examination-timetable");
  return {};
}

export async function updateExamScheduleAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const id = formData.get("id");
  const examId = formData.get("examId");
  const payload: Record<string, unknown> = {};
  const examDate = formData.get("examDate");
  if (typeof examDate === "string" && examDate !== "") payload.examDate = examDate;
  const startTime = formData.get("startTime");
  if (typeof startTime === "string" && startTime !== "") payload.startTime = startTime;
  const durationMinutes = formData.get("durationMinutes");
  if (typeof durationMinutes === "string" && durationMinutes !== "") payload.durationMinutes = Number(durationMinutes);
  const room = formData.get("room");
  if (typeof room === "string") payload.room = room;
  const maxMarks = formData.get("maxMarks");
  if (typeof maxMarks === "string" && maxMarks !== "") payload.maxMarks = Number(maxMarks);
  const passMarks = formData.get("passMarks");
  if (typeof passMarks === "string" && passMarks !== "") payload.passMarks = Number(passMarks);
  payload.hasPractical = formData.get("hasPractical") === "on";
  const practicalMax = formData.get("practicalMax");
  if (typeof practicalMax === "string" && practicalMax !== "") payload.practicalMax = Number(practicalMax);
  const internalMax = formData.get("internalMax");
  if (typeof internalMax === "string" && internalMax !== "") payload.internalMax = Number(internalMax);

  const res = await apiFetch(`/examination-schedules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/examinations/${examId}`);
  revalidatePath("/admin/examination-timetable");
  return {};
}
