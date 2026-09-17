"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveDisplayName } from "@/lib/e2ee/nameCache";
import { acceptRequestAction, declineRequestAction, listRequestsAction, type RequestSummary } from "@/lib/messaging-actions";

export function RequestsInboxClient() {
  const router = useRouter();
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
      router.refresh();
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <Link href="/parent/messages" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--par-border)", background: "#fff", borderRadius: 9, padding: "10px 15px", fontSize: 13.5, fontWeight: 700, color: "var(--par-navy)", textDecoration: "none" }}>
        ‹ Back to messages
      </Link>
      <div style={{ marginTop: 18, fontSize: 34, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--par-ink)" }}>Message requests</div>

      <div style={{ marginTop: 18 }}>
        {error ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--par-red)" }}>{error}</div>
        ) : requests === null ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--par-tertiary)" }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 14, color: "var(--par-tertiary)" }}>No pending message requests.</div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)", overflow: "hidden" }}>
            {requests.map((r) => {
              const name = resolveDisplayName(r.requesterPersonId);
              const deciding = decidingId === r.id;
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--par-divider)" }}>
                  <Link href={`/parent/messages/${r.conversationId}`} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
                    <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{name}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "var(--par-tertiary)" }}>Wants to send you a message</span>
                    </span>
                  </Link>
                  {deciding ? (
                    <span style={{ fontSize: 12.5, color: "var(--par-tertiary)" }}>Working…</span>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => decide(r.id, "decline")} style={{ border: "1px solid var(--par-border)", background: "#fff", cursor: "pointer", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--par-body-muted)" }}>
                        Decline
                      </button>
                      <button type="button" onClick={() => decide(r.id, "accept")} style={{ border: 0, background: "var(--par-primary)", cursor: "pointer", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                        Accept
                      </button>
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
