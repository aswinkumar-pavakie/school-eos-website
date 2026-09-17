import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/sports-ui/primitives";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listAchievements } from "@/lib/sports-admin-api";
import { AddAchievementPanel } from "./AddAchievementPanel";

export default async function SportsAdminAchievementsPage() {
  try {
    const achievements = await listAchievements();
    const sorted = [...achievements].sort((a, b) => new Date(b.awardedOn).getTime() - new Date(a.awardedOn).getTime());

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Achievements</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{achievements.length} recognitions across every sport</div>
          </div>
          <AddAchievementPanel />
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No achievements recorded yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["STUDENT", "SQUAD / TOURNAMENT", "PLACEMENT", "DATE"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((a, i) => (
              <div key={a.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{a.studentFirstName} {a.studentLastName}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{a.teamName ?? a.tournamentName ?? "—"}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--sport-amber)" }}>{a.placement}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{formatDate(a.awardedOn)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load achievements."} />;
  }
}
