// Sports Admin -> Team/Squad detail -- pixel-rebuilt from the design's own
// squad-detail screen. Real roster + coach data only.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/sports-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { getTeam, listCoaches, listTeamRoster } from "@/lib/sports-admin-api";
import { AddRosterMemberPanel, AssignCoachPanel, RosterList } from "./RosterPanel";

export default async function SportsAdminTeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  try {
    const [team, roster, coaches] = await Promise.all([getTeam(teamId), listTeamRoster(teamId), listCoaches()]);
    const activeRoster = roster.filter((m) => m.status === "ACTIVE");
    const coachName = team.coachId ? coaches.find((c) => c.id === team.coachId)?.fullName ?? "—" : null;

    return (
      <div className="sports-scope">
        <Link href="/sports-admin/teams" style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none" }}>
          ← Teams &amp; squads
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginTop: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>{team.name}</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>
              {team.sportName} · {activeRoster.length} active player{activeRoster.length === 1 ? "" : "s"}
              {coachName ? ` · Coach: ${coachName}` : " · No coach assigned"}
            </div>
          </div>
          <StatusPill label={team.status === "ACTIVE" ? "Active" : "Inactive"} tone={team.status === "ACTIVE" ? "good" : "mute"} />
        </div>

        <div style={{ marginTop: 24 }}>
          <AssignCoachPanel teamId={team.id} currentCoachId={team.coachId} coaches={coaches} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 22, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-heading)", marginBottom: 12 }}>Roster</div>
            <RosterList teamId={team.id} roster={roster} />
          </div>
          <AddRosterMemberPanel teamId={team.id} />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this squad."} />;
  }
}
