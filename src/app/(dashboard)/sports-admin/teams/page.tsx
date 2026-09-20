// Sports Admin -> Teams & squads -- pixel-rebuilt from the design's own
// `teams` generic CRUD screen (Sports Admin School.dc.html EDITABLE.teams:
// columns ['SQUAD','IN-CHARGE · CAPTAIN','AGE GROUP','PLAYERS','STATUS',
// 'MANAGE']). Real data only: team.status is really just ACTIVE/INACTIVE
// (confirmed via a live DB check-constraint read) -- the design's own mock
// data uses fabricated 'confirmed'/'pending' values that don't exist in this
// schema, so this uses the real values in that same STATUS column instead of
// inventing a Confirmed/Pending distinction with nothing behind it.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { AuthExpiredError } from "@/lib/api";
import { getStudent, listCoaches, listMyTeams, listSportCategories, listSports, listTeamRoster, type SportCategory } from "@/lib/sports-admin-api";
import { AddTeamPanel } from "./AddTeamPanel";

export default async function SportsAdminTeamsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; sport?: string; group?: string }> }) {
  const { status, q, sport, group } = await searchParams;
  try {
    const [allTeams, coaches, sports] = await Promise.all([listMyTeams(), listCoaches(), listSports()]);
    const sportById = new Map(sports.map((s) => [s.id, s.name]));
    let byStatus = status ? allTeams.filter((t) => t.status === status) : allTeams;
    if (sport) byStatus = byStatus.filter((t) => t.sportId === sport);

    const [rosterCountsAll, categoriesBySport, captainsAll] = await Promise.all([
      Promise.all(byStatus.map((t) => listTeamRoster(t.id).then((r) => r.length).catch(() => 0))),
      Promise.all(sports.map((s) => listSportCategories(s.id).then((cats) => [s.id, cats] as const).catch(() => [s.id, [] as SportCategory[]] as const))),
      Promise.all(byStatus.map((t) => (t.captainStudentId ? getStudent(t.captainStudentId).catch(() => null) : Promise.resolve(null)))),
    ]);
    const categoryById = new Map(categoriesBySport.flatMap(([, cats]) => cats).map((c) => [c.id, c]));
    const ageGroupOptions = Array.from(new Set(Array.from(categoryById.values()).map((c) => c.ageGroup ?? c.name).filter(Boolean))) as string[];
    ageGroupOptions.sort();

    const needle = (q ?? "").trim().toLowerCase();
    const kept = byStatus
      .map((team, i) => ({ team, rosterCount: rosterCountsAll[i]!, captain: captainsAll[i] }))
      .filter(({ team }) => {
        if (!group) return true;
        const category = team.sportCategoryId ? categoryById.get(team.sportCategoryId) : undefined;
        return (category?.ageGroup ?? category?.name) === group;
      })
      .filter(({ team, captain }) => {
        if (!needle) return true;
        const category = team.sportCategoryId ? categoryById.get(team.sportCategoryId) : undefined;
        const haystack = `${team.name} ${sportById.get(team.sportId) ?? ""} ${category?.ageGroup ?? category?.name ?? ""} ${captain ? `${captain.firstName} ${captain.lastName ?? ""}` : ""}`.toLowerCase();
        return haystack.includes(needle);
      });
    const filtered = kept.map((k) => k.team);

    const coachById = new Map(coaches.map((c) => [c.id, c.fullName]));

    const rows = kept.map(({ team, rosterCount, captain }) => {
      const coachName = team.coachId ? coachById.get(team.coachId) ?? "—" : "—";
      const captainLabel = captain ? `${captain.firstName} ${captain.lastName ?? ""}`.trim() : "No captain set";
      const category = team.sportCategoryId ? categoryById.get(team.sportCategoryId) : undefined;
      const ageGroup = category?.ageGroup ?? category?.name ?? "—";
      const cells: TableCell[] = [
        { kind: "plain", text: team.name, bold: true },
        { kind: "plain", text: `${coachName} · ${captainLabel}` },
        { kind: "plain", text: ageGroup },
        { kind: "plain", text: String(rosterCount), mono: true },
        { kind: "badge", text: team.status === "ACTIVE" ? "Active" : "Inactive", tone: team.status === "ACTIVE" ? "good" : "mute" },
      ];
      return { key: team.id, cells };
    });

    const exportRows = kept.map(({ team, rosterCount, captain }) => {
      const coachName = team.coachId ? coachById.get(team.coachId) ?? "—" : "—";
      const captainLabel = captain ? `${captain.firstName} ${captain.lastName ?? ""}`.trim() : "No captain set";
      const category = team.sportCategoryId ? categoryById.get(team.sportCategoryId) : undefined;
      return [team.name, coachName, captainLabel, category?.ageGroup ?? category?.name ?? "—", rosterCount, team.status === "ACTIVE" ? "Active" : "Inactive"];
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Teams &amp; squads</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Squads with named captains and PT in-charge</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              filename="squad-register.csv"
              headers={["Squad", "In-charge", "Captain", "Age group", "Players", "Status"]}
              rows={exportRows}
            />
            <AddTeamPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search squads by name, discipline or age group"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="sport" defaultValue={sport ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All sports</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="group" defaultValue={group ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All age groups</option>
            {ageGroupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
          <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 10, padding: 4 }}>
            {[
              { label: "All", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ].map((t) => (
              <Link
                key={t.label}
                href={`/sports-admin/teams?${new URLSearchParams({ ...(t.value ? { status: t.value } : {}), ...(q ? { q } : {}), ...(sport ? { sport } : {}), ...(group ? { group } : {}) }).toString()}`}
                style={{
                  textDecoration: "none",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: (status ?? "") === t.value ? "var(--sport-navy)" : "transparent",
                  color: (status ?? "") === t.value ? "#fff" : "var(--sport-body)",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Squad register"
            meta={`${filtered.length} of ${allTeams.length}`}
            columns={["SQUAD", "IN-CHARGE · CAPTAIN", "AGE GROUP", "PLAYERS", "STATUS"]}
            rows={rows}
            rowHref={(id) => `/sports-admin/teams/${id}`}
            emptyLabel="No squads match this filter."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load teams."} />;
  }
}
