// Media Room module -- real backend calls only (school-eos-backend's
// src/modules/media), mirroring the exact same apiFetch/ApiEnvelope pattern
// Finance's own src/lib/finance-api.ts uses. No mock/placeholder data anywhere in
// this file.

import { apiFetch, AuthExpiredError } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new AuthExpiredError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---------- Media Team ----------

export type MediaTeamMemberStatus = "ACTIVE" | "INACTIVE";

export interface MediaTeamMember {
  id: string;
  personId: string | null;
  fullName: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  status: MediaTeamMemberStatus;
  activeJobs: number;
  createdAt: string;
  updatedAt: string;
}

export async function listMediaTeam(): Promise<MediaTeamMember[]> {
  const res = await apiFetch("/media/team");
  return (await parseOrThrow<ApiEnvelope<MediaTeamMember[]>>(res)).data;
}

export async function createMediaTeamMember(input: {
  fullName: string;
  designation?: string;
  email?: string;
  phone?: string;
  skills?: string[];
}): Promise<MediaTeamMember> {
  const res = await apiFetch("/media/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaTeamMember>>(res)).data;
}

export interface MediaTeamMemberDetail extends MediaTeamMember {
  equipment: string[];
  activity: { id: string; date: string; text: string }[];
  active: number;
  completed: number;
}
export async function getMediaTeamMember(id: string): Promise<MediaTeamMemberDetail> {
  const res = await apiFetch(`/media/team/${id}`);
  return (await parseOrThrow<ApiEnvelope<MediaTeamMemberDetail>>(res)).data;
}

export async function updateMediaTeamMember(
  id: string,
  input: { fullName?: string; designation?: string; email?: string; phone?: string; skills?: string[]; status?: MediaTeamMemberStatus },
): Promise<MediaTeamMember> {
  const res = await apiFetch(`/media/team/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaTeamMember>>(res)).data;
}

// ---------- Shoot Assignments ----------

export type ShootOutputType = "PHOTO" | "VIDEO" | "PHOTO_VIDEO";
export type ShootStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ShootAssignment {
  id: string;
  eventTitle: string;
  venue: string | null;
  scheduledAt: string;
  outputType: ShootOutputType;
  status: ShootStatus;
  notes: string | null;
  crew: { id: string; fullName: string; designation: string | null }[];
  gear: { id: string; name: string; assetCode: string | null }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function listShootAssignments(filter: { status?: string; from?: string; to?: string } = {}): Promise<ShootAssignment[]> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/media/shoot-assignments?${qs.toString()}`);
  return (await parseOrThrow<ApiEnvelope<ShootAssignment[]>>(res)).data;
}

export async function createShootAssignment(input: {
  eventTitle: string;
  venue?: string;
  scheduledAt: string;
  outputType: ShootOutputType;
  notes?: string;
  crewIds?: string[];
  gearIds?: string[];
}): Promise<ShootAssignment> {
  const res = await apiFetch("/media/shoot-assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<ShootAssignment>>(res)).data;
}

export async function updateShootAssignment(
  id: string,
  input: Partial<{
    eventTitle: string;
    venue: string;
    scheduledAt: string;
    outputType: ShootOutputType;
    status: ShootStatus;
    notes: string;
    crewIds: string[];
    gearIds: string[];
  }>,
): Promise<ShootAssignment> {
  const res = await apiFetch(`/media/shoot-assignments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<ShootAssignment>>(res)).data;
}

// Only the assignment's own creator may delete it (shoot-assignments.controller.ts's
// own ownership check enforces this server-side too).
export async function deleteShootAssignment(id: string): Promise<void> {
  const res = await apiFetch(`/media/shoot-assignments/${id}`, { method: "DELETE" });
  await parseOrThrow<ApiEnvelope<{ deleted: true }>>(res);
}

// ---------- Social Media Publishing ----------

export type MediaPostFormat = "POST" | "PHOTO_CAROUSEL" | "VIDEO" | "ANNOUNCEMENT_CARD";
export type MediaPostCategory = "EVENT" | "ACADEMIC" | "DEPARTMENT" | "GENERAL";
export type MediaPostState = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";

export interface MediaPostAsset {
  id: string;
  objectKey: string;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  sortOrder: number;
}

export interface MediaPost {
  id: string;
  format: MediaPostFormat;
  category: MediaPostCategory;
  caption: string;
  firstComment: string | null;
  linkUrl: string | null;
  pinToTop: boolean;
  allowComments: boolean;
  state: MediaPostState;
  publishAt: string | null;
  publishedAt: string | null;
  assets: MediaPostAsset[];
  commentCount: number;
  unansweredCommentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPostComment {
  id: string;
  mediaPostId: string;
  commenterPersonId: string | null;
  commenterLabel: string | null;
  body: string;
  staffReply: string | null;
  staffRepliedBy: string | null;
  staffRepliedAt: string | null;
  createdAt: string;
}

export async function listMediaPosts(filter: { state?: string } = {}): Promise<MediaPost[]> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/media/posts?${qs.toString()}`);
  return (await parseOrThrow<ApiEnvelope<MediaPost[]>>(res)).data;
}

export async function getMediaPost(id: string): Promise<MediaPost> {
  const res = await apiFetch(`/media/posts/${id}`);
  return (await parseOrThrow<ApiEnvelope<MediaPost>>(res)).data;
}

export async function listMediaPostComments(id: string): Promise<MediaPostComment[]> {
  const res = await apiFetch(`/media/posts/${id}/comments`);
  return (await parseOrThrow<ApiEnvelope<MediaPostComment[]>>(res)).data;
}

/** multipart/form-data -- formData must already contain every text field plus one
 * or more "files" entries (real image/video File objects), built by the caller
 * (a Server Action receiving a real <form> submission). */
export async function createMediaPost(formData: FormData): Promise<MediaPost> {
  const res = await apiFetch("/media/posts", { method: "POST", body: formData });
  return (await parseOrThrow<ApiEnvelope<MediaPost>>(res)).data;
}

export async function updateMediaPost(
  id: string,
  input: { caption?: string; firstComment?: string; linkUrl?: string; pinToTop?: boolean; allowComments?: boolean },
): Promise<MediaPost> {
  const res = await apiFetch(`/media/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaPost>>(res)).data;
}

export async function cancelMediaPost(id: string): Promise<void> {
  const res = await apiFetch(`/media/posts/${id}/cancel`, { method: "POST" });
  await parseOrThrow(res);
}

export async function deleteMediaPost(id: string): Promise<void> {
  const res = await apiFetch(`/media/posts/${id}`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function replyToMediaPostComment(commentId: string, reply: string): Promise<MediaPostComment> {
  const res = await apiFetch(`/media/posts/comments/${commentId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reply }),
  });
  return (await parseOrThrow<ApiEnvelope<MediaPostComment>>(res)).data;
}

