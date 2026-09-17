// Orchestrates the retry-safe Welcome-join flow: join locally -> persist ->
// ONLY THEN ack server-side. Identical to the mobile app's own
// src/services/messaging/welcome.ts. If anything before the ack throws, the
// next attempt simply re-reads the same still-undelivered Welcome and
// retries -- joinConversationFromWelcome's own "already joined?" check makes
// a retry after a successful local join (but a failed ack) a safe no-op.

import { ackConversationWelcomeAction, type ConversationSummary } from "../messaging-actions";
import { joinConversationFromWelcome } from "./group";

export async function ensureConversationJoined(conversation: Pick<ConversationSummary, "id" | "mlsWelcome">): Promise<void> {
  if (!conversation.mlsWelcome) return;
  await joinConversationFromWelcome(conversation.id, conversation.mlsWelcome);
  await ackConversationWelcomeAction(conversation.id);
}
