// Faculty "Message parents" -- targets the LEGACY /messages REST module
// (school-eos-backend/src/modules/messaging), confirmed real and already
// @Roles('FACULTY')-permitted. Deliberately NOT the separate, not-yet-cut-
// over school-eos-messaging E2EE microservice (a different repo/protocol;
// its own README states the legacy module "stays live and untouched until
// this service is deployed, tested, and the cutover is explicitly
// approved"). Same apiFetch/parseOrThrow convention as faculty-api.ts.

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

export interface ConversationSummary {
  id: string;
  conversationType: "STUDENT_CONTEXT" | "STAFF_DIRECT";
  student?: { id: string; name: string };
  grade?: { name: string };
  section?: { name: string };
  directParticipant?: { personId: string; name: string; role: string };
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return (await get<ApiEnvelope<ConversationSummary[]>>("/messages/conversations")).data;
}

export async function listMessages(conversationId: string, limit = 50): Promise<MessageDto[]> {
  return (
    await get<ApiEnvelope<MessageDto[]>>(`/messages/conversations/${conversationId}/messages?limit=${limit}`)
  ).data;
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageDto> {
  return (await post<ApiEnvelope<MessageDto>>(`/messages/conversations/${conversationId}/messages`, { body })).data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await patch(`/messages/conversations/${conversationId}/read`);
}

export interface TranslateMessageResult {
  messageId: string;
  targetLanguage: string;
  translatedText: string;
}
export async function translateMessage(conversationId: string, messageId: string, targetLanguage: string): Promise<TranslateMessageResult> {
  return (await post<ApiEnvelope<TranslateMessageResult>>(`/messages/conversations/${conversationId}/messages/${messageId}/translate`, { targetLanguage })).data;
}

export async function startPrincipalConversation(): Promise<ConversationSummary> {
  return (await post<ApiEnvelope<ConversationSummary>>("/messages/faculty/conversations/principal")).data;
}
