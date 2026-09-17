"use server";

// Server Actions bridging the browser to the separate School EOS Messaging
// microservice (the real, already-built E2EE backend -- school-eos-messaging,
// a different service/base URL from the main Core API). Mirrors the mobile
// app's own src/lib/messaging-api.ts shape and error handling exactly (that
// backend's HttpExceptions carry a plain `{ code: '...' }` body, not Core's
// `{ message: '...' }`).
//
// Why these are Server Actions rather than a direct client-side fetch: this
// site's auth token lives in an httpOnly cookie (see src/lib/api.ts) so
// client-side JS can never read it directly -- these actions read it
// server-side (reusing getValidAccessToken(), the exact same refresh-aware
// helper the main API client already uses) and attach it as a Bearer token
// when calling the messaging service. The actual MLS cryptography (key
// generation, encrypt/decrypt, group state) still runs entirely in the
// browser -- private key material and plaintext are never sent here; only
// already-public KeyPackage material, already-encrypted ciphertext, and
// plain conversation/request metadata pass through this bridge.

import { getValidAccessToken } from "./api";
import { MessagingApiError } from "./messaging-errors";

const RAW_MESSAGING_BASE_URL = process.env.MESSAGING_API_BASE_URL ?? "http://localhost:3001";
const MESSAGING_API_BASE_URL = `${RAW_MESSAGING_BASE_URL.replace(/\/$/, "")}/v1/messaging`;

async function messagingRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const accessToken = await getValidAccessToken();
  let res: Response;
  try {
    res = await fetch(`${MESSAGING_API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new MessagingApiError(0, undefined, "Unable to reach the messaging server. Check your connection.");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new MessagingApiError(res.status, json?.code, json?.message ?? json?.code ?? "Something went wrong. Please try again.");
  }
  return json as T;
}

// ---- Discovery -------------------------------------------------------------

export interface DiscoveryItem {
  userId: string;
  displayName: string;
  // Genuinely nullable in the real backend (DirectoryService's own
  // DiscoveryItem) -- seen live on a real account with no active
  // role_assignment row at all. Never assume every directory entry has one.
  role: string | null;
  designation?: string;
  profilePhoto?: string;
  scope: "SCOPED" | "UNSCOPED";
  messagingMode: "DIRECT" | "REQUEST";
}

export async function discoverUsersAction(params: { search?: string; cursor?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return messagingRequest<{ data: { items: DiscoveryItem[]; nextCursor: string | null } }>(`/discovery${qs ? `?${qs}` : ""}`);
}

// ---- Conversations -----------------------------------------------------

export interface ConversationSummary {
  id: string;
  status: "ACTIVE" | "BLOCKED" | "CLOSED";
  personAId: string;
  personBId: string;
  lastMessageId: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  mlsWelcome: string | null;
}

export async function listConversationsAction() {
  return messagingRequest<{ data: ConversationSummary[]; nextCursor: { updatedAt: string; id: string } | null }>("/conversations");
}

export async function getConversationAction(id: string) {
  return messagingRequest<{ data: ConversationSummary & { ownLastReadSequence: number } }>(`/conversations/${id}`);
}

export interface CreateConversationResult {
  conversationId: string;
  state: "ACTIVE" | "PENDING";
  messagingMode: "DIRECT" | "REQUEST";
  isNew: boolean;
}

export async function createConversationAction(input: {
  targetPersonId: string;
  mlsWelcome?: string;
  initialMessage?: { clientMessageId: string; ciphertext: string; encryptionVersion: string };
}) {
  return messagingRequest<{ data: CreateConversationResult }>("/conversations", { method: "POST", body: input });
}

export async function ackConversationWelcomeAction(conversationId: string) {
  return messagingRequest<{ data: { acknowledged: true } }>(`/conversations/${conversationId}/mls-welcome/ack`, { method: "POST" });
}

// ---- Requests ------------------------------------------------------------

export interface RequestSummary {
  id: string;
  conversationId: string;
  requesterPersonId: string;
  recipientPersonId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  respondedAt: string | null;
}

export async function listRequestsAction(params: { status?: RequestSummary["status"]; as?: "recipient" | "requester" }) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.as) query.set("as", params.as);
  const qs = query.toString();
  return messagingRequest<{ data: RequestSummary[] }>(`/requests${qs ? `?${qs}` : ""}`);
}

export async function createRequestAction(input: {
  targetPersonId: string;
  mlsWelcome?: string;
  initialMessage: { clientMessageId: string; ciphertext: string; encryptionVersion: string };
}) {
  return messagingRequest<{ data: CreateConversationResult }>("/requests", { method: "POST", body: input });
}

export async function acceptRequestAction(id: string) {
  return messagingRequest<{ data: RequestSummary }>(`/requests/${id}/accept`, { method: "POST" });
}
export async function declineRequestAction(id: string) {
  return messagingRequest<{ data: RequestSummary }>(`/requests/${id}/decline`, { method: "POST" });
}
export async function cancelRequestAction(id: string) {
  return messagingRequest<{ data: RequestSummary }>(`/requests/${id}/cancel`, { method: "POST" });
}

// ---- Messages --------------------------------------------------------------

export interface MessageDto {
  id: string;
  conversationId: string;
  senderPersonId: string;
  clientMessageId: string;
  sequence: number;
  ciphertext: string;
  encryptionVersion: string;
  createdAt: string;
}

export async function listMessagesAction(conversationId: string, params: { before?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.before !== undefined) query.set("before", String(params.before));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return messagingRequest<{ data: MessageDto[]; meta: { hasMore: boolean; nextCursor: number | null } }>(
    `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
  );
}

export async function sendMessageAction(
  conversationId: string,
  input: { clientMessageId: string; ciphertext: string; encryptionVersion: string },
) {
  return messagingRequest<{ data: { clientMessageId: string; messageId: string; conversationId: string; sequence: number; status: "ACCEPTED" } }>(
    `/conversations/${conversationId}/messages`,
    { method: "POST", body: input },
  );
}

export async function markReadAction(conversationId: string, sequence: number) {
  return messagingRequest<{ data: { conversationId: string; lastReadSequence: number } }>(`/conversations/${conversationId}/read`, {
    method: "POST",
    body: { sequence },
  });
}

// ---- Devices ---------------------------------------------------------------

export interface MessagingDeviceDto {
  id: string;
  personId: string;
  devicePublicKey: string;
  platform: "ANDROID" | "IOS" | "WEB";
  status: "ACTIVE" | "REVOKED" | "SUSPENDED";
}

export async function registerDeviceAction(input: { devicePublicKey: string }) {
  return messagingRequest<{ data: MessagingDeviceDto }>("/devices", {
    method: "POST",
    body: { devicePublicKey: input.devicePublicKey, platform: "WEB" },
  });
}

// ---- MLS keys ----------------------------------------------------------

export async function publishMlsKeyPackagesAction(deviceId: string, keyPackages: string[]) {
  return messagingRequest<{ data: { ids: string[] } }>("/keys/mls-key-packages", { method: "POST", body: { deviceId, keyPackages } });
}

export interface DeviceKeyBundleDto {
  deviceId: string;
  mlsKeyPackage: { id: string; data: string } | null;
}

export async function getKeyBundleAction(userId: string) {
  return messagingRequest<{ data: DeviceKeyBundleDto[] }>(`/keys/${userId}`);
}
