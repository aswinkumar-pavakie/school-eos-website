import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { formatDate, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listOdRequests } from "@/lib/sports-admin-api";
import { AddOdRequestPanel } from "./AddOdRequestPanel";

export default async function SportsAdminOdPage() {
  try {
    const requests = await listOdRequests();
    const sorted = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>On-duty requests</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{requests.length} requests across every squad</div>
          </div>
          <AddOdRequestPanel />
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No OD requests yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["SQUAD", "REASON", "EVENT DATE", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((r, i) => (
              <div key={r.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{r.teamName}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{r.reason}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{formatDate(r.eventDate)}</span>
                <StatusPill label={statusLabel(r.state)} tone={toneOf(r.state)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load OD requests."} />;
  }
}
