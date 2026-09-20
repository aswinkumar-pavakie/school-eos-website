// Sports Admin -> Equipment -- pixel-rebuilt from the design's own
// `inventory` screen (EDITABLE.inventory: columns ['ITEM','CATEGORY',
// 'TOTAL','ISSUED','AVAILABLE','CONDITION','STORE','MANAGE']). STORE (a
// shelf/location code) isn't a real field on this schema's equipment row,
// so it stays an honest dash -- everything else, including the real
// issue/return flow behind MANAGE, is real.

import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { AuthExpiredError } from "@/lib/api";
import { listEquipmentCatalog, listMyTeams, listOutstandingIssues, listOverdueIssues, listSports } from "@/lib/sports-admin-api";
import { AddEquipmentPanel } from "./AddEquipmentPanel";
import { EquipmentRowActions } from "./EquipmentRowActions";
import { IssueEquipmentPanel } from "./IssueEquipmentPanel";
import { OutstandingIssuesPanel } from "./OutstandingIssuesPanel";

const th: CSSProperties = { padding: "13px 26px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "var(--sport-tertiary-2)", whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "16px 26px", fontSize: 14, color: "var(--sport-body)", verticalAlign: "middle", whiteSpace: "nowrap" };

const CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"];

export default async function SportsAdminEquipmentPage({ searchParams }: { searchParams: Promise<{ q?: string; condition?: string }> }) {
  const { q, condition } = await searchParams;
  try {
    const [allItems, sports, outstanding, overdue, teams] = await Promise.all([
      listEquipmentCatalog(),
      listSports(),
      listOutstandingIssues(),
      listOverdueIssues(),
      listMyTeams(),
    ]);
    const sportById = new Map(sports.map((s) => [s.id, s.name]));
    const overdueIds = new Set(overdue.map((o) => o.id));
    const needle = (q ?? "").trim().toLowerCase();
    const items = allItems
      .filter((it) => !condition || it.condition === condition)
      .filter((it) => !needle || it.name.toLowerCase().includes(needle));

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Equipment</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Every item in the sports store — stock, issue and condition</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              label="Stock audit"
              filename="equipment-stock-audit.csv"
              headers={["Item", "Category", "Total", "Issued", "Available", "Condition"]}
              rows={items.map((it) => [it.name, it.sportId ? sportById.get(it.sportId) ?? "—" : "General", it.quantityTotal, it.quantityTotal - it.quantityAvailable, it.quantityAvailable, it.condition ?? "—"])}
            />
            <AddEquipmentPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search equipment by item"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select
            name="condition"
            defaultValue={condition ?? ""}
            style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          >
            <option value="">All conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c[0]}
                {c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "22px 26px 16px" }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--sport-heading)" }}>Equipment register</h2>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--sport-tertiary-2)" }}>{items.length} of {allItems.length} items{overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}</span>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 26, fontSize: 13.5, color: "var(--sport-tertiary-3)" }}>No equipment matches this filter.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                <thead>
                  <tr>
                    {["ITEM", "CATEGORY", "TOTAL", "ISSUED", "AVAILABLE", "CONDITION", "STORE", "MANAGE"].map((h) => (
                      <th key={h} style={{ ...th, textAlign: h === "MANAGE" ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} className="sport-row-hover" style={{ borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined }}>
                      <td style={td}><span style={{ fontWeight: 700, color: "var(--sport-ink)" }}>{it.name}</span></td>
                      <td style={td}>{it.sportId ? sportById.get(it.sportId) ?? "—" : "General"}</td>
                      <td style={{ ...td, fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)" }}>{it.quantityTotal}</td>
                      <td style={{ ...td, fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)" }}>{it.quantityTotal - it.quantityAvailable}</td>
                      <td style={td}><span style={{ fontWeight: 700, color: it.quantityAvailable === 0 ? "var(--sport-red)" : "var(--sport-ink)" }}>{it.quantityAvailable}</span></td>
                      <td style={td}><StatusPill label={it.condition ?? "—"} tone={it.condition === "DAMAGED" || it.condition === "POOR" ? "bad" : it.condition === "FAIR" ? "warn" : "good"} /></td>
                      <td style={{ ...td, fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)" }}>—</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
                          <EquipmentRowActions item={it} />
                          <IssueEquipmentPanel item={it} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)", marginTop: 30, marginBottom: 12 }}>Currently issued</div>
        <OutstandingIssuesPanel issues={outstanding} overdueIds={overdueIds} teams={teams} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load equipment."} />;
  }
}
