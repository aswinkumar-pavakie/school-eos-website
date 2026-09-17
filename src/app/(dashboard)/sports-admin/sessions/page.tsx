// Sports Admin -> Training sessions. Real data: listTrainingSessions() +
// listMyTeams() (school-wide for this role) -- sorted newest-scheduled-first.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listTrainingSessions } from "@/lib/sports-admin-api";
import { AddSessionPanel } from "./AddSessionPanel";

export default async function SportsAdminSessionsPage() {
  try {
    const sessions = await listTrainingSessions();
    const sorted = [...sessions].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Training sessions</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{sessions.length} sessions across every squad</div>
          </div>
          <AddSessionPanel />
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No training sessions scheduled yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["SQUAD", "SCHEDULED", "VENUE", "FOCUS", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((s, i) => (
              <div key={s.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{s.teamName}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{new Date(s.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{s.venue ?? "—"}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{s.focus ?? "—"}</span>
                <StatusPill label={statusLabel(s.status)} tone={toneOf(s.status)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load training sessions."} />;
  }
}
