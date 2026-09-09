import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMyTeams, listTeamRoster, type TeamRosterMember } from "@/lib/sports-faculty-api";
import { TeamsPanel } from "./TeamsPanel";

export default async function TeamsPage() {
  try {
    const teams = await listMyTeams();
    const rosterResults = await Promise.all(
      teams.map((t) => listTeamRoster(t.id).catch(() => [] as TeamRosterMember[])),
    );
    const rostersByTeam: Record<string, TeamRosterMember[]> = {};
    teams.forEach((t, i) => {
      rostersByTeam[t.id] = rosterResults[i];
    });

    const knownSports = Array.from(new Map(teams.map((t) => [t.sportId, t.sportName])).entries()).map(
      ([id, name]) => ({ id, name }),
    );

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Teams &amp; Roster</h1>
          <p className="mt-1 text-sm text-text-muted">{teams.length} team{teams.length === 1 ? "" : "s"} under your sports.</p>
        </div>
        <TeamsPanel teams={teams} rostersByTeam={rostersByTeam} knownSports={knownSports} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your teams. Nothing was submitted — try again." />;
  }
}