export async function deleteMediaPostComment(commentId: string): Promise<void> {
  const res = await apiFetch(`/media/posts/comments/${commentId}`, { method: "DELETE" });
  await parseOrThrow(res);
}

// ---------- Media Inventory (scoped to Media & AV Equipment) ----------

export type InventoryItemStatus = "AVAILABLE" | "ASSIGNED" | "DAMAGED" | "LOST" | "RETIRED";

export interface MediaInventoryItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  assetCode: string | null;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  status: InventoryItemStatus;
  assignedToPersonId: string | null;
  assignedToName: string | null;
  assignedOn: string | null;
  description: string | null;
  acquisitionDate: string | null;
  acquisitionCostPaise: number | null;
  vendor: string | null;
}

export interface MediaInventoryHistoryEntry {
  id: string;
  date: string;
  action: string;
  actorName: string | null;
}

export async function listMediaInventory(filter: { search?: string; status?: string } = {}): Promise<{ data: MediaInventoryItem[]; meta: { total: number } }> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/media/inventory?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getMediaInventoryOverview(): Promise<{ total: number; available: number; assigned: number; underRepair: number; bookValuePaise: number }> {
  const res = await apiFetch("/media/inventory/overview");
  return (await parseOrThrow<ApiEnvelope<any>>(res)).data;
}

