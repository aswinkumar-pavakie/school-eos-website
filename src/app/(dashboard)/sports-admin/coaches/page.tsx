// Sports Admin -> Coaches & PT staff -- pixel-rebuilt from the design's own
// `coaches` screen (EDITABLE.coaches: columns ['STAFF','DESIGNATION ·
// DISCIPLINE','CLASSES HANDLED','CONTACT','DUTY']; META: secondary 'Duty
// roster', filter 'Duty'). DESIGNATION and CLASSES HANDLED aren't real
// fields on this schema's coach row (it only has qualification, not a
// designation/classes-taught pair), so those stay honest dashes. DUTY is
// now real: derived from whether a coach has a real training session
// scheduled today (listTrainingSessions().conductedByCoachId), not a
// fabricated status field -- the same convention used everywhere else in
// this build (real derivation over invented data).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { InfoPanelButton } from "@/components/sports-ui/InfoPanelButton";
import { orDash, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listCoaches, listMyTeams, listTrainingSessions } from "@/lib/sports-admin-api";
import { AddCoachPanel } from "./AddCoachPanel";
import { CoachRowActions } from "./CoachRowActions";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default async function SportsAdminCoachesPage({ searchParams }: { searchParams: Promise<{ q?: string; duty?: string }> }) {
  const { q, duty } = await searchParams;
  try {
    const [allCoaches, teams, sessions] = await Promise.all([listCoaches(), listMyTeams(), listTrainingSessions()]);

    const teamsByCoach = new Map<string, string[]>();
    for (const t of teams) {
      if (!t.coachId) continue;
      const list = teamsByCoach.get(t.coachId) ?? [];
      list.push(t.name);
      teamsByCoach.set(t.coachId, list);
    }
    const onDutyToday = new Set(sessions.filter((s) => isToday(s.scheduledAt) && s.conductedByCoachId).map((s) => s.conductedByCoachId as string));

    const needle = (q ?? "").trim().toLowerCase();
    const coaches = allCoaches
      .filter((c) => !duty || (duty === "ON" ? onDutyToday.has(c.id) : !onDutyToday.has(c.id)))
      .filter((c) => !needle || `${c.fullName} ${c.qualification ?? ""}`.toLowerCase().includes(needle));

    const rows = coaches.map((c) => {
      const onDuty = onDutyToday.has(c.id);
      const cells: TableCell[] = [
        { kind: "plain", text: c.fullName, bold: true },
        { kind: "plain", text: `${orDash(c.qualification)} · ${c.isExternal ? "External" : "In-house"}` },
        { kind: "plain", text: teamsByCoach.get(c.id)?.join(", ") ?? "—" },
        { kind: "plain", text: orDash(c.contactPhone), mono: true },
        { kind: "badge", text: onDuty ? "On duty" : "Off duty", tone: toneOf(onDuty ? "on duty" : "rest") },
        { kind: "node", node: <CoachRowActions coach={c} /> },
      ];
      return { key: c.id, cells };
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Coaches &amp; PT staff</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Coaching staff records and duty roster for Term I</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6, position: "relative" }}>
            <InfoPanelButton label="Duty roster" title="On duty today">
              {allCoaches.filter((c) => onDutyToday.has(c.id)).length === 0 ? (
                <p style={{ margin: 0 }}>No coach has a training session scheduled today.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {allCoaches.filter((c) => onDutyToday.has(c.id)).map((c) => (
                    <li key={c.id} style={{ marginBottom: 6 }}>
                      <strong>{c.fullName}</strong> — {teamsByCoach.get(c.id)?.join(", ") ?? "squad not on file"}
                    </li>
                  ))}
                </ul>
              )}
            </InfoPanelButton>
            <AddCoachPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search staff by name or qualification"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="duty" defaultValue={duty ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All duty status</option>
            <option value="ON">On duty today</option>
            <option value="OFF">Off duty today</option>
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Staff register"
            meta={`${coaches.length} of ${allCoaches.length} on the roster`}
            columns={["STAFF", "QUALIFICATION · TYPE", "CLASSES HANDLED", "CONTACT", "DUTY", "MANAGE"]}
            rows={rows}
            emptyLabel="No coaches match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load coaches."} />;
  }
}
