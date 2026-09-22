"use client";

// Shared, role-agnostic real E2EE messaging app -- one component reused by
// every role whose own portal has no bespoke messaging screen yet (Admin,
// Correspondent, Transport Manager, Library, Finance, Media, Sports Admin,
// Community, Principal, Vice Principal, Hostel Warden). Same real crypto/
// backend as Faculty's and Parent's own message screens (@/lib/e2ee/*,
// @/lib/messaging-actions, the real school-eos-messaging microservice) --
// this is a re-skin onto the sitewide generic design tokens (bg-surface,
// text-text, bg-primary, border-border -- the same tokens Admin/Correspondent/
// Finance/etc. already use everywhere else in their own dashboards), not a
// second, different messaging implementation. All four states (list,
// thread, new message, requests) live in one component/one route instead of
// four sub-routes, since there's no per-role page tree to duplicate here.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { rememberNamesFromDiscovery, resolveDesignation, resolveDisplayName } from "@/lib/e2ee/nameCache";
import { ensureConversationJoined } from "@/lib/e2ee/welcome";
import { decryptMessageCached, encryptMessage } from "@/lib/e2ee/cipher";
import { getSentPlaintext, saveSentPlaintext } from "@/lib/e2ee/storage";
import { createMessageRequest, startDirectConversation } from "@/lib/e2ee/conversationCreation";
import {
  acceptRequestAction,
  declineRequestAction,
  discoverUsersAction,
  getConversationAction,
  listConversationsAction,
  listMessagesAction,
  listRequestsAction,
  markReadAction,
  sendMessageAction,
  type ConversationSummary,
  type DiscoveryItem,
  type RequestSummary,
} from "@/lib/messaging-actions";

