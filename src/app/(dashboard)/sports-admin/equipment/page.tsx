import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill } from "@/components/sports-ui/primitives";
import { orDash } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listEquipmentCatalog, listMyTeams, listOutstandingIssues, listOverdueIssues, listSports } from "@/lib/sports-admin-api";
import { AddEquipmentPanel } from "./AddEquipmentPanel";
import { IssueEquipmentPanel } from "./IssueEquipmentPanel";
import { OutstandingIssuesPanel } from "./OutstandingIssuesPanel";

export default async function SportsAdminEquipmentPage() {
  try {
    const [items, sports, outstanding, overdue, teams] = await Promise.all([
      listEquipmentCatalog(),
      listSports(),
      listOutstandingIssues(),
      listOverdueIssues(),
      listMyTeams(),
    ]);
    const sportById = new Map(sports.map((s) => [s.id, s.name]));
    const overdueIds = new Set(overdue.map((o) => o.id));

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Equipment</div>
            <div style={{ fontSize: 14.5, color: "var(--sport-tertiary)", marginTop: 8 }}>
              {items.length} catalog items{overdue.length > 0 ? ` · ${overdue.length} overdue for return` : ""}
            </div>
          </div>
          <AddEquipmentPanel />
        </div>

        {items.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="No equipment items in the catalog yet." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, marginTop: 22, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.7fr 0.7fr 0.8fr 0.7fr", gap: 14, padding: "14px 20px", borderBottom: "1px solid var(--sport-divider)" }}>
              {["ITEM", "SPORT", "AVAILABLE", "TOTAL", "CONDITION", ""].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary)" }}>{h}</span>
              ))}
            </div>
            {items.map((it, i) => (
              <div key={it.id} className="sport-row-hover" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.7fr 0.7fr 0.8fr 0.7fr", gap: 14, padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{it.name}</span>
                <span style={{ fontSize: 13.5, color: "var(--sport-body)" }}>{it.sportId ? sportById.get(it.sportId) ?? "—" : "General"}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: it.quantityAvailable === 0 ? "var(--sport-red)" : "var(--sport-ink)" }}>{it.quantityAvailable}</span>
                <span style={{ fontFamily: "var(--sport-mono)", fontSize: 13, color: "var(--sport-body)" }}>{it.quantityTotal}</span>
                <StatusPill label={orDash(it.condition)} tone={it.condition === "DAMAGED" || it.condition === "POOR" ? "bad" : it.condition === "FAIR" ? "warn" : "good"} />
                <IssueEquipmentPanel item={it} />
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-heading)", marginTop: 30, marginBottom: 12 }}>Currently issued</div>
        <OutstandingIssuesPanel issues={outstanding} overdueIds={overdueIds} teams={teams} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load equipment."} />;
  }
}
