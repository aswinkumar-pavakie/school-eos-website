"use client";

import { useEffect, useState } from "react";
import { friendlyMessagingError } from "@/lib/messaging-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { hasCachedName, resolveDisplayName } from "@/lib/e2ee/nameCache";
import { subscribeDirectory } from "@/lib/e2ee/directoryWalk";
import { acceptRequestAction, declineRequestAction, listRequestsAction, type RequestSummary } from "@/lib/messaging-actions";

export function RequestsInboxClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[] | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The messaging server never returns names: load the directory (shared,
  // rate-limit-aware) in the background so unnamed requesters get their names.
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
      router.refresh();
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div>
      <BackButton href="/faculty/message" label="Back to messages" />
      <h1 style={{ margin: "18px 0 0", font: "700 34px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Message requests</h1>

      <div style={{ marginTop: 18 }}>
        {error ? (
          <p style={{ textAlign: "center", padding: 40, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</p>
        ) : requests === null ? (
          <p style={{ textAlign: "center", padding: 40, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No pending message requests.</p>
        ) : (
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", overflow: "hidden" }}>
            {requests.map((r) => {
              const name = resolveDisplayName(r.requesterPersonId);
              const deciding = decidingId === r.id;
              return (
                <div key={r.id} className="flex items-center gap-3.5" style={{ padding: "14px 20px", borderBottom: "1px solid var(--fac-divider)" }}>
                  <Link href={`/faculty/message/${r.conversationId}`} className="flex items-center gap-3.5" style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--fac-font-sans)", flex: "0 0 40px" }}>
                      {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <span>
                      <span style={{ display: "block", font: "600 15px/1.3 var(--fac-font-sans)" }}>{name}</span>
                      <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Wants to send you a message</span>
                    </span>
                  </Link>
                  {deciding ? (
                    <span style={{ font: "400 12.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Working…</span>
                  ) : (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(r.id, "decline")} style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 9, padding: "9px 14px", font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
                        Decline
                      </button>
                      <button type="button" onClick={() => decide(r.id, "accept")} style={{ border: 0, background: "var(--fac-primary)", cursor: "pointer", borderRadius: 9, padding: "9px 14px", font: "600 12.5px/1 var(--fac-font-sans)", color: "#fff" }}>
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
