"use client";

// Real, secure, E2EE-encrypted messaging -- split-pane "Messages" view
// (search + conversation list on the left, the open thread on the right),
// mirroring Faculty's own message/MessagesListClient.tsx exactly (same real
// crypto/polling/request-decision logic, same split layout), styled to
// Parent's own --par-* tokens. Replaces the earlier flat list-only screen
// that required a full page navigation just to open one conversation.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDisplayName } from "@/lib/e2ee/nameCache";
import { listConversationsAction, listRequestsAction, type ConversationSummary } from "@/lib/messaging-actions";
import { ConversationPane } from "./ConversationPane";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("en-IN", { weekday: "short" });
}
function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function MessagesListClient({ personId, initialConversationId }: { personId: string; initialConversationId?: string }) {
  useE2eeBootstrap(personId);

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [search, setSearch] = useState("");
  const [showListOnMobile, setShowListOnMobile] = useState(!initialConversationId);

  async function load() {
    try {
      const [convRes, reqRes] = await Promise.all([listConversationsAction(), listRequestsAction({ status: "PENDING", as: "recipient" })]);
      setConversations(convRes.data);
      setPendingCount(reqRes.data.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your conversations.");
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 0);
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

  function selectConversation(id: string) {
    setSelectedId(id);
    setShowListOnMobile(false);
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--par-ink)" }}>Messages</div>
          <div style={{ marginTop: 6, fontSize: 15, color: "var(--par-body-muted)" }}>End-to-end encrypted — only you and the recipient can read these</div>
        </div>
        <Link href="/parent/messages/new" style={{ border: 0, background: "var(--par-primary)", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 9, padding: "13px 22px", display: "inline-block", textDecoration: "none" }}>
          + New message
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link href="/parent/messages/requests" className="parent-card-hover" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12, background: "var(--par-amber-bg)", border: "1px solid #f2dca0", borderRadius: 12, padding: "14px 18px", textDecoration: "none" }}>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--par-ink)" }}>
            {pendingCount} message request{pendingCount === 1 ? "" : "s"} waiting for your response
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--par-primary)" }}>Review →</span>
        </Link>
      )}

      <div style={{ marginTop: 18 }}>
        {error ? (
          <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)" }}>
            <div style={{ fontSize: 14, color: "var(--par-red)" }}>{error}</div>
            <button type="button" onClick={load} style={{ marginTop: 10, border: "1px solid var(--par-border)", background: "#fff", cursor: "pointer", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>
              Retry
            </button>
          </div>
        ) : (
          <div
            className="flex"
            style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", overflow: "hidden", height: 640 }}
          >
            <div
              className={showListOnMobile ? "flex" : "hidden lg:flex"}
              style={{ width: 320, flex: "0 0 320px", borderRight: "1px solid var(--par-divider)", flexDirection: "column", minHeight: 0 }}
            >
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)", marginBottom: 12 }}>Messages</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people to message"
                  style={{ width: "100%", border: "1px solid var(--par-border)", background: "var(--par-panel)", borderRadius: 10, padding: "10px 14px", fontSize: 13.5 }}
                />
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {conversations === null ? (
                  <p style={{ textAlign: "center", padding: 30, fontSize: 13.5, color: "var(--par-tertiary)" }}>Loading…</p>
                ) : filtered && filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 30, fontSize: 13.5, color: "var(--par-tertiary)" }}>
                    {conversations.length === 0 ? <>No conversations yet.<br />Tap &ldquo;+ New message&rdquo; to start one.</> : "No matches."}
                  </p>
                ) : (
                  filtered?.map((c) => {
                    const otherPersonId = c.personAId === personId ? c.personBId : c.personAId;
                    const name = resolveDisplayName(otherPersonId);
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectConversation(c.id)}
                        className="parent-row-hover flex items-center gap-3 w-full text-left"
                        style={{
                          padding: "13px 16px",
                          borderTop: "none",
                          borderRight: "none",
                          borderLeft: active ? "3px solid var(--par-primary)" : "3px solid transparent",
                          borderBottom: "1px solid var(--par-divider)",
                          background: active ? "var(--par-tint)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--par-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, flex: "0 0 38px" }}>
                          {initialsOf(name)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="flex items-center justify-between gap-2">
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{name}</span>
                            <span style={{ fontSize: 11, color: "var(--par-tertiary)", flex: "0 0 auto" }}>{formatTimestamp(c.lastMessageAt)}</span>
                          </span>
                          <span style={{ display: "block", fontSize: 12.5, color: "var(--par-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.mlsWelcome ? "New conversation" : "Encrypted message"}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={showListOnMobile ? "hidden lg:flex" : "flex"} style={{ flex: 1, minWidth: 0, flexDirection: "column" }}>
              {selectedId ? (
                <ConversationPane key={selectedId} conversationId={selectedId} personId={personId} onBack={() => setShowListOnMobile(true)} />
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--par-body)" }}>Select a conversation</p>
                  <p style={{ fontSize: 13, color: "var(--par-tertiary)" }}>Choose someone from the list to view messages</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
