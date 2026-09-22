"use client";

// Real, working E2EE thread pane -- same logic as the site's earlier
// full-page ConversationClient (join/poll/decrypt/send/accept-decline),
// just restyled to sit in the right-hand pane of the split "Messages" view
// instead of owning its own page/BackButton. Nothing about the crypto,
// polling, or request-decision flow changed.

import { useCallback, useEffect, useRef, useState } from "react";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDesignation, resolveDisplayName } from "@/lib/e2ee/nameCache";
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
// scope reduction: the mobile app's realtime socket authenticates with the
// raw access token directly from the client, which this site's httpOnly-
// cookie auth model doesn't expose to client JS by design. Polling while a
// conversation is open is the safe interim approximation.
const POLL_INTERVAL_MS = 8000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDateDivider(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function ConversationPane({ conversationId, personId, onBack }: { conversationId: string; personId: string; onBack?: () => void }) {
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
    // Parent remounts this component (React `key={conversationId}`) on
    // conversation switch, so all state above already starts fresh here --
    // no reset needed.
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
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</p>
      </div>
    );
  }
  if (!conversation) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  const otherPersonId = conversation.personAId === personId ? conversation.personBId : conversation.personAId;
  const otherName = resolveDisplayName(otherPersonId);
  const otherDesignation = resolveDesignation(otherPersonId);
  const isRecipient = pendingRequest?.recipientPersonId === personId;
  const canSend = !pendingRequest;

  let lastDateDivider = "";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div className="flex items-center gap-3" style={{ padding: "16px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to messages" style={{ border: 0, background: "none", cursor: "pointer", font: "600 18px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
            ←
          </button>
        )}
        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--fac-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--fac-font-sans)", flex: "0 0 38px" }}>
          {initialsOf(otherName)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "700 15px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{otherName}</div>
          {otherDesignation && <div style={{ font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 1 }}>{otherDesignation}</div>}
        </div>
      </div>

      {pendingRequest && (
        <div style={{ margin: "14px 22px 0", background: "#fff6e5", border: "1px solid #f2dca0", borderRadius: 12, padding: 14 }}>
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

      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "18px 22px", background: "var(--fac-panel)" }}>
        {messages === null ? (
          <p style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: "center", font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderPersonId === personId;
            const divider = formatDateDivider(m.createdAt);
            const showDivider = divider !== lastDateDivider;
            lastDateDivider = divider;
            return (
              <div key={m.id}>
                {showDivider && (
                  <div style={{ textAlign: "center", margin: "4px 0 16px" }}>
                    <span style={{ font: "600 11px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: 20, padding: "6px 13px" }}>
                      {divider}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 14 }}>
                  <div style={{ maxWidth: "62%" }}>
                    <div
                      style={{
                        borderRadius: 14,
                        padding: "10px 14px",
                        background: isOwn ? "var(--fac-primary)" : "var(--fac-white)",
                        border: isOwn ? "none" : "1px solid var(--fac-border)",
                        color: isOwn ? "#fff" : "var(--fac-ink)",
                      }}
                    >
                      <div style={{ font: "400 14px/1.5 var(--fac-font-sans)" }}>{m.plaintext}</div>
                    </div>
                    <div style={{ font: "400 11px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4, textAlign: isOwn ? "right" : "left" }}>{formatTime(m.createdAt)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canSend && (
        <div className="flex items-center gap-2.5" style={{ padding: "16px 22px", borderTop: "1px solid var(--fac-divider)" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            style={{ flex: 1, border: "1px solid var(--fac-border)", borderRadius: 22, padding: "12px 18px", font: "400 14px/1.4 var(--fac-font-sans)" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            style={{ width: 42, height: 42, flex: "0 0 42px", border: 0, borderRadius: "50%", background: "var(--fac-primary)", color: "#fff", cursor: "pointer", opacity: sending || !draft.trim() ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
