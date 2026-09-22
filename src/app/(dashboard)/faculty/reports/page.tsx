// Faculty "Reports & Analytics" -- net-new pixel-rebuilt screen (nav already
// linked this at /faculty/reports with no page behind it). Every figure is a
// real read against this teacher's own scope: listTeachingOfferings for
// classes handled, listExamsForOffering + getMarksRoster for exam records/
// pass rates, getAttendanceHistory (advisor-only, same backend rule as the
// dashboard's own attendance card) for the weekly trend. Nothing fabricated
// -- an advisor-less teacher simply sees an honest empty state on the trend
// chart instead of invented numbers.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import {
  getAttendanceHistory,
  getMarksRoster,
  listAdvisorSections,
  listExamsForOffering,
  listTeachingOfferings,
} from "@/lib/faculty-api";
import { Card } from "@/components/faculty-ui/Card";
import { StatTile } from "@/components/faculty-ui/StatTile";
import { ErrorState } from "@/components/ui/EmptyState";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function startOfWeek(d: Date): Date {
  const s = new Date(d);
  const dow = (s.getDay() + 6) % 7; // 0 = Monday
  s.setDate(s.getDate() - dow);
  s.setHours(0, 0, 0, 0);
  return s;
}
function addDays(d: Date, n: number): Date {
  const s = new Date(d);
  s.setDate(s.getDate() + n);
  return s;
}

