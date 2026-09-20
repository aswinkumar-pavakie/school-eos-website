// Sports Admin -> Achievements -- pixel-rebuilt from the design's own
// `achievements` screen (EDITABLE.achievements: columns ['EVENT',
// 'PLAYER / SQUAD','CLASS','LEVEL','MONTH','RESULT','MANAGE']; META:
// primary '+ Add achievement', secondary 'Export', filters Level/Term).
// CLASS is now real (per-student current enrolment via getStudent(), same
// technique the Teams page already uses for captain lookups -- bounded by
// the real achievement count, not a full-roster fetch). Term is derived
// from each real academic_term's start/end date against the achievement's
// real awardedOn date -- no achievement.term_id column needed (see
// sports-faculty-api.ts's own comment for the newly-broadened endpoint this
// reuses). There is no updateAchievement/deleteAchievement in the real
// backend (confirmed by API-surface audit), so MANAGE can't open a real
// edit form -- it links to the player's own Student Detail page instead.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { formatDate, statusLabel } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getStudent, listAcademicTerms, listAchievements } from "@/lib/sports-admin-api";
import { AchievementRowActions } from "./AchievementRowActions";
import { AddAchievementPanel } from "./AddAchievementPanel";

const LEVELS = ["SCHOOL", "BLOCK", "DISTRICT", "STATE", "NATIONAL", "INTERNATIONAL"];

export default async function SportsAdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; term?: string }>;
}) {
  const { q, level, term } = await searchParams;
  try {
    const [achievements, terms] = await Promise.all([listAchievements(), listAcademicTerms().catch(() => [])]);
    const studentIds = Array.from(new Set(achievements.map((a) => a.studentId)));
    const students = await Promise.all(studentIds.map((id) => getStudent(id).catch(() => null)));
    const studentById = new Map(studentIds.map((id, i) => [id, students[i]]));

    function termForDate(dateStr: string): string | null {
      const d = new Date(dateStr).getTime();
      const match = terms.find((t) => t.startDate && t.endDate && d >= new Date(t.startDate).getTime() && d <= new Date(t.endDate).getTime());
      return match?.name ?? null;
    }

    const needle = (q ?? "").trim().toLowerCase();
    const sorted = [...achievements]
      .filter((a) => !level || a.level === level)
      .filter((a) => !term || termForDate(a.awardedOn) === term)
      .filter((a) => {
        if (!needle) return true;
        const haystack = `${a.title ?? ""} ${a.studentFirstName} ${a.studentLastName} ${a.teamName ?? ""} ${a.placement}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => new Date(b.awardedOn).getTime() - new Date(a.awardedOn).getTime());

    const rows = sorted.map((a) => {
      const student = studentById.get(a.studentId);
      const cls = student?.gradeName ? `${student.gradeName}${student.sectionName ? ` ${student.sectionName}` : ""}` : "—";
      const cells: TableCell[] = [
        { kind: "plain", text: a.title ?? `${a.placement} — Sports`, bold: true },
        { kind: "plain", text: `${a.studentFirstName} ${a.studentLastName}` },
        { kind: "plain", text: cls },
        { kind: "plain", text: a.level ? statusLabel(a.level) : "—" },
        { kind: "plain", text: formatDate(a.awardedOn), mono: true },
        { kind: "badge", text: a.placement, tone: toneOf(a.placement) },
        { kind: "node", node: <AchievementRowActions achievement={a} /> },
      ];
      return { key: a.id, cells };
    });

    const exportRows = sorted.map((a) => {
      const student = studentById.get(a.studentId);
      const cls = student?.gradeName ? `${student.gradeName}${student.sectionName ? ` ${student.sectionName}` : ""}` : "—";
      return [a.title ?? `${a.placement} — Sports`, `${a.studentFirstName} ${a.studentLastName}`, cls, a.level ? statusLabel(a.level) : "—", formatDate(a.awardedOn), a.placement];
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Achievements</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Results won by players and squads this academic year</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              filename="achievements-register.csv"
              headers={["Event", "Player / squad", "Class", "Level", "Date", "Result"]}
              rows={exportRows}
            />
            <AddAchievementPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search results by event, player or squad"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select
            name="level"
            defaultValue={level ?? ""}
            style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {statusLabel(l)}
              </option>
            ))}
          </select>
          {terms.length > 0 ? (
            <select
              name="term"
              defaultValue={term ?? ""}
              style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
            >
              <option value="">All terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          ) : null}
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Results register"
            meta={`${sorted.length} of ${achievements.length} recognitions`}
            columns={["EVENT", "PLAYER / SQUAD", "CLASS", "LEVEL", "MONTH", "RESULT", "MANAGE"]}
            rows={rows}
            emptyLabel="No achievements match this filter."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load achievements."} />;
  }
}
