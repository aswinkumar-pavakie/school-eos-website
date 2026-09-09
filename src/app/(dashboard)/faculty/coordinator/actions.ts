"use server";

import { revalidatePath } from "next/cache";
import {
  advanceExamState,
  assignClassAdvisor,
  assignOfferingTeacher,
  createCoordinatorCalendarEvent,
  createCoordinatorExam,
  createExamSubject,
  deleteCoordinatorCalendarEvent,
  deleteTimetableSlot,
  publishTimetable,
  revokeClassAdvisor,
  updateCoordinatorCalendarEvent,
  updateExamSubject,
  upsertTimetableSlot,
} from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

// ---------- Structure / advisor ----------

export async function assignAdvisorAction(sectionId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await assignClassAdvisor(sectionId, String(formData.get("personId") ?? ""));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign advisor." };
  }
  revalidatePath("/faculty/coordinator/structure");
  revalidatePath("/faculty/coordinator");
  return {};
}

export async function revokeAdvisorAction(sectionId: string): Promise<void> {
  await revokeClassAdvisor(sectionId);
  revalidatePath("/faculty/coordinator/structure");
  revalidatePath("/faculty/coordinator");
}

// ---------- Faculty assignment ----------

export async function assignTeacherAction(offeringId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const teacherStaffId = String(formData.get("teacherStaffId") ?? "") || null;
  try {
    await assignOfferingTeacher(offeringId, teacherStaffId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign teacher." };
  }
  revalidatePath("/faculty/coordinator/offerings");
  revalidatePath("/faculty/coordinator");
  return {};
}

// ---------- Timetable ----------

export async function upsertSlotAction(
  sectionId: string,
  dayOfWeek: number,
  periodId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await upsertTimetableSlot({
      sectionId,
      dayOfWeek,
      periodId,
      subjectOfferingId: String(formData.get("subjectOfferingId") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this slot." };
  }
  revalidatePath("/faculty/coordinator/timetable");
  return {};
}

export async function deleteSlotAction(slotId: string): Promise<void> {
  await deleteTimetableSlot(slotId);
  revalidatePath("/faculty/coordinator/timetable");
}

export async function publishTimetableAction(sectionId: string): Promise<void> {
  await publishTimetable(sectionId);
  revalidatePath("/faculty/coordinator/timetable");
}

// ---------- Exams ----------

export async function createExamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const gradeIds = formData.getAll("gradeIds").map(String).filter(Boolean);
  if (gradeIds.length === 0) return { error: "Pick at least one grade." };
  try {
    await createCoordinatorExam({
      name: String(formData.get("name") ?? ""),
      examType: String(formData.get("examType") ?? ""),
      term: String(formData.get("term") ?? "") || undefined,
      gradeIds,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create exam." };
  }
  revalidatePath("/faculty/coordinator/exams");
  return {};
}

export async function advanceExamAction(examId: string): Promise<void> {
  await advanceExamState(examId);
  revalidatePath(`/faculty/coordinator/exams/${examId}`);
}

export async function createExamSubjectAction(examId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const maxMarksRaw = String(formData.get("maxMarks") ?? "").trim();
  const passMarksRaw = String(formData.get("passMarks") ?? "").trim();
  try {
    await createExamSubject(examId, {
      subjectOfferingId: String(formData.get("subjectOfferingId") ?? ""),
      maxMarks: Number(maxMarksRaw || "100"),
      passMarks: passMarksRaw ? Number(passMarksRaw) : undefined,
      examDate: String(formData.get("examDate") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this class." };
  }
  revalidatePath(`/faculty/coordinator/exams/${examId}`);
  return {};
}

export async function updateExamSubjectAction(examSubjectId: string, examId: string, input: {
  examDate?: string; startTime?: string; durationMinutes?: number; room?: string; maxMarks?: number; passMarks?: number;
}): Promise<void> {
  await updateExamSubject(examSubjectId, input);
  revalidatePath(`/faculty/coordinator/exams/${examId}`);
}

// ---------- Calendar ----------

export async function createCalendarEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createCoordinatorCalendarEvent({
      scopeStage: String(formData.get("scopeStage") ?? ""),
      title: String(formData.get("title") ?? ""),
      eventType: String(formData.get("eventType") ?? "OTHER"),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? formData.get("startDate") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create event." };
  }
  revalidatePath("/faculty/coordinator/calendar");
  return {};
}

export async function updateCalendarEventAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateCoordinatorCalendarEvent(id, {
      title: String(formData.get("title") ?? ""),
      eventType: String(formData.get("eventType") ?? "OTHER"),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? formData.get("startDate") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/coordinator/calendar");
  return {};
}

export async function deleteCalendarEventAction(id: string): Promise<void> {
  await deleteCoordinatorCalendarEvent(id);
  revalidatePath("/faculty/coordinator/calendar");
}
