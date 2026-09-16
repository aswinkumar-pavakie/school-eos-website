"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useE2eeBootstrap } from "@/lib/e2ee/bootstrap";
import { resolveDisplayName } from "@/lib/e2ee/nameCache";
import { listConversationsAction, listRequestsAction, type ConversationSummary } from "@/lib/messaging-actions";

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function MessagesListClient({ personId }: { personId: string }) {
  useE2eeBootstrap(personId);

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Message</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
            End-to-end encrypted -- only you and the recipient can read these
          </p>
        </div>
        <Link
          href="/faculty/message/new"
          style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 22px", display: "inline-block" }}
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
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</p>
            <button type="button" onClick={load} style={{ marginTop: 10, border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 9, padding: "9px 16px", font: "600 13px/1 var(--fac-font-sans)" }}>
              Retry
            </button>
          </div>
        ) : conversations === null ? (
          <p style={{ textAlign: "center", padding: 40, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
        ) : conversations.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
            No conversations yet. Tap &ldquo;+ New message&rdquo; to start one.
          </p>
        ) : (
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", overflow: "hidden" }}>
            {conversations.map((c) => {
              const otherPersonId = c.personAId === personId ? c.personBId : c.personAId;
              const name = resolveDisplayName(otherPersonId);
              return (
                <Link
                  key={c.id}
                  href={`/faculty/message/${c.id}`}
                  className="fac-hover-lift flex items-center gap-3.5"
                  style={{ padding: "14px 20px", borderBottom: "1px solid var(--fac-divider)" }}
                >
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--fac-font-sans)", flex: "0 0 40px" }}>
                    {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="flex items-center justify-between gap-2">
                      <span style={{ font: "600 15px/1.3 var(--fac-font-sans)" }}>{name}</span>
                      <span style={{ font: "400 11.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{formatTimestamp(c.lastMessageAt)}</span>
                    </span>
                    <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                      {c.mlsWelcome ? "New conversation" : "Encrypted message"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
