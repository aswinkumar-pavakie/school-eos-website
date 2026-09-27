"use client";

import { useState } from "react";
import { StatusPill, type PillTone } from "@/components/media-ui/primitives";
import { formatDate, formatMoneySummary } from "@/lib/format";
import type { IndentState, MediaIndent } from "@/lib/media-api";
import { cancelMediaIndentAction } from "./actions";

const STATE_TONE: Record<IndentState, PillTone> = { PENDING: "amber", APPROVED: "green", REJECTED: "red", CANCELLED: "gray" };

export function IndentRow({ indent }: { indent: MediaIndent }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleCancel() {
    if (!indent.approvalRequestId) return;
    if (!confirm(`Cancel the indent for "${indent.itemName}"?`)) return;
    setPending(true);
    setError(undefined);
    const result = await cancelMediaIndentAction(indent.approvalRequestId);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1px", background: "var(--med-panel)", color: "var(--med-body)", borderRadius: 7, padding: "5px 10px" }}>{indent.requestType === "GOODS" ? "CAPITAL EQUIPMENT" : "SERVICE"}</span>
        <span style={{ fontFamily: "var(--med-mono)", fontSize: 13, color: "var(--med-tertiary)" }}>{indent.referenceNo} · raised {formatDate(indent.createdAt)}</span>
        <div style={{ flex: 1 }} />
        <StatusPill label={indent.state} tone={STATE_TONE[indent.state]} />
        {indent.state === "PENDING" && indent.approvalRequestId && (
          <button
            type="button"
            disabled={pending}
            onClick={handleCancel}
            style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid var(--med-border)", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: "var(--med-red)", fontFamily: "inherit" }}
          >
            Cancel
          </button>
        )}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 14 }}>{indent.itemName}</div>
      {indent.description && <div style={{ fontSize: 14.5, color: "var(--med-body)", marginTop: 7 }}>{indent.description}</div>}
      {error && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18, borderTop: "1px solid var(--med-divider)", marginTop: 18, paddingTop: 16 }}>
        <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>AMOUNT</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{indent.estimatedAmountPaise ? formatMoneySummary(indent.estimatedAmountPaise) : "—"}</div></div>
        <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>QUANTITY</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{indent.quantity ?? "—"}</div></div>
        <div><div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>NEEDED BY</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{indent.neededBy ? formatDate(indent.neededBy) : "—"}</div></div>
      </div>
    </div>
  );
}
