// Sports Admin -> Houses & inter-house. Full replication of the design's
// own `houses` screen: real per-house point TOTALS and an "Inter-house
// events" register, both built from the real, already-populated
// merit_point table (house_id/points/reason/awarded_at) -- the same table
// Admin's Student Development module already writes to, newly broadened to
// SPORTS_ADMIN (GET/POST /student-development/merit-points) since it's the
// exact real data model the design's own points-per-house concept needs, no
// fabricated inter-house-event table required. "+ Record points" awards a
// real merit point tied to a house; "Points rules" has no real backing
// table anywhere in this schema (institutional policy, not data) so it's an
// honest static disclosure panel, never a fabricated report.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatTile, TableCard, type TableCell } from "@/components/sports-ui/primitives";
import { InfoPanelButton } from "@/components/sports-ui/InfoPanelButton";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listHouses, listMeritPoints } from "@/lib/sports-admin-api";
import { MeritPointRowActions } from "./MeritPointRowActions";
import { RecordPointsPanel } from "./RecordPointsPanel";

export default async function SportsAdminHousesPage() {
  try {
    const [houses, meritPoints] = await Promise.all([listHouses(), listMeritPoints()]);
    const activeHouses = houses.filter((h) => h.status === "ACTIVE");

    const totalsByHouse = new Map<string, { houseName: string; points: number; playerIds: Set<string> }>();
    for (const h of activeHouses) {
      totalsByHouse.set(h.id, { houseName: h.name, points: 0, playerIds: new Set() });
    }
    for (const mp of meritPoints) {
      if (!mp.houseId) continue;
      const entry = totalsByHouse.get(mp.houseId) ?? { houseName: mp.houseName ?? "—", points: 0, playerIds: new Set<string>() };
      entry.points += mp.points;
      entry.playerIds.add(mp.studentId);
      totalsByHouse.set(mp.houseId, entry);
    }

    const ranked = Array.from(totalsByHouse.entries())
      .map(([houseId, v]) => ({ houseId, houseName: v.houseName, points: v.points, players: v.playerIds.size }))
      .sort((a, b) => b.points - a.points);

    const houseOptions = activeHouses.map((h) => ({ houseId: h.id, houseName: h.name }));
    const eventRows = [...meritPoints]
      .sort((a, b) => (a.awardedAt < b.awardedAt ? 1 : -1))
      .map((mp): { key: string; cells: TableCell[] } => ({
        key: mp.id,
        cells: [
          { kind: "plain", text: mp.reason, bold: true },
          { kind: "plain", text: formatDate(mp.awardedAt), mono: true },
          { kind: "plain", text: `${mp.studentFirstName} ${mp.studentLastName ?? ""}` },
          { kind: "plain", text: mp.houseName ?? "—" },
          { kind: "plain", text: `+${mp.points}`, bold: true, mono: true },
          { kind: "node", node: <MeritPointRowActions meritPoint={mp} houses={houseOptions} /> },
        ],
      }));

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Houses &amp; inter-house</h1>
            <p style={{ margin: 0, marginTop: 8, fontSize: 15, color: "var(--sport-muted-2)" }}>Four houses · points from meets, leagues and tournaments this year</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
            <InfoPanelButton label="Points rules" title="How house points work">
              <p style={{ margin: 0 }}>Points are awarded to a student and credited to their house for a real, named achievement — a match won, a meet placement, or exceptional sporting conduct.</p>
              <p style={{ margin: "10px 0 0" }}>Each award is 1–20 points, logged with a reason and timestamp. There is no fixed points table per event type — the Sports Admin awarding the points sets the amount to fit what was achieved.</p>
            </InfoPanelButton>
            <RecordPointsPanel houses={activeHouses.map((h) => ({ houseId: h.id, houseName: h.name }))} />
          </div>
        </div>

        {ranked.length === 0 ? (
          <p style={{ marginTop: 20, color: "var(--sport-muted-2)" }}>No houses are set up yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
            {ranked.map((h, i) => (
              <StatTile key={h.houseId} label={h.houseName.toUpperCase()} value={`${h.points} pts`} sub={`${i + 1}${["st", "nd", "rd"][i] ?? "th"} · ${h.players} player${h.players === 1 ? "" : "s"}`} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <TableCard
            title="Inter-house events"
            meta={`${eventRows.length} records`}
            columns={["EVENT / REASON", "DATE", "STUDENT", "HOUSE", "POINTS", "MANAGE"]}
            rows={eventRows}
            emptyLabel="No points have been recorded yet."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load house standings."} />;
  }
}
