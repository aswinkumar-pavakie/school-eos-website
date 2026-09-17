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
  return sameDay ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function MessagesListClient({ personId }: { personId: string }) {
  useE2eeBootstrap(personId);

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--par-red)" }}>{error}</div>
            <button type="button" onClick={load} style={{ marginTop: 10, border: "1px solid var(--par-border)", background: "#fff", cursor: "pointer", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>
              Retry
            </button>
          </div>
        ) : conversations === null ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--par-tertiary)" }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--par-tertiary)" }}>No conversations yet. Tap &ldquo;+ New message&rdquo; to start one.</div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", overflow: "hidden" }}>
            {conversations.map((c) => {
              const otherPersonId = c.personAId === personId ? c.personBId : c.personAId;
              const name = resolveDisplayName(otherPersonId);
              return (
                <Link key={c.id} href={`/parent/messages/${c.id}`} className="parent-row-hover" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--par-divider)", textDecoration: "none" }}>
                  <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{name}</span>
                      <span style={{ fontSize: 11.5, color: "var(--par-tertiary)" }}>{formatTimestamp(c.lastMessageAt)}</span>
                    </span>
                    <span style={{ display: "block", fontSize: 13, color: "var(--par-tertiary)", marginTop: 3 }}>{c.mlsWelcome ? "New conversation" : "Encrypted message"}</span>
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
