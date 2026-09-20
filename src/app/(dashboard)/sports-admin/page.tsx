// Sports Admin -- Dashboard. Pixel-rebuilt from the design's own `isDashboard`
// screen (Sports Admin School.dc.html STATIC.dashboard): personalized
// greeting, 3 stat tiles, "Today on the ground" / "Needs attention"
// two-column grid. The design's own version of the last two panels is
// entirely hardcoded (`todaySessions`/`flags` arrays, confirmed by direct
// read of the mock) -- rebuilt here against real data instead: today's real
// training sessions + fixtures, and real pending counts (OD requests,
// indents, overdue equipment) rather than invented "kit not returned" style
// copy.

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatTile } from "@/components/sports-ui/primitives";
import { ACCESS_TOKEN_COOKIE, AuthExpiredError } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { ExportDaySheetButton } from "./ExportDaySheetButton";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default async function SportsAdminDashboardPage() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const meRes = accessToken
      ? await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })
      : null;
    const me = meRes?.ok ? ((await meRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }) : null;
    const firstName = me?.data.person.firstName ?? "";

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

    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const daySheetRows = [
      ...todaySessions.map((s) => ({ time: formatTime(s.scheduledAt), title: `${s.teamName} training`, venue: s.venue ?? "—", kind: "Session" as const })),
      ...todayFixtures.map((f) => ({ time: formatTime(f.scheduledAt), title: f.round ?? "Fixture", venue: f.venue ?? "—", kind: "Fixture" as const })),
    ];
    const dateSlug = new Date().toISOString().slice(0, 10);

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>
              {greeting}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p style={{ margin: 0, marginTop: 8, fontSize: 15, color: "var(--sport-muted-2)" }}>Sports desk · Pavakie Public School · {today}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportDaySheetButton rows={daySheetRows} dateLabel={dateSlug} />
            <Link
              href="/sports-admin/students"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                height: 40,
                padding: "0 18px",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 700,
                background: "var(--sport-primary)",
                color: "#fff",
              }}
            >
              + Manage players
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 26 }}>
          <StatTile label="PLAYERS ON ROLL" value={totalPlayers} sub={`Across ${sports.length} discipline${sports.length === 1 ? "" : "s"}`} />
          <StatTile label="SQUADS ACTIVE" value={activeTeams} sub={`of ${teams.length} total squads`} />
          <StatTile label="PT STAFF ON DUTY" value={`${activeCoaches} / ${coaches.length}`} sub="Coaches & PT staff" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16, marginTop: 24 }}>
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "var(--sport-heading)" }}>Today on the ground</h2>
            {todaySessions.length === 0 && todayFixtures.length === 0 ? (
              <EmptyPanel label="Nothing scheduled today." />
            ) : (
              <div>
                {todaySessions.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 14, borderBottom: i < todaySessions.length - 1 || todayFixtures.length > 0 ? "1px solid var(--sport-divider)" : undefined, marginBottom: 14 }}>
                    <div style={{ fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)", width: 92 }}>{formatTime(s.scheduledAt)}</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>{s.teamName} training</div>
                      <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{s.venue ?? "—"}</div>
                    </div>
                  </div>
                ))}
                {todayFixtures.map((f, i) => (
                  <div key={f.id} style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 14, borderBottom: i < todayFixtures.length - 1 ? "1px solid var(--sport-divider)" : undefined, marginBottom: 14 }}>
                    <div style={{ fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)", width: 92 }}>{formatTime(f.scheduledAt)}</div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>{f.round ?? "Fixture"}</div>
                      <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{f.venue ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "var(--sport-heading)" }}>Needs attention</h2>
              <span style={{ fontSize: 13, color: "var(--sport-tertiary-2)" }}>{pendingOd + pendingIndents + overdueIssues.length} flags</span>
            </div>
            {pendingOd === 0 && pendingIndents === 0 && overdueIssues.length === 0 ? (
              <EmptyPanel label="Nothing needs attention right now." />
            ) : (
              <div>
                {pendingOd > 0 && (
                  <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 14, borderBottom: "1px solid var(--sport-divider)", marginBottom: 14 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>OD requests awaiting Principal</div>
                    </div>
                    <div style={{ minWidth: 34, height: 30, padding: "0 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--sport-border)", color: "var(--sport-heading)", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingOd}</div>
                  </div>
                )}
                {pendingIndents > 0 && (
                  <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 14, borderBottom: "1px solid var(--sport-divider)", marginBottom: 14 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>Equipment indents pending</div>
                    </div>
                    <div style={{ minWidth: 34, height: 30, padding: "0 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--sport-border)", color: "var(--sport-heading)", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingIndents}</div>
                  </div>
                )}
                {overdueIssues.length > 0 && (
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>Equipment overdue for return</div>
                    </div>
                    <div style={{ minWidth: 34, height: 30, padding: "0 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--sport-border)", color: "var(--sport-heading)", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{overdueIssues.length}</div>
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
