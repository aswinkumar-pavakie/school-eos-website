import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { formatDate, orDash, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listEquipmentIndents } from "@/lib/sports-admin-api";
import { AddIndentPanel } from "./AddIndentPanel";

export default async function SportsAdminIndentsPage() {
  try {
    const indents = await listEquipmentIndents();
    const sorted = [...indents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Equipment indents</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{indents.length} indents raised</div>
          </div>
          <AddIndentPanel />
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No indents raised yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 0.6fr 0.9fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["REF NO.", "ITEM", "QTY", "NEEDED BY", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((ind, i) => (
              <div key={ind.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 0.6fr 0.9fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{ind.referenceNo}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{ind.itemName}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{orDash(ind.quantity)}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{formatDate(ind.neededBy)}</span>
                <StatusPill label={statusLabel(ind.state)} tone={toneOf(ind.state)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load indents."} />;
  }
}
