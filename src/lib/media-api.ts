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
  description: string | null;
  acquisitionDate: string | null;
  acquisitionCostPaise: number | null;
  vendor: string | null;
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
