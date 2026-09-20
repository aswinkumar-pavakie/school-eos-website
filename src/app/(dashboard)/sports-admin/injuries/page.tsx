// Sports Admin -> Injuries & incidents. Pixel-rebuilt from the design's own
// `injuries` screen (columns: CASE, STUDENT, CLASS, DATE, GUARDIAN INFORMED,
// STATUS; META: secondary 'Care protocol', primary '+ Log incident', filter
// Status). Real, dedicated backend this build adds (see migration
// 0023_sports_injuries.sql) -- confirmed genuine gap, no existing table.
// "Care protocol" has no real backing table anywhere in this schema
// (institutional first-aid procedure, not data), so it's an honest static
// disclosure panel. Status filter uses the real INJURY_STATUSES enum
// already backing InjuryRowActions.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { InfoPanelButton } from "@/components/sports-ui/InfoPanelButton";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { INJURY_STATUSES, listInjuries, listSports, type InjuryStatus } from "@/lib/sports-admin-api";
import { AddInjuryPanel } from "./AddInjuryPanel";
import { InjuryRowActions } from "./InjuryRowActions";

const STATUS_LABEL: Record<InjuryStatus, string> = { UNDER_CARE: "Under care", OBSERVATION: "Observation", CLOSED: "Closed" };

export default async function SportsAdminInjuriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  try {
    const [allInjuries, sports] = await Promise.all([listInjuries(), listSports()]);
    const needle = (q ?? "").trim().toLowerCase();
    const injuries = allInjuries
      .filter((i) => !status || i.status === status)
      .filter((i) => !needle || `${i.title} ${i.studentFirstName} ${i.studentLastName ?? ""}`.toLowerCase().includes(needle));

    const rows = injuries.map((i) => {
      const cells: TableCell[] = [
        { kind: "plain", text: i.title, bold: true },
        { kind: "plain", text: `${i.studentFirstName} ${i.studentLastName ?? ""}` },
        { kind: "plain", text: i.gradeName ? `${i.gradeName}${i.sectionName ? " " + i.sectionName : ""}` : "—" },
        { kind: "plain", text: formatDate(i.incidentDate), mono: true },
        { kind: "badge", text: i.guardianInformed ? "Informed" : "Not informed", tone: toneOf(i.guardianInformed ? "confirmed" : "pending") },
        { kind: "node", node: <InjuryRowActions injury={i} /> },
      ];
      return { key: i.id, cells };
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Injuries &amp; incidents</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>{allInjuries.length} case{allInjuries.length === 1 ? "" : "s"} on record</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6, position: "relative" }}>
            <InfoPanelButton label="Care protocol" title="First-aid &amp; care protocol">
              <p style={{ margin: 0 }}>1. Provide immediate first aid at the ground or court.</p>
              <p style={{ margin: "6px 0 0" }}>2. Log the incident here immediately, marking guardian informed once contacted.</p>
              <p style={{ margin: "6px 0 0" }}>3. Keep the case as &quot;Under care&quot; until the student resumes normal activity, then &quot;Observation&quot; while monitoring, then &quot;Closed&quot;.</p>
              <p style={{ margin: "6px 0 0" }}>4. Refer to the school infirmary or a hospital for anything beyond basic first aid.</p>
            </InfoPanelButton>
            <AddInjuryPanel sports={sports} />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search cases by title or student"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="status" defaultValue={status ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All statuses</option>
            {INJURY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Incident register"
            meta={`${injuries.length} of ${allInjuries.length}`}
            columns={["CASE", "STUDENT", "CLASS", "DATE", "GUARDIAN INFORMED", "STATUS"]}
            rows={rows}
            emptyLabel="No injuries or incidents match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load injuries."} />;
  }
}
