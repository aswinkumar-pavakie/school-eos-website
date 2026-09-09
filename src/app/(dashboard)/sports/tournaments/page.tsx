import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import {
  getFixtureResult,
  getHousePerformance,
  listFixtures,
  listMyTeams,
  listTournaments,
  type FixtureResult,
} from "@/lib/sports-faculty-api";
import { TournamentsPanel } from "./TournamentsPanel";

export default async function TournamentsPage() {
  try {
    const [tournaments, fixtures, teams, housePerformance] = await Promise.all([
      listTournaments(),
      listFixtures(),
      listMyTeams(),
      getHousePerformance().catch(() => []),
    ]);

    const completedFixtures = fixtures.filter((f) => f.status === "COMPLETED");
    const resultResults = await Promise.all(
      completedFixtures.map((f) => getFixtureResult(f.id).catch(() => null as FixtureResult | null)),
    );
    const resultsByFixture: Record<string, FixtureResult | null> = {};
    completedFixtures.forEach((f, i) => {
      resultsByFixture[f.id] = resultResults[i];
    });

    const fixturesByTournament: Record<string, typeof fixtures> = {};
    for (const f of fixtures) {
      (fixturesByTournament[f.tournamentId] ??= []).push(f);
    }

    const knownSports = Array.from(new Map(teams.map((t) => [t.sportId, t.sportName])).entries()).map(
      ([id, name]) => ({ id, name }),
    );

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Tournaments &amp; Fixtures</h1>
          <p className="mt-1 text-sm text-text-muted">{tournaments.length} tournament{tournaments.length === 1 ? "" : "s"}.</p>
        </div>
        <TournamentsPanel
          tournaments={tournaments}
          fixturesByTournament={fixturesByTournament}
          resultsByFixture={resultsByFixture}
          teams={teams}
          knownSports={knownSports}
          housePerformance={housePerformance}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load tournaments. Nothing was submitted — try again." />;
  }
}