type View = "list" | "thread" | "new" | "requests";
const POLL_INTERVAL_MS = 8000;
const PAGE_LIMIT = 100;
const MAX_PAGES = 200;

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}
function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function MessagingApp({
  personId,
  title = "Messages",
  initialConversationId,
}: {
  personId: string;
  title?: string;
  /** Opens directly into this thread on first render -- lets a deep link
   * (e.g. the dashboard's "Recent messages" preview, or a legacy
   * /messages/[id] route kept only as a redirect target) land straight on
   * the right conversation inside this same split-pane app, instead of
   * requiring a separate full-page thread route. */
  initialConversationId?: string;
}) {
  useE2eeBootstrap(personId);
  const router = useRouter();

  const [view, setView] = useState<View>(initialConversationId ? "thread" : "list");
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [error, setError] = useState<string | null>(null);

  async function loadList() {
    try {
      const [convRes, reqRes] = await Promise.all([
        listConversationsAction(),
        listRequestsAction({ status: "PENDING", as: "recipient" }),
      ]);
      setConversations(convRes.data);
      setPendingCount(reqRes.data.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your conversations.");
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadList, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!conversations) return null;
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((c) => {
      const otherId = c.personAId === personId ? c.personBId : c.personAId;
      return resolveDisplayName(otherId).toLowerCase().includes(needle);
    });
  }, [conversations, search, personId]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-text">{title}</h1>
          <p className="mt-2 text-sm text-text-muted">End-to-end encrypted — only you and the recipient can read these</p>
        </div>
        <div className="flex items-center gap-2.5">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setView("requests")}
              className="rounded-[10px] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field"
            >
              {pendingCount} request{pendingCount === 1 ? "" : "s"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setView("new")}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            + New message
          </button>
        </div>
      </div>

      <div className="mt-6 flex overflow-hidden rounded-[16px] border border-border bg-surface" style={{ height: 640 }}>
        <div className={`${view === "list" || view === "new" || view === "requests" ? "flex" : "hidden lg:flex"} w-[320px] flex-shrink-0 flex-col border-r border-border`}>
          <div className="p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-[10px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1 overflow-auto">
            {error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-critical-text">{error}</p>
                <button type="button" onClick={loadList} className="mt-2 rounded-[9px] border border-border px-3 py-1.5 text-xs font-bold text-text">Retry</button>
              </div>
            ) : conversations === null ? (
              <p className="p-6 text-center text-sm text-text-muted">Loading…</p>
            ) : filtered && filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-muted">
                {conversations.length === 0 ? "No conversations yet. Tap “+ New message” to start one." : "No matches."}
              </p>
            ) : (
              filtered?.map((c) => {
                const otherId = c.personAId === personId ? c.personBId : c.personAId;
                const name = resolveDisplayName(otherId);
                const active = c.id === selectedId && view === "thread";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setView("thread");
                    }}
                    className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-field ${active ? "bg-field" : ""}`}
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-text text-xs font-bold text-white">
                      {initialsOf(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-text">{name}</span>
                        <span className="flex-shrink-0 text-xs text-text-muted">{formatTimestamp(c.lastMessageAt)}</span>
                      </span>
                      <span className="block truncate text-xs text-text-muted">{c.mlsWelcome ? "New conversation" : "Encrypted message"}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`${view === "list" || view === "new" || view === "requests" ? "hidden lg:flex" : "flex"} min-w-0 flex-1 flex-col`}>
          {view === "new" && (
            <NewMessagePane
              personId={personId}
              onBack={() => setView("list")}
              onSent={(conversationId) => {
                setSelectedId(conversationId);
                setView("thread");
                loadList();
              }}
            />
          )}
          {view === "requests" && (
            <RequestsPane
              onBack={() => setView("list")}
              onOpen={(conversationId) => {
                setSelectedId(conversationId);
                setView("thread");
              }}
              onDecided={loadList}
            />
          )}
          {view === "thread" && selectedId ? (
            <ConversationPane
              key={selectedId}
              conversationId={selectedId}
              personId={personId}
              onBack={() => {
                setView("list");
                router.refresh();
              }}
            />
          ) : view === "list" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
              <p className="text-base font-bold text-text">Select a conversation</p>
              <p className="text-sm text-text-muted">Choose someone from the list to view messages</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Thread pane -- real join/poll/decrypt/send, identical logic to Faculty's
// own ConversationPane, generic-styled.
// ============================================================

interface DecryptedMessage {
  id: string;
  senderPersonId: string;
  sequence: number;
  plaintext: string;
  createdAt: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDateDivider(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function ConversationPane({ conversationId, personId, onBack }: { conversationId: string; personId: string; onBack: () => void }) {
  const [conversation, setConversation] = useState<(ConversationSummary & { ownLastReadSequence: number }) | null>(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<DecryptedMessage[] | null>(null);
  const [pendingRequest, setPendingRequest] = useState<RequestSummary | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function loadConversationAndJoin() {
    const { data } = await getConversationAction(conversationId);
    setConversation(data);
    await ensureConversationJoined(data);
    setJoined(true);
  }
  async function loadMessages() {
    const { data } = await listMessagesAction(conversationId);
    const decrypted: DecryptedMessage[] = [];
    for (const message of data) {
      let plaintext: string;
      if (message.senderPersonId === personId) {
        plaintext = (await getSentPlaintext(conversationId, message.clientMessageId)) ?? "[Unable to decrypt this message]";
      } else {
        try {
          plaintext = await decryptMessageCached(conversationId, message.id, message.ciphertext);
        } catch {
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
  }
  async function loadRequests() {
    const [incoming, outgoing] = await Promise.all([
      listRequestsAction({ status: "PENDING", as: "recipient" }),
      listRequestsAction({ status: "PENDING", as: "requester" }),
    ]);
    const found = incoming.data.find((r) => r.conversationId === conversationId) ?? outgoing.data.find((r) => r.conversationId === conversationId);
    setPendingRequest(found ?? null);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadConversationAndJoin();
        await loadRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't open this conversation.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conversationId change remounts this component via the parent's key={selectedId}
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-critical-text">{error}</p>
      </div>
    );
  }
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">Loading…</p>
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
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <button type="button" onClick={onBack} className="text-lg text-text-muted lg:hidden" aria-label="Back to messages">←</button>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-text text-xs font-bold text-white">{initialsOf(otherName)}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-text">{otherName}</div>
          {otherDesignation && <div className="truncate text-xs text-text-muted">{otherDesignation}</div>}
        </div>
      </div>

      {pendingRequest && (
        <div className="m-4 rounded-[12px] border border-[#f2dca0] bg-[#fff6e5] p-3.5">
          {isRecipient ? (
            <>
              <p className="text-xs text-text">This person wants to message you. Only one message is allowed until you respond.</p>
              {deciding ? (
                <p className="mt-2 text-xs text-text-muted">Working…</p>
              ) : (
                <div className="mt-2.5 flex gap-2.5">
                  <button type="button" onClick={() => decide("decline")} className="flex-1 rounded-[10px] border border-border bg-surface py-2 text-xs font-bold text-text-muted">Decline</button>
                  <button type="button" onClick={() => decide("accept")} className="flex-1 rounded-[10px] bg-primary py-2 text-xs font-bold text-white">Accept</button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-text">Waiting for a response to your message request.</p>
          )}
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-auto bg-field/40 p-5">
        {messages === null ? (
          <p className="text-center text-sm text-text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.senderPersonId === personId;
            const divider = formatDateDivider(m.createdAt);
            const showDivider = divider !== lastDateDivider;
            lastDateDivider = divider;
            return (
              <div key={m.id}>
                {showDivider && (
                  <div className="my-3 text-center">
                    <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-text-muted">{divider}</span>
                  </div>
                )}
                <div className={`mb-3.5 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[62%]">
                    <div className={`rounded-[14px] px-3.5 py-2.5 ${isOwn ? "bg-primary text-white" : "border border-border bg-surface text-text"}`}>
                      <div className="text-sm">{m.plaintext}</div>
                    </div>
                    <div className={`mt-1 text-[11px] text-text-muted ${isOwn ? "text-right" : "text-left"}`}>{formatTime(m.createdAt)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canSend && (
        <div className="flex items-center gap-2.5 border-t border-border p-4">
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
            className="flex-1 rounded-full border border-border bg-field px-4 py-3 text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// New message / discovery pane
// ============================================================

// Walks the ENTIRE directory exactly once (unfiltered -- the backend's own
// `search` param only filters within whatever page is already being walked,
// so getting real cross-directory search results always meant walking every
// page regardless). The bug this replaced: calling this per keystroke, which
// re-walked all ~7-10+ pages on every character typed. The messaging
// service's own directory-search rate limit is a deliberate, real anti-
// scraping control (30 requests/minute/person, directory.controller.ts) --
// with the directory now spanning every messaging-enabled role, a few
// keystrokes inside one debounce window was enough to exhaust it, surfacing
// as a real RATE_LIMITED 403. Fetching the full list once per mount and
// filtering client-side (same substring-over-displayName match the backend
// itself uses) gets identical results for a fraction of a percent of the
// network cost, and typing no longer touches the network at all.
async function discoverAll(): Promise<DiscoveryItem[]> {
  const items: DiscoveryItem[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await discoverUsersAction({ cursor, limit: PAGE_LIMIT });
    for (const item of data.items) {
      if (seen.has(item.userId)) continue;
      seen.add(item.userId);
      items.push(item);
    }
    if (!data.nextCursor || data.nextCursor === cursor) break;
    cursor = data.nextCursor;
  }
  rememberNamesFromDiscovery(items);
  return items;
}

function NewMessagePane({ personId, onBack, onSent }: { personId: string; onBack: () => void; onSent: (conversationId: string) => void }) {
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState<DiscoveryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    discoverAll().then(setAllItems).finally(() => setLoading(false));
  }, []);

  const needle = search.trim().toLowerCase();
  const items = needle ? (allItems ?? []).filter((i) => i.displayName.toLowerCase().includes(needle)) : allItems ?? [];
  const scoped = items.filter((i) => i.scope === "SCOPED");
  const unscoped = items.filter((i) => i.scope === "UNSCOPED");

  async function handleSend() {
    if (!selected) return;
    const trimmed = draft.trim();
    if (selected.messagingMode === "REQUEST" && trimmed.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const result =
        selected.messagingMode === "DIRECT"
          ? await startDirectConversation({ targetPersonId: selected.userId, plaintext: trimmed || undefined })
          : await createMessageRequest({ targetPersonId: selected.userId, plaintext: trimmed });
      onSent(result.conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-auto p-5">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onBack} className="text-lg text-text-muted lg:hidden" aria-label="Back">←</button>
        <h2 className="text-lg font-bold text-text">New message</h2>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search people…"
        className="mt-4 w-full rounded-[10px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
      <div className="mt-3 max-h-[380px] overflow-auto rounded-[12px] border border-border">
        {loading ? (
          <p className="p-6 text-center text-sm text-text-muted">Loading…</p>
        ) : scoped.length === 0 && unscoped.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">No matches.</p>
        ) : (
          <>
            {scoped.length > 0 && <div className="px-4 pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">People you can message directly</div>}
            {scoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
            {unscoped.length > 0 && <div className="px-4 pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">Other School EOS users</div>}
            {unscoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
          </>
        )}
      </div>

      {selected && (
        <div className="mt-4 rounded-[12px] border border-border bg-field p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-text">
              {selected.messagingMode === "REQUEST" ? `Send a message request to ${selected.displayName}` : `Message ${selected.displayName}`}
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-sm text-text-muted">✕</button>
          </div>
          {error && <p className="mt-2 text-xs text-critical-text">{error}</p>}
          <div className="mt-2.5 flex items-end gap-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selected.messagingMode === "REQUEST" ? "Write your one message (required)…" : "Write a message (optional)…"}
              rows={2}
              className="flex-1 rounded-[14px] border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (selected.messagingMode === "REQUEST" && !draft.trim())}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
            >
              {sending ? "…" : "➤"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscoveryRow({ item, active, onClick }: { item: DiscoveryItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-b-0 hover:bg-field ${active ? "bg-field" : "bg-surface"}`}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-field text-xs font-bold text-text">
        {item.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-bold text-text">{item.displayName}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <span
            className="rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
            style={{ background: item.role ? "var(--color-field)" : "#fee2e2", color: item.role ? "var(--color-primary)" : "#b91c1c" }}
          >
            {item.role ?? "No role on file"}
          </span>
          {item.designation && <span className="truncate text-xs text-text-muted">{item.designation}</span>}
        </span>
      </span>
      {item.messagingMode === "REQUEST" && <span className="text-[10px] font-bold uppercase text-primary">Request</span>}
    </button>
  );
}

// ============================================================
// Requests inbox pane
// ============================================================

function RequestsPane({ onBack, onOpen, onDecided }: { onBack: () => void; onOpen: (conversationId: string) => void; onDecided: () => void }) {
  const [requests, setRequests] = useState<RequestSummary[] | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await listRequestsAction({ status: "PENDING", as: "recipient" });
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load requests.");
    }
  }
  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  async function decide(id: string, action: "accept" | "decline") {
    setDecidingId(id);
    try {
      if (action === "accept") await acceptRequestAction(id);
      else await declineRequestAction(id);
      await load();
      onDecided();
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-auto p-5">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onBack} className="text-lg text-text-muted lg:hidden" aria-label="Back">←</button>
        <h2 className="text-lg font-bold text-text">Message requests</h2>
      </div>
      <div className="mt-4">
        {error ? (
          <p className="p-8 text-center text-sm text-critical-text">{error}</p>
        ) : requests === null ? (
          <p className="p-8 text-center text-sm text-text-muted">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">No pending message requests.</p>
        ) : (
          <div className="overflow-hidden rounded-[12px] border border-border">
            {requests.map((r) => {
              const name = resolveDisplayName(r.requesterPersonId);
              const deciding = decidingId === r.id;
              return (
                <div key={r.id} className="flex items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-b-0">
                  <button type="button" onClick={() => onOpen(r.conversationId)} className="flex flex-1 min-w-0 items-center gap-3.5 text-left">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-field text-sm font-bold text-text">
                      {initialsOf(name)}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-text">{name}</span>
                      <span className="block text-xs text-text-muted">Wants to send you a message</span>
                    </span>
                  </button>
                  {deciding ? (
                    <span className="text-xs text-text-muted">Working…</span>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(r.id, "decline")} className="rounded-[9px] border border-border px-3.5 py-2 text-xs font-bold text-text-muted">Decline</button>
                      <button type="button" onClick={() => decide(r.id, "accept")} className="rounded-[9px] bg-primary px-3.5 py-2 text-xs font-bold text-white">Accept</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
