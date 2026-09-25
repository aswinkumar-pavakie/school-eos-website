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

import { useEffect, useMemo, useState } from "react";
import { friendlyMessagingError } from "@/lib/messaging-errors";
import { useRouter } from "next/navigation";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { hasCachedName, resolveDisplayName } from "@/lib/e2ee/nameCache";
import { subscribeDirectory } from "@/lib/e2ee/directoryWalk";
import { createMessageRequest, startDirectConversation } from "@/lib/e2ee/conversationCreation";
import {
  acceptRequestAction,
  declineRequestAction,
  listConversationsAction,
  listRequestsAction,
  type ConversationSummary,
  type DiscoveryItem,
  type RequestSummary,
} from "@/lib/messaging-actions";
import { ConversationPane } from "@/components/shared-ui/messaging/ConversationPane";

type View = "list" | "thread" | "new" | "requests";
const POLL_INTERVAL_MS = 8000;

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
      setError(friendlyMessagingError(err, "Couldn't load your conversations."));
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadList, 0);
    return () => clearTimeout(timer);
  }, []);

  // The messaging server never returns names: load the directory (shared,
  // rate-limit-aware) in the background so unnamed people get their names.
  const [, setNameTick] = useState(0);
  const hasUnnamed = conversations?.some((c) => !hasCachedName(c.personAId === personId ? c.personBId : c.personAId)) ?? false;
  useEffect(() => {
    if (!hasUnnamed) return;
    return subscribeDirectory(personId, () => setNameTick((t) => t + 1));
  }, [hasUnnamed, personId]);

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
          <h1 style={{ margin: 0, font: "700 32px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>{title}</h1>
          <p style={{ margin: "8px 0 0", font: "400 14px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>End-to-end encrypted — only you and the recipient can read these</p>
        </div>
        <div className="flex items-center gap-2.5">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setView("requests")}
              style={{ borderRadius: 10, border: "1px solid var(--eos-border)", background: "var(--eos-white)", padding: "10px 16px", font: "600 14px/1 var(--eos-font-sans)", color: "var(--eos-ink)", cursor: "pointer" }}
            >
              {pendingCount} request{pendingCount === 1 ? "" : "s"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setView("new")}
            style={{ borderRadius: 10, border: 0, background: "var(--eos-primary)", padding: "10px 16px", font: "600 14px/1 var(--eos-font-sans)", color: "#fff", cursor: "pointer" }}
          >
            + New message
          </button>
        </div>
      </div>

      <div className="mt-6 flex overflow-hidden" style={{ borderRadius: "var(--eos-radius-card)", border: "1px solid var(--eos-border)", background: "var(--eos-white)", height: 640 }}>
        <div
          className={view === "list" || view === "new" || view === "requests" ? "flex" : "hidden lg:flex"}
          style={{ width: 320, flex: "0 0 320px", borderRight: "1px solid var(--eos-divider)", flexDirection: "column", minHeight: 0 }}
        >
          <div style={{ padding: "18px 18px 14px" }}>
            <div style={{ font: "700 16px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)", marginBottom: 12 }}>Messages</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people to message"
              style={{ width: "100%", border: "1px solid var(--eos-border)", background: "var(--eos-panel)", borderRadius: 10, padding: "10px 14px", font: "400 13.5px/1 var(--eos-font-sans)" }}
            />
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {error ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <p style={{ font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-red-text)" }}>{error}</p>
                <button type="button" onClick={loadList} style={{ marginTop: 8, border: "1px solid var(--eos-border)", background: "var(--eos-white)", cursor: "pointer", borderRadius: 9, padding: "7px 14px", font: "600 12px/1 var(--eos-font-sans)" }}>Retry</button>
              </div>
            ) : conversations === null ? (
              <p style={{ textAlign: "center", padding: 30, font: "400 13.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Loading…</p>
            ) : filtered && filtered.length === 0 ? (
              <p style={{ textAlign: "center", padding: 30, font: "400 13.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>
                {conversations.length === 0 ? <>No conversations yet.<br />Tap &ldquo;+ New message&rdquo; to start one.</> : "No matches."}
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
                    className="flex items-center gap-3 w-full text-left"
                    style={{
                      padding: "13px 16px",
                      borderTop: "none",
                      borderRight: "none",
                      borderLeft: active ? "3px solid var(--eos-primary)" : "3px solid transparent",
                      borderBottom: "1px solid var(--eos-divider)",
                      background: active ? "var(--eos-tint)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--eos-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--eos-font-sans)", flex: "0 0 38px" }}>
                      {initialsOf(name)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="flex items-center justify-between gap-2">
                        <span style={{ font: "700 14px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{name}</span>
                        <span style={{ font: "400 11px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)", flex: "0 0 auto" }}>{formatTimestamp(c.lastMessageAt)}</span>
                      </span>
                      <span style={{ display: "block", font: "400 12.5px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.mlsWelcome ? "New conversation" : "Encrypted message"}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={view === "list" || view === "new" || view === "requests" ? "hidden lg:flex" : "flex"} style={{ minWidth: 0, flex: 1, flexDirection: "column" }}>
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <p style={{ font: "600 15px/1.3 var(--eos-font-sans)", color: "var(--eos-body)" }}>Select a conversation</p>
              <p style={{ font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Choose someone from the list to view messages</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// New message / discovery pane
// ============================================================

function NewMessagePane({ personId, onBack, onSent }: { personId: string; onBack: () => void; onSent: (conversationId: string) => void }) {
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState<DiscoveryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDirectory(personId, (items, done) => {
      setAllItems(items);
      setLoading(false);
      setLoadingMore(!done);
    });
  }, [personId]);

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
      setError(friendlyMessagingError(err, "Could not send."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto", padding: 20 }}>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onBack} style={{ font: "600 18px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)", border: 0, background: "none", cursor: "pointer" }} className="lg:hidden" aria-label="Back">←</button>
        <h2 style={{ font: "700 18px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>New message</h2>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search people…"
        style={{ marginTop: 16, width: "100%", border: "1px solid var(--eos-border)", background: "var(--eos-panel)", borderRadius: 10, padding: "10px 14px", font: "400 13.5px/1 var(--eos-font-sans)" }}
      />
      <div style={{ marginTop: 12, maxHeight: 380, overflow: "auto", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)" }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: "center", font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Loading…</p>
        ) : scoped.length === 0 && unscoped.length === 0 ? (
          <p style={{ padding: 24, textAlign: "center", font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>No matches.</p>
        ) : (
          <>
            {scoped.length > 0 && <div style={{ padding: "14px 16px 6px", font: "700 11px/1 var(--eos-font-sans)", letterSpacing: ".07em", color: "var(--eos-tertiary)", textTransform: "uppercase" }}>People you can message directly</div>}
            {scoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
            {unscoped.length > 0 && <div style={{ padding: "14px 16px 6px", font: "700 11px/1 var(--eos-font-sans)", letterSpacing: ".07em", color: "var(--eos-tertiary)", textTransform: "uppercase" }}>Other School EOS users</div>}
            {unscoped.map((item) => (
              <DiscoveryRow key={item.userId} item={item} active={selected?.userId === item.userId} onClick={() => setSelected(item)} />
            ))}
          </>
        )}
      </div>

      {selected && (
        <div style={{ marginTop: 16, border: "1px solid var(--eos-border)", background: "var(--eos-panel)", borderRadius: "var(--eos-radius-card)", padding: 16 }}>
          <div className="flex items-center justify-between">
            <div style={{ font: "700 14px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>
              {selected.messagingMode === "REQUEST" ? `Send a message request to ${selected.displayName}` : `Message ${selected.displayName}`}
            </div>
            <button type="button" onClick={() => setSelected(null)} style={{ font: "400 14px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)", border: 0, background: "none", cursor: "pointer" }}>✕</button>
          </div>
          {error && <p style={{ marginTop: 8, font: "400 12px/1.4 var(--eos-font-sans)", color: "var(--eos-red-text)" }}>{error}</p>}
          <div className="flex items-end gap-2.5" style={{ marginTop: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selected.messagingMode === "REQUEST" ? "Write your one message (required)…" : "Write a message (optional)…"}
              rows={2}
              style={{ flex: 1, border: "1px solid var(--eos-border)", background: "var(--eos-white)", borderRadius: 14, padding: "10px 16px", font: "400 14px/1.4 var(--eos-font-sans)" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (selected.messagingMode === "REQUEST" && !draft.trim())}
              style={{ width: 44, height: 44, flexShrink: 0, border: 0, borderRadius: "50%", background: "var(--eos-primary)", color: "#fff", cursor: "pointer", opacity: sending ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
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
      className="flex w-full items-center gap-3 text-left"
      style={{ padding: "11px 16px", borderBottom: "1px solid var(--eos-divider)", background: active ? "var(--eos-tint)" : "var(--eos-white)" }}
    >
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--eos-panel)", color: "var(--eos-ink)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px/1 var(--eos-font-sans)", flexShrink: 0 }}>
        {item.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", font: "700 14px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.displayName}</span>
        <span className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
          <span
            style={{ borderRadius: 6, padding: "3px 7px", font: "700 10.5px/1 var(--eos-font-sans)", letterSpacing: ".04em", textTransform: "uppercase", background: item.role ? "var(--eos-tint)" : "var(--eos-red-bg)", color: item.role ? "var(--eos-primary)" : "var(--eos-red-text)" }}
          >
            {item.role ?? "No role on file"}
          </span>
          {item.designation && <span style={{ font: "400 12px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.designation}</span>}
        </span>
      </span>
      {item.messagingMode === "REQUEST" && <span style={{ font: "700 10px/1 var(--eos-font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--eos-primary)" }}>Request</span>}
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

  const [, setNameTick] = useState(0);
  const myPersonId = requests?.[0]?.recipientPersonId;
  const hasUnnamed = requests?.some((r) => !hasCachedName(r.requesterPersonId)) ?? false;
  useEffect(() => {
    if (!hasUnnamed || !myPersonId) return;
    return subscribeDirectory(myPersonId, () => setNameTick((t) => t + 1));
  }, [hasUnnamed, myPersonId]);

  async function load() {
    try {
      const { data } = await listRequestsAction({ status: "PENDING", as: "recipient" });
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(friendlyMessagingError(err, "Couldn't load requests."));
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
    } catch (err) {
      setError(friendlyMessagingError(err, "Couldn't update this request."));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto", padding: 20 }}>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={onBack} style={{ font: "600 18px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)", border: 0, background: "none", cursor: "pointer" }} className="lg:hidden" aria-label="Back">←</button>
        <h2 style={{ font: "700 18px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Message requests</h2>
      </div>
      <div style={{ marginTop: 16 }}>
        {error ? (
          <p style={{ padding: 30, textAlign: "center", font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-red-text)" }}>{error}</p>
        ) : requests === null ? (
          <p style={{ padding: 30, textAlign: "center", font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p style={{ padding: 30, textAlign: "center", font: "400 13px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>No pending message requests.</p>
        ) : (
          <div style={{ overflow: "hidden", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)" }}>
            {requests.map((r) => {
              const name = resolveDisplayName(r.requesterPersonId);
              const deciding = decidingId === r.id;
              return (
                <div key={r.id} className="flex items-center gap-3.5" style={{ padding: "14px 16px", borderBottom: "1px solid var(--eos-divider)" }}>
                  <button type="button" onClick={() => onOpen(r.conversationId)} className="flex flex-1 items-center gap-3.5 text-left" style={{ minWidth: 0 }}>
                    <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--eos-panel)", color: "var(--eos-ink)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px/1 var(--eos-font-sans)", flexShrink: 0 }}>
                      {initialsOf(name)}
                    </span>
                    <span>
                      <span style={{ display: "block", font: "700 14px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{name}</span>
                      <span style={{ display: "block", font: "400 12px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Wants to send you a message</span>
                    </span>
                  </button>
                  {deciding ? (
                    <span style={{ font: "400 12px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Working…</span>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(r.id, "decline")} style={{ border: "1px solid var(--eos-border)", background: "var(--eos-white)", cursor: "pointer", borderRadius: 9, padding: "8px 14px", font: "700 12px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>Decline</button>
                      <button type="button" onClick={() => decide(r.id, "accept")} style={{ border: 0, background: "var(--eos-primary)", cursor: "pointer", borderRadius: 9, padding: "8px 14px", font: "700 12px/1 var(--eos-font-sans)", color: "#fff" }}>Accept</button>
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
