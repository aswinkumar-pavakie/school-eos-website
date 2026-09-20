// Sports Admin -> PT / sports periods. Pixel-rebuilt from the design's own
// `pt` screen (a weekly class x day grid; STATIC.pt: secondary 'Print
// grid', filters 'Grade band'/'Ground', search by class/PT staff/ground,
// tableTitle 'Weekly PT grid'). Reuses the real academic timetable for the
// "Physical Training" subject -- confirmed live via a read-only query (272
// real timetable_slot rows) -- no new schema needed. "Grade band" filters
// by each real grade name (Standard 6, Standard 7, ...); "Ground" filters
// by the real room/venue text already on each slot.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { AuthExpiredError } from "@/lib/api";
import { listPtPeriods } from "@/lib/sports-admin-api";

const DAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
const DAYS = [1, 2, 3, 4, 5, 6];

export default async function SportsAdminPtPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grade?: string; ground?: string }>;
}) {
  const { q, grade, ground } = await searchParams;
  try {
    const allSlots = await listPtPeriods();
    const needle = (q ?? "").trim().toLowerCase();

    const gradeOptions = Array.from(new Set(allSlots.map((s) => s.gradeName))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const groundOptions = Array.from(new Set(allSlots.map((s) => s.room).filter(Boolean))) as string[];
    groundOptions.sort();

    const slots = allSlots
      .filter((s) => !grade || s.gradeName === grade)
      .filter((s) => !ground || s.room === ground)
      .filter((s) => !needle || `${s.gradeName} ${s.sectionName} ${s.teacherFirstName} ${s.teacherLastName ?? ""} ${s.room ?? ""}`.toLowerCase().includes(needle));

    const classKey = (s: { sectionId: string }) => s.sectionId;
    const classesById = new Map<string, { label: string }>();
    for (const s of slots) {
      if (!classesById.has(classKey(s))) classesById.set(classKey(s), { label: `${s.gradeName} ${s.sectionName}` });
    }
    const classes = [...classesById.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label, undefined, { numeric: true }));

    const byClassDay = new Map<string, typeof slots>();
    for (const s of slots) {
      const key = `${s.sectionId}|${s.dayOfWeek}`;
      const arr = byClassDay.get(key) ?? [];
      arr.push(s);
      byClassDay.set(key, arr);
    }

    const exportRows: (string | number)[][] = [];
    for (const [sectionId, cls] of classes) {
      for (const d of DAYS) {
        const daySlots = (byClassDay.get(`${sectionId}|${d}`) ?? []).sort((a, b) => a.periodNo - b.periodNo);
        for (const s of daySlots) {
          exportRows.push([cls.label, DAY_LABELS[d], `${s.startTime.slice(0, 5)}-${s.endTime.slice(0, 5)}`, s.room ?? "—", `${s.teacherFirstName} ${s.teacherLastName ?? ""}`]);
        }
      }
    }

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>PT / sports periods</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>
              Weekly Physical Training allotment across {classes.length} class{classes.length === 1 ? "" : "es"}, drawn from the real class timetable
            </p>
          </div>
          <div style={{ paddingTop: 6 }}>
            <ExportCsvButton
              label="Print grid"
              filename="pt-weekly-grid.csv"
              headers={["Class", "Day", "Time", "Ground", "PT staff"]}
              rows={exportRows}
            />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by class, PT staff or ground"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="grade" defaultValue={grade ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All grade bands</option>
            {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select name="ground" defaultValue={ground ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All grounds</option>
            {groundOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "18px 20px 14px" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>Weekly PT grid</h2>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{classes.length} classes</span>
          </div>
          {classes.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--sport-muted-2)", fontSize: 14 }}>No PT periods match this filter.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--sport-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "14px 20px", borderTop: "1px solid var(--sport-divider)", borderBottom: "1px solid var(--sport-divider)" }}>Class</th>
                  {DAYS.map((d) => (
                    <th key={d} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--sport-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "14px 20px", borderTop: "1px solid var(--sport-divider)", borderBottom: "1px solid var(--sport-divider)" }}>
                      {DAY_LABELS[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map(([sectionId, cls]) => (
                  <tr key={sectionId} style={{ borderBottom: "1px solid var(--sport-divider)" }}>
                    <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: "var(--sport-ink)" }}>{cls.label}</td>
                    {DAYS.map((d) => {
                      const daySlots = (byClassDay.get(`${sectionId}|${d}`) ?? []).sort((a, b) => a.periodNo - b.periodNo);
                      return (
                        <td key={d} style={{ padding: "14px 20px", fontSize: 12.5, color: "var(--sport-body)" }}>
                          {daySlots.length === 0
                            ? <span style={{ color: "var(--sport-tertiary)" }}>—</span>
                            : daySlots.map((s) => (
                                <div key={s.id} style={{ marginBottom: 4 }}>
                                  <span style={{ fontFamily: "var(--sport-mono)" }}>{s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}</span>
                                  {s.room ? <span style={{ color: "var(--sport-tertiary)" }}> · {s.room}</span> : null}
                                  <div style={{ color: "var(--sport-muted-2)" }}>{s.teacherFirstName} {s.teacherLastName ?? ""}</div>
                                </div>
                              ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load PT periods."} />;
  }
}
