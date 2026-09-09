// Current Term (LMS) -- real backend calls only (faculty/lms controller).
// Sensitive, class-scoped content: every write is re-validated server-side
// regardless of what this client sends. Same server-only apiFetch convention
// as faculty-api.ts.

import { apiFetch } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}
async function get<T>(path: string): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path));
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function patch<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function del(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
}

export interface LmsSubjectFolder {
  subjectId: string;
  subjectName: string;
  classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[];
}
export async function listLmsSubjects(): Promise<LmsSubjectFolder[]> {
  return (await get<ApiEnvelope<LmsSubjectFolder[]>>("/faculty/lms/subjects")).data;
}

export interface LmsFile {
  id: string;
  folderId: string;
  fileName: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: string;
  uploadedBy: string;
  uploadedAt: string;
}
export interface LmsFolder {
  id: string;
  staffId: string;
  subjectId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  shareOfferingIds: string[];
  files: LmsFile[];
}
export async function listLmsFolders(subjectId: string): Promise<LmsFolder[]> {
  return (await get<ApiEnvelope<LmsFolder[]>>(`/faculty/lms/subjects/${subjectId}/folders`)).data;
}
export async function getLmsFolder(folderId: string): Promise<LmsFolder> {
  return (await get<ApiEnvelope<LmsFolder>>(`/faculty/lms/folders/${folderId}`)).data;
}
export async function createLmsFolder(input: { subjectId: string; title: string; description?: string; shareOfferingIds?: string[] }): Promise<LmsFolder> {
  return (await post<ApiEnvelope<LmsFolder>>("/faculty/lms/folders", input)).data;
}
export async function updateLmsFolder(folderId: string, input: Partial<{ title: string; description: string; shareOfferingIds: string[] }>): Promise<LmsFolder> {
  return (await patch<ApiEnvelope<LmsFolder>>(`/faculty/lms/folders/${folderId}`, input)).data;
}
export async function deleteLmsFolder(folderId: string): Promise<void> {
  await del(`/faculty/lms/folders/${folderId}`);
}

/** Multipart upload — a real <input type="file"> in a Server Action's
 * FormData arrives here as a File; forwarded to the backend as-is inside a
 * fresh FormData (this app's own convention: the browser never talks to the
 * backend directly, so the Server Action is the only place this can happen). */
export async function uploadLmsFile(folderId: string, file: File): Promise<LmsFile[]> {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await apiFetch(`/faculty/lms/folders/${folderId}/files`, { method: "POST", body: form });
  return (await parseOrThrow<ApiEnvelope<LmsFile[]>>(res)).data;
}
export async function getLmsFileUrl(fileId: string): Promise<string> {
  return (await get<ApiEnvelope<{ url: string }>>(`/faculty/lms/files/${fileId}/url`)).data.url;
}
export async function deleteLmsFile(fileId: string): Promise<void> {
  await del(`/faculty/lms/files/${fileId}`);
}

export interface LmsTask {
  id: string;
  subjectOfferingId: string;
  createdBy: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}
export async function listLmsTasks(subjectOfferingId: string): Promise<LmsTask[]> {
  return (await get<ApiEnvelope<LmsTask[]>>(`/faculty/lms/tasks?subjectOfferingId=${subjectOfferingId}`)).data;
}
export async function createLmsTask(input: { subjectOfferingId: string; title: string; description?: string; dueDate?: string }): Promise<LmsTask> {
  return (await post<ApiEnvelope<LmsTask>>("/faculty/lms/tasks", input)).data;
}
export async function updateLmsTask(id: string, input: Partial<{ title: string; description: string; dueDate: string; status: "OPEN" | "CLOSED" }>): Promise<LmsTask> {
  return (await patch<ApiEnvelope<LmsTask>>(`/faculty/lms/tasks/${id}`, input)).data;
}
export async function deleteLmsTask(id: string): Promise<void> {
  await del(`/faculty/lms/tasks/${id}`);
}

export interface LmsLessonPlan {
  id: string;
  subjectOfferingId: string;
  createdBy: string;
  title: string;
  content: string;
  weekStart: string | null;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  createdAt: string;
  updatedAt: string;
}
export async function listLmsLessonPlans(subjectOfferingId: string): Promise<LmsLessonPlan[]> {
  return (await get<ApiEnvelope<LmsLessonPlan[]>>(`/faculty/lms/lesson-plans?subjectOfferingId=${subjectOfferingId}`)).data;
}
export async function createLmsLessonPlan(input: { subjectOfferingId: string; title: string; content: string; weekStart?: string }): Promise<LmsLessonPlan> {
  return (await post<ApiEnvelope<LmsLessonPlan>>("/faculty/lms/lesson-plans", input)).data;
}
export async function updateLmsLessonPlan(id: string, input: Partial<{ title: string; content: string; weekStart: string }>): Promise<LmsLessonPlan> {
  return (await patch<ApiEnvelope<LmsLessonPlan>>(`/faculty/lms/lesson-plans/${id}`, input)).data;
}
export async function deleteLmsLessonPlan(id: string): Promise<void> {
  await del(`/faculty/lms/lesson-plans/${id}`);
}
