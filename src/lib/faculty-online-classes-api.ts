// Faculty "Online class" -- targets online-classes.controller.ts, real and
// @Roles('FACULTY')-permitted, confirmed live Google Calendar/Meet
// integration. No custom video-call UI is built here -- Start/Resume opens
// the real meetingUrl (a genuine Google Meet link) in a new tab, which is
// the CORRECT behavior for this integration (not a gap to work around).

import { randomUUID } from "crypto";
import { apiFetch } from "./api";

export interface ApiEnvelope<T> {
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
async function post<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...extraHeaders }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function patch<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}

export type OnlineClassView = "upcoming" | "completed" | "cancelled";
export type OnlineClassStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface OnlineClassDetail {
  id: string;
  subjectOfferingId: string;
  subjectName: string;
  gradeName: string;
  sectionName: string;
  topic: string;
  description: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: OnlineClassStatus;
  meetingUrl: string | null;
  recordingUrl: string | null;
}

export interface SubjectOffering {
  id: string;
  subjectName: string;
  sectionName: string;
  gradeName: string;
}

export async function listOnlineClasses(view: OnlineClassView): Promise<OnlineClassDetail[]> {
  return (await get<ApiEnvelope<OnlineClassDetail[]>>(`/online-classes?view=${view}`)).data;
}
export async function getOnlineClass(id: string): Promise<OnlineClassDetail> {
  return (await get<ApiEnvelope<OnlineClassDetail>>(`/online-classes/${id}`)).data;
}
export async function myOnlineClassOfferings(): Promise<SubjectOffering[]> {
  return (await get<ApiEnvelope<SubjectOffering[]>>("/online-classes/my-subject-offerings")).data;
}
export async function scheduleOnlineClass(input: {
  subjectOfferingId: string;
  topic: string;
  description?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}): Promise<OnlineClassDetail> {
  const idempotencyKey = randomUUID();
  return (await post<ApiEnvelope<OnlineClassDetail>>("/online-classes", input, { "Idempotency-Key": idempotencyKey })).data;
}
export async function startOnlineClass(id: string): Promise<OnlineClassDetail> {
  return (await patch<ApiEnvelope<OnlineClassDetail>>(`/online-classes/${id}/start`)).data;
}
export async function cancelOnlineClass(id: string, reason: string): Promise<OnlineClassDetail> {
  return (await patch<ApiEnvelope<OnlineClassDetail>>(`/online-classes/${id}/cancel`, { reason })).data;
}
