// Exam subjects and student-wise marks for the Class Teacher's Exams screen
// (the same backend the mobile Exams screens use: faculty/exams/subjects).
// The backend unions both scopes per caller -- a Faculty's own teaching
// offerings and a class advisor's whole section -- so a Class Teacher login
// sees every subject of its class. Server-only apiFetch convention, same as
// faculty-api.ts.

import { apiFetch } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export interface ExamSubjectRow {
  examId: string;
  examName: string;
  examType: string;
  term: string | null;
  subjectOfferingId: string;
  subjectName: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  examDate: string | null;
  startTime: string | null;
}

export async function listExamSubjects(): Promise<ExamSubjectRow[]> {
  return (await get<ApiEnvelope<ExamSubjectRow[]>>("/faculty/exams/subjects")).data;
}

export interface ExamSubjectStudentMark {
  studentId: string;
  studentName: string;
  rollNo: number | null;
  marksObtained: number | null;
  maxMarks: number | null;
  isAbsent: boolean;
}

export async function getMarksForExamSubject(
  subjectOfferingId: string,
  examId: string,
): Promise<{ students: ExamSubjectStudentMark[] }> {
  return (
    await get<ApiEnvelope<{ students: ExamSubjectStudentMark[] }>>(
      `/faculty/exams/subjects/${encodeURIComponent(subjectOfferingId)}/exam/${encodeURIComponent(examId)}/marks`,
    )
  ).data;
}
