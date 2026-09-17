// Sports Admin -> Houses & inter-house. Real getHousePerformance() (matches
// played/won per house, aggregated from real fixture results) -- no house
// CRUD exists in this backend (houses themselves are Admin/hostel-side master
// data), so this screen is read-only performance standings, matching what
// the backend actually offers.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/sports-ui/primitives";
import { formatPercentOf } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getHousePerformance } from "@/lib/sports-admin-api";

export default async function SportsAdminHousesPage() {
  try {
    const houses = await getHousePerformance();
    const sorted = [...houses].sort((a, b) => b.wins - a.wins);

    return (
      <div className="sports-scope">
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Houses &amp; inter-house</div>
          <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>Standings from recorded fixture results</div>
        </div>

        {sorted.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No house-linked fixture results recorded yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "0.4fr 1.4fr 0.8fr 0.8fr 0.8fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["#", "HOUSE", "MATCHES", "WINS", "WIN RATE"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((h, i) => (
              <div key={h.houseId} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "0.4fr 1.4fr 0.8fr 0.8fr 0.8fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-tertiary)" }}>{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{h.houseName}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{h.matches}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, fontWeight: 700, color: "var(--sport-green)" }}>{h.wins}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{formatPercentOf(h.wins, h.matches)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load house standings."} />;
  }
}
