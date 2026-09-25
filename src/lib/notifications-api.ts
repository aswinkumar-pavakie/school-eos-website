// Server-side-only Notifications API client -- the first web consumer of a
// real backend module (notifications.controller.ts) that already exists and
// already has real data (the `notification` table is written by
// OutboxService across approvals/attendance-alerts/hostel-call-requests --
// this session confirmed 230 real rows). No @Roles() on the backend route --
// notifications are inherently personal (person_id), scoped server-side to
// the authenticated actor's own personId, never role-gated or
// client-suppliable. Mirrors reports-api.ts's own shape.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; limit: number; total: number; unreadCount: number };
}

async function parseOrThrow<T>(res: Response): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  return parseApiResponse<ApiEnvelope<T>>(res);
}

export interface NotificationRow {
  id: string;
  personId: string;
  aboutStudentId: string | null;
  notificationType: string;
  title: string;
  body: string;
  relatedObjectType: string | null;
  relatedObjectId: string | null;
  deepLink: string | null;
  isEmergency: boolean;
  createdAt: string;
  readAt: string | null;
}

export async function listNotifications(filter: { unreadOnly?: boolean; limit?: number; page?: number } = {}): Promise<{
  data: NotificationRow[];
  unreadCount: number;
  total: number;
}> {
  const qs = new URLSearchParams();
  if (filter.unreadOnly) qs.set("unreadOnly", "true");
  if (filter.limit) qs.set("limit", String(filter.limit));
  if (filter.page) qs.set("page", String(filter.page));
  const res = await apiFetch(`/notifications?${qs.toString()}`);
  const body = await parseOrThrow<NotificationRow[]>(res);
  return { data: body.data, unreadCount: body.meta?.unreadCount ?? 0, total: body.meta?.total ?? body.data.length };
}

export async function markNotificationRead(id: string): Promise<NotificationRow> {
  const res = await apiFetch(`/notifications/${id}/read`, { method: "POST" });
  const body = await parseOrThrow<NotificationRow>(res);
  return body.data;
}