export async function createMediaInventoryItem(input: {
  name: string;
  assetCode?: string;
  quantity?: number;
  lowStockThreshold?: number;
  location?: string;
  description?: string;
  acquisitionDate?: string;
  acquisitionCostPaise?: number;
  vendor?: string;
}): Promise<MediaInventoryItem> {
  const res = await apiFetch("/media/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function updateMediaInventoryItem(id: string, input: Partial<{ name: string; assetCode: string; location: string; description: string; vendor: string }>): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function getMediaInventoryItem(id: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}`);
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function getMediaInventoryItemHistory(id: string): Promise<MediaInventoryHistoryEntry[]> {
  const res = await apiFetch(`/media/inventory/${id}/history`);
  return (await parseOrThrow<ApiEnvelope<MediaInventoryHistoryEntry[]>>(res)).data;
}

export async function issueMediaInventoryItem(id: string, input: { assignedToPersonId: string }): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/issue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function returnMediaInventoryItem(id: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/return`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function markMediaInventoryItemDamaged(id: string, notes?: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/mark-damaged`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

// The other side of markMediaInventoryItemDamaged -- repair/service finished,
// item goes back into the available pool. Without this, DAMAGED was a real
// dead end: once sent to service, status could never be changed again.
export async function markMediaInventoryItemAvailable(id: string, notes?: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/mark-available`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function markMediaInventoryItemLost(id: string, notes?: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/mark-lost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

export async function retireMediaInventoryItem(id: string, notes?: string): Promise<MediaInventoryItem> {
  const res = await apiFetch(`/media/inventory/${id}/retire`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
  return (await parseOrThrow<ApiEnvelope<MediaInventoryItem>>(res)).data;
}

// ---------- Raise Indent ----------

export type IndentState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface MediaIndent {
  id: string;
  referenceNo: string;
  requestType: "GOODS" | "SERVICE";
  itemName: string;
  description: string | null;
  quantity: number | null;
  vendorName: string | null;
  estimatedAmountPaise: string | null;
  neededBy: string | null;
  approvalRequestId: string | null;
  state: IndentState;
  createdAt: string;
  updatedAt: string;
}

export async function listMediaIndents(): Promise<MediaIndent[]> {
  const res = await apiFetch("/media/indents?pageSize=200");
  return (await parseOrThrow<ApiEnvelope<MediaIndent[]>>(res)).data;
}

export async function createMediaIndent(input: {
  requestType: "GOODS" | "SERVICE";
  itemName: string;
  description?: string;
  quantity?: number;
  vendorName?: string;
  estimatedAmountPaise?: string;
  neededBy?: string;
}): Promise<MediaIndent> {
  const res = await apiFetch("/media/indents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaIndent>>(res)).data;
}

// Cancelling an indent still awaiting a decision: the same generic
// "requester withdraws their own still-open request" capability every other
// approval-routed feature in this app already uses (approvals.service.ts's
// own withdraw()) -- not a media-specific endpoint, since the underlying
// purchase_request state change already flows through the existing
// finance-approval-handlers.service.ts onWithdrawn hook. Only the request's
// own creator can call this, and only while it's still PENDING -- enforced
// server-side, not just hidden here.
export async function withdrawMediaIndent(approvalRequestId: string): Promise<void> {
  const res = await apiFetch(`/approvals/${approvalRequestId}/withdraw`, { method: "POST" });
  await parseOrThrow<ApiEnvelope<unknown>>(res);
}

// ---------- Academic Calendar (real calendar_event table, extended to
// MEDIA_ROOM read + create for this rebuild -- see calendar-events.controller.ts's
// own comment. Media-created events are always scope_type SCHOOL: the schema
// has no per-department scope, so they're genuinely visible school-wide,
// same as an Admin-added one.) ----------

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
export async function listAcademicYears(): Promise<AcademicYear[]> {
  const res = await apiFetch("/academic-years");
  return (await parseOrThrow<ApiEnvelope<AcademicYear[]>>(res)).data;
}

export type CalendarEventType = "HOLIDAY" | "TERM_START" | "TERM_END" | "EXAM_WINDOW" | "PTM" | "FUNCTION" | "COMPETITION" | "WORKING_SATURDAY" | "OTHER";

export interface CalendarEvent {
  id: string;
  academicYearId: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  scopeType: string;
  scopeId: string | null;
  scopeStage: string | null;
  createdBy: string | null;
}
export async function listCalendarEvents(academicYearId: string): Promise<CalendarEvent[]> {
  const res = await apiFetch(`/calendar-events?academicYearId=${academicYearId}`);
  return (await parseOrThrow<ApiEnvelope<CalendarEvent[]>>(res)).data;
}
export async function createCalendarEvent(input: {
  academicYearId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventType: CalendarEventType;
}): Promise<CalendarEvent> {
  const res = await apiFetch("/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, scopeType: "SCHOOL" }),
  });
  return (await parseOrThrow<ApiEnvelope<CalendarEvent>>(res)).data;
}

// Media Room may only edit/delete calendar events it created itself -- see
// calendar-events.controller.ts's own assertCanModify(), which enforces this
// server-side too, not just here.
export async function updateCalendarEvent(id: string, input: Partial<{ title: string; description: string; startDate: string; endDate: string; eventType: CalendarEventType }>): Promise<CalendarEvent> {
  const res = await apiFetch(`/calendar-events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<CalendarEvent>>(res)).data;
}
export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await apiFetch(`/calendar-events/${id}`, { method: "DELETE" });
  await parseOrThrow<ApiEnvelope<{ deleted: true }>>(res);
}

// ---------- Dashboard ----------

export interface MediaDashboardSummary {
  shootsToday: number;
  scheduledPosts: number;
  livePosts: number;
  draftPosts: number;
  pendingIndents: number;
  todaysShoots: ShootAssignment[];
  lowStockItems: { id: string; name: string; quantity: number; lowStockThreshold: number }[];
}

export async function getMediaDashboard(): Promise<MediaDashboardSummary> {
  const res = await apiFetch("/media/dashboard");
  return (await parseOrThrow<ApiEnvelope<MediaDashboardSummary>>(res)).data;
}

// ---------- Report (real, user-curated scorecard -- media_report_metric) ----------

export interface MediaReportMetric {
  id: string;
  academicYearId: string;
  name: string;
  nowValue: string;
  targetValue: string | null;
  attainmentPct: string | null;
  createdBy: string;
}
export async function listMediaReportMetrics(academicYearId: string): Promise<MediaReportMetric[]> {
  const res = await apiFetch(`/media/report-metrics?academicYearId=${academicYearId}`);
  return (await parseOrThrow<ApiEnvelope<MediaReportMetric[]>>(res)).data;
}
export async function createMediaReportMetric(input: { academicYearId: string; name: string; nowValue: string; targetValue?: string; attainmentPct?: string }): Promise<MediaReportMetric> {
  const res = await apiFetch("/media/report-metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaReportMetric>>(res)).data;
}
// Only the metric's own creator may edit/delete it (media-report.controller.ts's
// own assertOwnedByActor enforces this server-side too).
export async function updateMediaReportMetric(id: string, input: Partial<{ name: string; nowValue: string; targetValue: string; attainmentPct: string }>): Promise<MediaReportMetric> {
  const res = await apiFetch(`/media/report-metrics/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MediaReportMetric>>(res)).data;
}
export async function deleteMediaReportMetric(id: string): Promise<void> {
  const res = await apiFetch(`/media/report-metrics/${id}`, { method: "DELETE" });
  await parseOrThrow<ApiEnvelope<{ deleted: true }>>(res);
}
