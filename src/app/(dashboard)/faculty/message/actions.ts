"use server";

import { revalidatePath } from "next/cache";
import {
  listMessages,
  sendMessage,
  markConversationRead,
  translateMessage,
  startPrincipalConversation,
  type MessageDto,
} from "@/lib/faculty-messages-api";

export async function loadMessagesAction(conversationId: string): Promise<MessageDto[]> {
  const messages = await listMessages(conversationId);
  await markConversationRead(conversationId).catch(() => {});
  return messages;
}

export async function sendMessageAction(conversationId: string, body: string): Promise<{ error?: string; message?: MessageDto }> {
  if (!body.trim()) return {};
  try {
    const message = await sendMessage(conversationId, body.trim());
    return { message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send message." };
  }
}

export async function translateMessageAction(conversationId: string, messageId: string, targetLanguage: string) {
  return translateMessage(conversationId, messageId, targetLanguage);
}

export async function startPrincipalConversationAction(): Promise<{ error?: string; conversationId?: string }> {
  try {
    const conversation = await startPrincipalConversation();
    revalidatePath("/faculty/message");
    return { conversationId: conversation.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open conversation." };
  }
}
