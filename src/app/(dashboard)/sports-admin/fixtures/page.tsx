// Sports Admin -> Fixtures & tournaments -- see FixturesPanel.tsx's own
// header comment for why this stays tournament-grouped rather than the
// design's flat table (real fixtures are between two of the school's own
// squads, not an external opponent the design's mock data assumes).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { formatDate, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listFixtures, listMyTeams, listSports, listTournaments } from "@/lib/sports-admin-api";
import { CreateTournamentPanel, TournamentCard } from "./FixturesPanel";

const LEVELS = ["INTER_HOUSE", "INTER_SCHOOL", "BLOCK", "DISTRICT", "STATE", "NATIONAL"];

export default async function SportsAdminFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; level?: string; upcoming?: string }>;
}) {
  const { q, sport, level, upcoming } = await searchParams;
  try {
    const [allTournaments, fixtures, teams, sports] = await Promise.all([
      listTournaments(),
      listFixtures(),
      listMyTeams(),
      listSports(),
    ]);
    const now = Date.now();
    const needle = (q ?? "").trim().toLowerCase();
    const tournaments = allTournaments
      .filter((t) => !sport || t.sportId === sport)
      .filter((t) => !level || t.level === level)
      .filter((t) => !upcoming || new Date(t.endDate).getTime() >= now)
      .filter((t) => !needle || `${t.name} ${t.sportName} ${t.venue ?? ""}`.toLowerCase().includes(needle));
    const sorted = [...tournaments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const exportRows = sorted.flatMap((t) =>
      fixtures
        .filter((f) => f.tournamentId === t.id)
        .map((f) => [t.name, t.sportName, statusLabel(t.level), formatDate(f.scheduledAt), f.venue ?? t.venue ?? "—", statusLabel(f.status)]),
    );

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Fixtures &amp; tournaments</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Inter-school and district matches for the current term</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              filename="fixture-list.csv"
              headers={["Tournament", "Sport", "Level", "Date", "Venue", "Status"]}
              rows={exportRows}
            />
            <CreateTournamentPanel sports={sports} />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search fixtures by tournament, sport or venue"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="sport" defaultValue={sport ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All sports</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="level" defaultValue={level ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{statusLabel(l)}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sport-body)" }}>
            <input type="checkbox" name="upcoming" value="1" defaultChecked={!!upcoming} />
            Upcoming only
          </label>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 16 }}><EmptyPanel label="No tournaments match this search." /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
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
