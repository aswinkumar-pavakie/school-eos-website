// Faculty "Online class" -- targets online-classes.controller.ts, real and
// @Roles('FACULTY')-permitted. Start/Resume/End now go through the in-app
// LiveKit call (call-token/end-call/participants-mute) instead of an
// external Google Meet hand-off -- see online-class-call/[id] for the
// actual video UI. The old Google Calendar/Meet integration is still live
// in the backend for any historical row that has a meetingUrl, but nothing
// here calls Google for a class scheduled from this point on.

import { randomUUID } from "crypto";
import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

export interface ApiEnvelope<T> {
  data: T;
}
async function parseOrThrow<T>(res: Response): Promise<T> {
  return parseApiResponse<T>(res);
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
export async function cancelOnlineClass(id: string, reason: string): Promise<OnlineClassDetail> {
  return (await patch<ApiEnvelope<OnlineClassDetail>>(`/online-classes/${id}/cancel`, { reason })).data;
}

export interface OnlineClassCallCredentials {
  url: string;
  token: string;
  roomName: string;
}

/** "Start"/"Resume" -- mints a moderator LiveKit token, transitioning
 * SCHEDULED -> LIVE on first call. */
export async function requestFacultyOnlineClassToken(id: string): Promise<OnlineClassCallCredentials> {
  return (await post<ApiEnvelope<OnlineClassCallCredentials>>(`/online-classes/${id}/call-token`)).data;
}

/** "End" -- ends the call for everyone and transitions LIVE -> COMPLETED. */
export async function endOnlineClassCall(id: string): Promise<OnlineClassDetail> {
  return (await post<ApiEnvelope<OnlineClassDetail>>(`/online-classes/${id}/end-call`)).data;
}

/** Faculty roster moderation from inside the call -- identity is exactly what
 * LiveKit reports for that participant. */
export async function muteOnlineClassParticipant(id: string, identity: string, muted: boolean): Promise<void> {
  await post(`/online-classes/${id}/participants/mute`, { identity, muted });
}
