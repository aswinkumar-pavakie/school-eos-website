"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDesignation, resolveDisplayName } from "@/lib/e2ee/nameCache";
import { listConversationsAction, listRequestsAction, type ConversationSummary } from "@/lib/messaging-actions";
import { ConversationPane } from "./ConversationPane";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { weekday: "short" });
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
    // setState must happen inside a callback, never synchronously in the
    // effect body (react-hooks/set-state-in-effect) -- a 0ms timeout keeps
    // this imperceptible to the user while satisfying that.
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
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 32px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Messages</h1>
          <p style={{ margin: "8px 0 0", font: "400 14.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
            End-to-end encrypted — only you and the recipient can read these
          </p>
        </div>
        <Link
          href="/faculty/message/new"
          style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
        >
          + New message
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/faculty/message/requests"
          className="fac-hover-lift flex items-center gap-3"
          style={{ marginTop: 18, background: "#fff6e5", border: "1px solid #f2dca0", borderRadius: 12, padding: "14px 18px" }}
        >
          <span style={{ flex: 1, font: "500 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-ink)" }}>
            {pendingCount} message request{pendingCount === 1 ? "" : "s"} waiting for your response
          </span>
          <span style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>Review &rarr;</span>
        </Link>
      )}

      <div style={{ marginTop: 18 }}>
        {error ? (
          <div style={{ padding: 40, textAlign: "center", background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)" }}>
            <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</p>
            <button type="button" onClick={load} style={{ marginTop: 10, border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 9, padding: "9px 16px", font: "600 13px/1 var(--fac-font-sans)" }}>
              Retry
            </button>
          </div>
        ) : (
          <div
            className="flex"
            style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", overflow: "hidden", height: 640 }}
          >
            <div
              className={showListOnMobile ? "flex" : "hidden lg:flex"}
              style={{ width: 320, flex: "0 0 320px", borderRight: "1px solid var(--fac-divider)", flexDirection: "column", minHeight: 0 }}
            >
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{ font: "700 16px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)", marginBottom: 12 }}>Messages</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people to message"
                  style={{ width: "100%", border: "1px solid var(--fac-border)", background: "var(--fac-panel)", borderRadius: 10, padding: "10px 14px", font: "400 13.5px/1 var(--fac-font-sans)" }}
                />
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {conversations === null ? (
                  <p style={{ textAlign: "center", padding: 30, font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
                ) : filtered && filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 30, font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    {conversations.length === 0 ? <>No conversations yet.<br />Tap &ldquo;+ New message&rdquo; to start one.</> : "No matches."}
                  </p>
                ) : (
                  filtered?.map((c) => {
                    const otherPersonId = c.personAId === personId ? c.personBId : c.personAId;
                    const name = resolveDisplayName(otherPersonId);
                    const designation = resolveDesignation(otherPersonId);
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectConversation(c.id)}
                        className="fac-hover-lift flex items-center gap-3 w-full text-left"
                        style={{
                          padding: "13px 16px",
                          borderLeft: active ? "3px solid var(--fac-primary)" : "3px solid transparent",
                          background: active ? "var(--fac-tint)" : "transparent",
                          border: 0,
                          borderBottom: "1px solid var(--fac-divider)",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--fac-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--fac-font-sans)", flex: "0 0 38px" }}>
                          {initialsOf(name)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="flex items-center justify-between gap-2">
                            <span style={{ font: "700 14px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{name}</span>
                            <span style={{ font: "400 11px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", flex: "0 0 auto" }}>{formatTimestamp(c.lastMessageAt)}</span>
                          </span>
                          <span style={{ display: "block", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {designation ?? (c.mlsWelcome ? "New conversation" : "Encrypted message")}
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
                  <p style={{ font: "600 15px/1.3 var(--fac-font-sans)", color: "var(--fac-body)" }}>Select a conversation</p>
                  <p style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Choose someone from the list to view messages</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
