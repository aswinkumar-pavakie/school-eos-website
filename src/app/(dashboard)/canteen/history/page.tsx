// Canteen counter's History screen -- every real charge ever made at this
// counter (canteen_transaction rows, written by the Ledger screen's own
// charge step), newest first. Read-only. Restyled onto the --can-* token
// set (canteen-theme.css) to match the rest of the module's new Faculty-
// style visual system.

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

const th: React.CSSProperties = { padding: "13px 20px", font: "700 11px/1 var(--can-font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--can-tertiary)" };
const td: React.CSSProperties = { padding: "14px 20px", borderTop: "1px solid var(--can-divider)" };

export default async function CanteenHistoryPage() {
  const entries = await listCanteenHistory(100).catch(() => []);

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>History</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
        Every canteen charge made at this counter, newest first.
      </p>

      <Card style={{ marginTop: 24, padding: 0, overflow: "hidden" }}>
        {entries.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", font: "500 13.5px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
            No canteen charges yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--can-panel)" }}>
                <th style={th}>Student</th>
                <th style={th}>Class</th>
                <th style={{ ...th, textAlign: "right" }}>Amount</th>
                <th style={{ ...th, textAlign: "right" }}>Balance after</th>
                <th style={th}>When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={td}>
                    <p style={{ margin: 0, font: "600 14px/1.3 var(--can-font-sans)", color: "var(--can-ink)" }}>{e.studentName}</p>
                    <p style={{ margin: 0, marginTop: 2, font: "500 12px/1.3 var(--can-font-mono)", color: "var(--can-tertiary)" }}>{e.admissionNo}</p>
                  </td>
                  <td style={{ ...td, font: "500 13.5px/1 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
                    {e.gradeName ? `${e.gradeName}${e.sectionName ? `-${e.sectionName}` : ""}` : "—"}
                  </td>
                  <td style={{ ...td, textAlign: "right", font: "700 13.5px/1 var(--can-font-mono)", color: "var(--can-red)" }}>
                    -{formatMoneyDetail(e.amountPaise)}
                  </td>
                  <td style={{ ...td, textAlign: "right", font: "500 13.5px/1 var(--can-font-mono)", color: "var(--can-ink)" }}>
                    {formatMoneyDetail(e.balanceAfterPaise)}
                  </td>
                  <td style={{ ...td, font: "500 12.5px/1.3 var(--can-font-sans)", color: "var(--can-body-muted)" }}>{formatTimestamp(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
