import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/sports-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { listFixtures, listMyTeams, listSports, listTournaments } from "@/lib/sports-admin-api";
import { CreateTournamentPanel, TournamentCard } from "./FixturesPanel";

export default async function SportsAdminFixturesPage() {
  try {
    const [tournaments, fixtures, teams, sports] = await Promise.all([
      listTournaments(),
      listFixtures(),
      listMyTeams(),
      listSports(),
    ]);
    const sorted = [...tournaments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Fixtures &amp; tournaments</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>{tournaments.length} tournaments · {fixtures.length} fixtures</div>
          </div>
          <CreateTournamentPanel sports={sports} />
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No tournaments yet." /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
            {sorted.map((t) => (
              <TournamentCard key={t.id} tournament={t} fixtures={fixtures.filter((f) => f.tournamentId === t.id)} teams={teams} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load fixtures."} />;
  }
}
