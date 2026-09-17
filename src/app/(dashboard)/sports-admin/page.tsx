// Sports Admin -- Dashboard. Pixel-rebuilt from the design's own `isDashboard`
// screen (brain/Copy of Sports admin school dashboard design/Sports Admin
// School.dc.html): 3 stat tiles + "Today on the ground" / "Needs attention"
// two-column grid. The design's own version of these two panels is entirely
// hardcoded (`todaySessions`/`flags` arrays, confirmed by direct read of the
// mock) -- rebuilt here against real data instead: today's real training
// sessions + fixtures, and real pending counts (OD requests, indents,
// overdue equipment) rather than invented "kit not returned" style copy.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatTile } from "@/components/sports-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import {
  listCoaches,
  listFixtures,
  listMyTeams,
  listOdRequests,
  listEquipmentIndents,
  listOverdueIssues,
  listSports,
  listSportsProfiles,
  listTrainingSessions,
} from "@/lib/sports-admin-api";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default async function SportsAdminDashboardPage() {
  try {
    const [teams, coaches, sports, sessions, fixtures, odRequests, indents, overdueIssues] = await Promise.all([
      listMyTeams(),
      listCoaches(),
      listSports(),
      listTrainingSessions(),
      listFixtures(),
      listOdRequests(),
      listEquipmentIndents(),
      listOverdueIssues(),
    ]);

    const profilesPerSport = await Promise.all(sports.map((s) => listSportsProfiles(s.id).catch(() => [])));
    const totalPlayers = new Set(profilesPerSport.flat().map((p) => p.studentId)).size;

    const activeTeams = teams.filter((t) => t.status === "ACTIVE").length;
    const activeCoaches = coaches.filter((c) => c.status === "ACTIVE").length;

    const todaySessions = sessions.filter((s) => isToday(s.scheduledAt));
    const todayFixtures = fixtures.filter((f) => isToday(f.scheduledAt));
    const pendingOd = odRequests.filter((r) => r.state === "PENDING").length;
    const pendingIndents = indents.filter((i) => i.state === "PENDING").length;

    return (
      <div className="sports-scope">
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Sports desk</div>
          <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>Pavakie Public School · school-wide sports oversight</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, marginTop: 26 }}>
          <StatTile label="Players on roll" value={totalPlayers} sub={`Across ${sports.length} discipline${sports.length === 1 ? "" : "s"}`} />
          <StatTile label="Squads active" value={activeTeams} sub={`of ${teams.length} total squads`} />
          <StatTile label="PT staff on duty" value={`${activeCoaches}/${coaches.length}`} sub="Coaches & PT staff" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)", marginBottom: 12 }}>Today on the ground</div>
            {todaySessions.length === 0 && todayFixtures.length === 0 ? (
              <EmptyPanel label="Nothing scheduled today." />
            ) : (
              <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14 }}>
                {todaySessions.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{s.teamName} training</div>
                      <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 2 }}>{formatTime(s.scheduledAt)}{s.venue ? ` · ${s.venue}` : ""}</div>
                    </div>
                  </div>
                ))}
                {todayFixtures.map((f, i) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i > 0 || todaySessions.length > 0 ? "1px solid var(--sport-divider)" : undefined }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{f.round ?? "Fixture"}</div>
                      <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 2 }}>{formatTime(f.scheduledAt)}{f.venue ? ` · ${f.venue}` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)", marginBottom: 12 }}>Needs attention</div>
            {pendingOd === 0 && pendingIndents === 0 && overdueIssues.length === 0 ? (
              <EmptyPanel label="Nothing needs attention right now." />
            ) : (
              <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14 }}>
                {pendingOd > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>OD requests awaiting Principal</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-amber)" }}>{pendingOd}</div>
                  </div>
                )}
                {pendingIndents > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: pendingOd > 0 ? "1px solid var(--sport-divider)" : undefined }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>Equipment indents pending</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-amber)" }}>{pendingIndents}</div>
                  </div>
                )}
                {overdueIssues.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: pendingOd > 0 || pendingIndents > 0 ? "1px solid var(--sport-divider)" : undefined }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>Equipment overdue for return</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-red)" }}>{overdueIssues.length}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the sports dashboard."} />;
  }
}
