// Canteen counter's History screen -- every real charge ever made at this
// counter (canteen_transaction rows, written by the Ledger screen's own
// charge step), newest first, each with its own real line items (what the
// student actually bought -- canteen_transaction_item). Read-only. Rows use
// a native <details>/<summary> to expand -- no client JS needed for "click
// a row to see full details".

import { listCanteenHistory } from "@/lib/canteen-api";
import { formatMoneyDetail } from "@/lib/format";
import { Card } from "@/components/canteen-ui/primitives";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CanteenHistoryPage() {
  const entries = await listCanteenHistory(100).catch(() => []);

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>Ledger History</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
        Every canteen charge made at this counter, newest first. Tap a row for full details.
      </p>

      <Card style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
        {entries.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", font: "500 13.5px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
            No canteen charges yet.
          </div>
        ) : (
          entries.map((e, i) => (
            <details key={e.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--can-divider)" }}>
              <summary
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, font: "600 14px/1.3 var(--can-font-sans)", color: "var(--can-ink)" }}>{e.studentName}</p>
                  <p style={{ margin: 0, marginTop: 2, font: "500 12px/1.3 var(--can-font-mono)", color: "var(--can-tertiary)" }}>
                    {e.admissionNo}
                    {e.gradeName ? ` · ${e.gradeName}${e.sectionName ? `-${e.sectionName}` : ""}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, font: "700 14px/1.3 var(--can-font-mono)", color: "var(--can-red)" }}>-{formatMoneyDetail(e.amountPaise)}</p>
                  <p style={{ margin: 0, marginTop: 2, font: "500 11.5px/1.3 var(--can-font-sans)", color: "var(--can-tertiary)" }}>{formatTimestamp(e.createdAt)}</p>
                </div>
              </summary>
              <div style={{ padding: "0 20px 18px", background: "var(--can-panel)" }}>
                <div style={{ borderRadius: "var(--can-radius-card)", border: "1px solid var(--can-border)", background: "var(--can-white)", padding: "14px 16px" }}>
                  <p style={{ margin: "0 0 8px", font: "700 11px/1 var(--can-font-sans)", letterSpacing: ".07em", color: "var(--can-tertiary)", textTransform: "uppercase" }}>
                    Items purchased
                  </p>
                  {e.items.length === 0 ? (
                    <p style={{ margin: 0, font: "400 13px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>No item breakdown recorded for this charge.</p>
                  ) : (
                    e.items.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", font: "500 13.5px/1.3 var(--can-font-sans)", color: "var(--can-body)" }}>
                        <span>{it.productName} × {it.quantity}</span>
                        <span className="can-font-mono" style={{ fontWeight: 600, color: "var(--can-ink)" }}>{formatMoneyDetail(it.lineTotalPaise)}</span>
                      </div>
                    ))
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--can-divider)", font: "600 13.5px/1.3 var(--can-font-sans)" }}>
                    <span style={{ color: "var(--can-body-muted)" }}>Items total</span>
                    <span className="can-font-mono">{formatMoneyDetail(e.itemsTotalPaise)}</span>
                  </div>
                  {e.itemsTotalPaise !== e.amountPaise && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, font: "600 13.5px/1.3 var(--can-font-sans)", color: "var(--can-red-text)" }}>
                      <span>Charged (adjusted)</span>
                      <span className="can-font-mono">{formatMoneyDetail(e.amountPaise)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, font: "500 12.5px/1.3 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
                    <span>Balance after</span>
                    <span className="can-font-mono">{formatMoneyDetail(e.balanceAfterPaise)}</span>
                  </div>
                  {e.performedByName && (
                    <div style={{ marginTop: 8, font: "400 12px/1.3 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
                      Served by {e.performedByName}
                    </div>
                  )}
                </div>
              </div>
            </details>
          ))
        )}
      </Card>
    </div>
  );
}