export default async function FacultyReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  try {
    const params = await searchParams;
    const today = new Date();
    const to = params.to ? new Date(params.to) : today;
    const from = params.from ? new Date(params.from) : addDays(startOfWeek(today), -7 * 7);
    const fromIso = isoDate(from);
    const toIso = isoDate(to);

    const [advisorSections, teachingOfferings] = await Promise.all([
      listAdvisorSections().catch(() => []),
      listTeachingOfferings().catch(() => []),
    ]);
    const advisedSection = advisorSections[0] ?? null;
    const sectionLabel = advisedSection ? `${advisedSection.gradeName}-${advisedSection.sectionName}` : null;
    const subjectCount = new Set(teachingOfferings.map((o) => o.subjectId)).size;

    // ---- Exam records / pass rates -- one roster fetch per (class, subject,
    // exam) this teacher actually owns, entirely real. ----
    const examLists = await Promise.all(
      teachingOfferings.map((o) => listExamsForOffering(o.subjectOfferingId).catch(() => [])),
    );
    const examRows = teachingOfferings.flatMap((o, i) => examLists[i].map((exam) => ({ offering: o, exam })));
    const rosters = await Promise.all(examRows.map((r) => getMarksRoster(r.exam.examSubjectId).catch(() => null)));

    const examStats = examRows.map((r, i) => {
      const roster = rosters[i];
      const rows = roster?.roster ?? [];
      const entered = rows.filter((x) => x.marksObtained !== null || x.isAbsent).length;
      const attempted = rows.filter((x) => !x.isAbsent && x.marksObtained !== null);
      const passMarks = r.exam.passMarks;
      const passed = passMarks === null ? attempted.length : attempted.filter((x) => (x.marksObtained ?? 0) >= passMarks).length;
      const passPct = attempted.length > 0 ? Math.round((passed / attempted.length) * 1000) / 10 : null;
      return {
        key: r.exam.examSubjectId,
        label: `${r.offering.gradeName}-${r.offering.sectionName} · ${r.exam.examName}`,
        classSubject: `${r.offering.gradeName}-${r.offering.sectionName} (${r.offering.subjectName})`,
        strength: rows.length,
        entered,
        passPct,
      };
    });
    const totalEntered = examStats.reduce((s, e) => s + e.entered, 0);
    const gradedExams = examStats.filter((e) => e.passPct !== null);
    const totalAttempted = examRows.reduce((sum, r, i) => {
      const rows = rosters[i]?.roster ?? [];
      return sum + rows.filter((x) => !x.isAbsent && x.marksObtained !== null).length;
    }, 0);
    const totalPassed = examRows.reduce((sum, r, i) => {
      const rows = rosters[i]?.roster ?? [];
      const passMarks = r.exam.passMarks;
      const attempted = rows.filter((x) => !x.isAbsent && x.marksObtained !== null);
      return sum + (passMarks === null ? attempted.length : attempted.filter((x) => (x.marksObtained ?? 0) >= passMarks).length);
    }, 0);
    const overallPassPct = totalAttempted > 0 ? Math.round((totalPassed / totalAttempted) * 1000) / 10 : null;

    // ---- Weekly attendance trend -- advisor-scoped (same backend rule as
    // the dashboard's own attendance card: getHistory is advisor-only). ----
    const weeks: { start: Date; end: Date }[] = [];
    for (let ws = startOfWeek(from); ws <= to; ws = addDays(ws, 7)) {
      const we = addDays(ws, 6);
      weeks.push({ start: ws, end: we > to ? to : we });
    }
    const history = advisedSection ? await getAttendanceHistory(advisedSection.sectionId, fromIso, toIso).catch(() => []) : [];
    const weeklyTrend = weeks.map((w) => {
      const days = history.filter((d) => d.date >= isoDate(w.start) && d.date <= isoDate(w.end));
      const total = days.reduce((s, d) => s + d.total, 0);
      const present = days.reduce((s, d) => s + d.present, 0);
      return {
        label: w.start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        pct: total > 0 ? Math.round((present / total) * 1000) / 10 : null,
      };
    });
    const maxPct = Math.max(1, ...weeklyTrend.map((w) => w.pct ?? 0));

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 32px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Reports &amp; Analytics</h1>
            <p style={{ margin: "8px 0 0", font: "400 14.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Across the classes you handle{sectionLabel ? ` · ${sectionLabel}` : ""}
            </p>
          </div>
          <form className="flex items-center gap-2.5 flex-wrap" style={{ font: "500 12.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
            <label className="flex items-center gap-2">
              From
              <input type="date" name="from" defaultValue={fromIso} style={{ border: "1px solid var(--fac-border)", borderRadius: 8, padding: "8px 10px", font: "400 13px/1 var(--fac-font-sans)" }} />
            </label>
            <label className="flex items-center gap-2">
              To
              <input type="date" name="to" defaultValue={toIso} style={{ border: "1px solid var(--fac-border)", borderRadius: 8, padding: "8px 10px", font: "400 13px/1 var(--fac-font-sans)" }} />
            </label>
            <button type="submit" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 12.5px/1 var(--fac-font-sans)", borderRadius: 8, padding: "9px 14px" }}>
              Apply
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 24 }}>
          <StatTile label="Classes handled" value={String(teachingOfferings.length)} sub={`${subjectCount} subject${subjectCount === 1 ? "" : "s"}`} />
          <StatTile label="Exam records entered" value={String(totalEntered)} sub={`across ${gradedExams.length || examRows.length} exam record${examRows.length === 1 ? "" : "s"}`} />
          <StatTile label="Overall pass percentage" value={overallPassPct !== null ? `${overallPassPct}%` : "—"} sub="from published/entered marks" />
          <StatTile label="Class advisor" value={advisedSection ? "Yes" : "No"} sub={sectionLabel ?? "Not assigned"} />
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 18, alignItems: "start" }}>
          <Card>
            <h3 style={{ margin: 0, font: "700 17px/1.2 var(--fac-font-sans)" }}>Weekly attendance trend</h3>
            <p style={{ margin: "4px 0 20px", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
              {advisedSection ? "Real attendance for the class you advise, by week" : "You are not a class advisor -- no attendance trend to show"}
            </p>
            {advisedSection && weeklyTrend.length > 0 ? (
              <div className="flex items-end gap-3" style={{ height: 150 }}>
                {weeklyTrend.map((w, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0, height: "100%" }}>
                    <span style={{ font: "600 11px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)", marginBottom: 6 }}>
                      {w.pct !== null ? `${w.pct}%` : "—"}
                    </span>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "6px 6px 0 0",
                          background: "var(--fac-primary)",
                          height: w.pct !== null ? `${Math.max(4, (w.pct / maxPct) * 100)}%` : "2%",
                          opacity: w.pct !== null ? 1 : 0.25,
                        }}
                      />
                    </div>
                    <span style={{ font: "400 10.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 6 }}>{w.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "20px 0" }}>No attendance data for this range.</p>
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 16px", font: "700 17px/1.2 var(--fac-font-sans)" }}>Pass percentage by exam</h3>
            {examStats.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No exam marks entered yet.</p>
            ) : (
              examStats.map((e) => (
                <div key={e.key} style={{ padding: "10px 0" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ font: "600 13px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{e.label}</span>
                    <span style={{ font: "700 13px/1 var(--fac-font-mono)", color: "var(--fac-primary)", flex: "0 0 auto" }}>
                      {e.passPct !== null ? `${e.passPct}%` : "—"}
                    </span>
                  </div>
                  <span style={{ display: "block", height: 7, borderRadius: 4, background: "var(--fac-border)", marginTop: 8, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", borderRadius: 4, background: "var(--fac-primary)", width: `${e.passPct ?? 0}%` }} />
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>

        <div style={{ marginTop: 18 }}>
          <Card padding="0">
            <div style={{ padding: "18px 22px 4px" }}>
              <h3 style={{ margin: 0, font: "700 17px/1.2 var(--fac-font-sans)" }}>Class-wise summary</h3>
            </div>
            {examStats.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "12px 22px 22px" }}>No exam records to summarize yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["CLASS & SUBJECT", "STRENGTH", "ENTERED", "PASS %"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: h === "CLASS & SUBJECT" ? "left" : "right",
                            font: "600 11px/1 var(--fac-font-sans)",
                            letterSpacing: ".06em",
                            color: "var(--fac-tertiary)",
                            padding: "12px 22px",
                            borderTop: "1px solid var(--fac-divider)",
                            borderBottom: "1px solid var(--fac-divider)",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {examStats.map((e) => (
                      <tr key={e.key}>
                        <td style={{ font: "600 13.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)", padding: "14px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                          {e.classSubject}
                        </td>
                        <td style={{ textAlign: "right", font: "400 13.5px/1 var(--fac-font-mono)", color: "var(--fac-body)", padding: "14px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                          {e.strength}
                        </td>
                        <td style={{ textAlign: "right", font: "400 13.5px/1 var(--fac-font-mono)", color: "var(--fac-body)", padding: "14px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                          {e.entered}
                        </td>
                        <td style={{ textAlign: "right", font: "700 13.5px/1 var(--fac-font-mono)", color: "var(--fac-primary)", padding: "14px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                          {e.passPct !== null ? `${e.passPct}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load reports. Nothing was changed -- try again." />;
  }
}
