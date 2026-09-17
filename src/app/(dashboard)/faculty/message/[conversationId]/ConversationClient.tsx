"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDisplayName } from "@/lib/e2ee/nameCache";
import { ensureConversationJoined } from "@/lib/e2ee/welcome";
import { decryptMessageCached, encryptMessage } from "@/lib/e2ee/cipher";
import { getSentPlaintext, saveSentPlaintext } from "@/lib/e2ee/storage";
import {
  acceptRequestAction,
  declineRequestAction,
  getConversationAction,
  listMessagesAction,
  listRequestsAction,
  markReadAction,
  sendMessageAction,
  type ConversationSummary,
  type RequestSummary,
} from "@/lib/messaging-actions";

interface DecryptedMessage {
  id: string;
  senderPersonId: string;
  sequence: number;
  plaintext: string;
  createdAt: string;
}

// No live WebSocket for this V1 website build -- a deliberate, disclosed
// scope reduction (see this feature's own final report): the mobile app's
// realtime socket authenticates with the raw access token directly from the
// client, which this site's httpOnly-cookie auth model doesn't expose to
// client JS by design. Polling while a conversation is open is the safe
// interim approximation; a real Socket.IO integration through a short-lived,
// purpose-minted token is real, separate follow-up work.
const POLL_INTERVAL_MS = 8000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function ConversationClient({ conversationId, personId }: { conversationId: string; personId: string }) {
  useE2eeBootstrap(personId);

  const [conversation, setConversation] = useState<(ConversationSummary & { ownLastReadSequence: number }) | null>(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<DecryptedMessage[] | null>(null);
  const [pendingRequest, setPendingRequest] = useState<RequestSummary | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadConversationAndJoin = useCallback(async () => {
    const { data } = await getConversationAction(conversationId);
    setConversation(data);
    await ensureConversationJoined(data);
    setJoined(true);
  }, [conversationId]);

  const loadMessages = useCallback(async () => {
    const { data } = await listMessagesAction(conversationId);
    const decrypted: DecryptedMessage[] = [];
    for (const message of data) {
      let plaintext: string;
      if (message.senderPersonId === personId) {
        plaintext = (await getSentPlaintext(conversationId, message.clientMessageId)) ?? "[Unable to decrypt this message]";
      } else {
        try {
          plaintext = await decryptMessageCached(conversationId, message.id, message.ciphertext);
        } catch (err) {
          console.error(`[message] decrypt failed for ${message.id}:`, err);
          plaintext = "[Unable to decrypt this message]";
        }
      }
      decrypted.push({ id: message.id, senderPersonId: message.senderPersonId, sequence: message.sequence, plaintext, createdAt: message.createdAt });
    }
    setMessages(decrypted);

    const last = decrypted[decrypted.length - 1];
    if (last && last.senderPersonId !== personId) {
      await markReadAction(conversationId, last.sequence).catch(() => {});
    }
  }, [conversationId, personId]);

  const loadRequests = useCallback(async () => {
    const [incoming, outgoing] = await Promise.all([
      listRequestsAction({ status: "PENDING", as: "recipient" }),
      listRequestsAction({ status: "PENDING", as: "requester" }),
    ]);
    const found = incoming.data.find((r) => r.conversationId === conversationId) ?? outgoing.data.find((r) => r.conversationId === conversationId);
    setPendingRequest(found ?? null);
  }, [conversationId]);

  useEffect(() => {
    (async () => {
      try {
        await loadConversationAndJoin();
        await loadRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't open this conversation.");
      }
    })();
  }, [loadConversationAndJoin, loadRequests]);

  useEffect(() => {
    if (!joined) return;
    const initial = setTimeout(() => {
      loadMessages().catch((err) => setError(err instanceof Error ? err.message : "Couldn't load messages."));
    }, 0);
    const interval = setInterval(() => {
      loadMessages().catch(() => {});
      loadRequests().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [joined, loadMessages, loadRequests]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setDraft("");
    try {
      const encrypted = await encryptMessage(conversationId, trimmed);
      const clientMessageId = crypto.randomUUID();
      await sendMessageAction(conversationId, { clientMessageId, ciphertext: encrypted.ciphertext, encryptionVersion: encrypted.encryptionVersion });
      await saveSentPlaintext(conversationId, clientMessageId, trimmed);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message not sent.");
      setDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  async function decide(action: "accept" | "decline") {
    if (!pendingRequest) return;
    setDeciding(true);
    try {
      if (action === "accept") await acceptRequestAction(pendingRequest.id);
      else await declineRequestAction(pendingRequest.id);
      await loadRequests();
    } finally {
      setDeciding(false);
    }
  }

  if (error) {
    return (
      <div>
        <BackButton href="/faculty/message" label="Back to messages" />
        <p style={{ marginTop: 30, textAlign: "center", font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</p>
      </div>
    );
  }
  if (!conversation) {
    return (
      <div>
        <BackButton href="/faculty/message" label="Back to messages" />
        <p style={{ marginTop: 30, textAlign: "center", font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  const otherPersonId = conversation.personAId === personId ? conversation.personBId : conversation.personAId;
  const otherName = resolveDisplayName(otherPersonId);
  const isRecipient = pendingRequest?.recipientPersonId === personId;
  const canSend = !pendingRequest;

  return (
    <div>
      <BackButton href="/faculty/message" label="Back to messages" />
      <h1 style={{ margin: "18px 0 0", font: "700 30px/1.2 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>{otherName}</h1>

      {pendingRequest && (
        <div style={{ marginTop: 14, background: "#fff6e5", border: "1px solid #f2dca0", borderRadius: 12, padding: 14 }}>
          {isRecipient ? (
            <>
              <p style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-ink)" }}>
                This person wants to message you. Only one message is allowed until you respond.
              </p>
              {deciding ? (
                <p style={{ font: "400 12.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 8 }}>Working…</p>
              ) : (
                <div className="flex gap-2.5" style={{ marginTop: 10 }}>
                  <button type="button" onClick={() => decide("decline")} style={{ flex: 1, border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 10, padding: "10px 0", font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
                    Decline
                  </button>
                  <button type="button" onClick={() => decide("accept")} style={{ flex: 1, border: 0, background: "var(--fac-primary)", cursor: "pointer", borderRadius: 10, padding: "10px 0", font: "600 13px/1 var(--fac-font-sans)", color: "#fff" }}>
                    Accept
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-ink)" }}>Waiting for a response to your message request.</p>
          )}
        </div>
      )}

      <div ref={listRef} style={{ marginTop: 16, height: 440, overflow: "auto", background: "var(--fac-panel)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 18 }}>
        {messages === null ? (
          <p style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderPersonId === personId;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div>
                  <div
                    style={{
                      maxWidth: 420,
                      borderRadius: 16,
                      padding: "10px 14px",
                      background: isOwn ? "var(--fac-primary)" : "var(--fac-divider)",
                      color: isOwn ? "#fff" : "var(--fac-ink)",
                    }}
                  >
                    <div style={{ font: "400 14px/1.5 var(--fac-font-sans)" }}>{m.plaintext}</div>
                  </div>
                  <div style={{ font: "400 11px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4, textAlign: isOwn ? "right" : "left" }}>{formatTime(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canSend && (
        <div className="flex items-end gap-2.5" style={{ marginTop: 12 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message…"
            rows={1}
            style={{ flex: 1, border: "1px solid var(--fac-border)", borderRadius: 22, padding: "12px 18px", font: "400 14.5px/1.4 var(--fac-font-sans)", resize: "none" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            style={{ width: 46, height: 46, flex: "0 0 46px", border: 0, borderRadius: "50%", background: "var(--fac-primary)", color: "#fff", cursor: "pointer", opacity: sending ? 0.7 : 1 }}
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
