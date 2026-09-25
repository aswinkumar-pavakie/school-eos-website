// Teacher timetable -- list, pixel-rebuilt from the design's own
// "isTeacherTt" screen: searchable/filterable real teacher cards (load bar +
// free-periods text), each linking to a real per-teacher week grid (see
// [staffId]/page.tsx). Real data only -- getFacultyWorkload() +
// getCoordinatorOfferings({}) (for the subject/grade filter options) +
// listAllTimetablePeriods() (for the real weekly period-slot ceiling used to
// compute free periods). No new backend needed.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorOfferings, getFacultyWorkload, listAllTimetablePeriods } from "@/lib/faculty-coordinator-api";

export default async function TeacherTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; grade?: string }>;
}) {
  const { q, subject, grade } = await searchParams;

  try {
    const [workload, offerings, periods] = await Promise.all([
      getFacultyWorkload(),
      getCoordinatorOfferings({}),
      listAllTimetablePeriods(),
    ]);
    const teachingPeriodsPerWeek = periods.filter((p) => !p.isBreak).length * 6;

    const bySubjectByTeacher = new Map<string, Set<string>>();
    const byGradeByTeacher = new Map<string, Set<string>>();
    for (const o of offerings) {
      if (!o.teacherStaffId) continue;
      if (!bySubjectByTeacher.has(o.teacherStaffId)) bySubjectByTeacher.set(o.teacherStaffId, new Set());
      bySubjectByTeacher.get(o.teacherStaffId)!.add(o.subjectName);
      if (!byGradeByTeacher.has(o.teacherStaffId)) byGradeByTeacher.set(o.teacherStaffId, new Set());
      byGradeByTeacher.get(o.teacherStaffId)!.add(o.gradeName);
    }
    const subjectOptions = [...new Set(offerings.map((o) => o.subjectName))].sort();
    const gradeOptions = [...new Set(offerings.map((o) => o.gradeName))].sort();

    const rows = workload
      .map((t) => ({
        ...t,
        subjects: [...(bySubjectByTeacher.get(t.staffId) ?? [])].sort(),
        grades: [...(byGradeByTeacher.get(t.staffId) ?? [])].sort(),
        freeCount: Math.max(0, teachingPeriodsPerWeek - t.weeklyPeriods),
        loadPct: teachingPeriodsPerWeek > 0 ? Math.min(100, Math.round((t.weeklyPeriods / teachingPeriodsPerWeek) * 100)) : 0,
      }))
      .filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.subjects.some((s) => s.toLowerCase().includes(q.toLowerCase())))
      .filter((t) => !subject || subject === "All subjects" || t.subjects.includes(subject))
      .filter((t) => !grade || grade === "All standards" || t.grades.includes(grade));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Teacher timetable</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>Built from the published class timetables</div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "16px 18px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search teacher name or subject"
            style={{ flex: 1, minWidth: 220, border: "1px solid var(--acc-border)", borderRadius: 10, background: "var(--acc-panel)", padding: "12px 14px", fontSize: 14, color: "var(--acc-navy)" }}
          />
          <select name="subject" defaultValue={subject ?? "All subjects"} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "var(--acc-navy)", background: "#fff" }}>
            <option>All subjects</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="grade" defaultValue={grade ?? "All standards"} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "var(--acc-navy)", background: "#fff" }}>
            <option>All standards</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
          <div style={{ fontSize: 13, color: "var(--acc-tertiary)", fontWeight: 600 }}>{rows.length} teacher{rows.length === 1 ? "" : "s"}</div>
        </form>

        {rows.length === 0 && <EmptyPanel label="No teacher matches these filters." />}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 18 }}>
          {rows.map((t) => (
            <Link key={t.staffId} href={`/academic-coordinator/teacher-timetable/${t.staffId}`} style={{ textDecoration: "none" }}>
              <div className="acc-card-hover" style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: 10, background: "var(--acc-accent-tint)", color: "var(--acc-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, fontWeight: 700 }}>
                    {t.name.slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--acc-navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.subjects.join(", ") || "No subject offerings"}
                    </div>
                  </div>
                  <span style={{ color: "var(--acc-tertiary)", fontSize: 16 }}>&rsaquo;</span>
                </div>
                <div style={{ height: 6, background: "var(--acc-border)", borderRadius: 99, marginTop: 15, overflow: "hidden" }}>
                  <div style={{ height: 6, background: "var(--acc-accent)", width: `${t.loadPct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, color: "var(--acc-body-muted)" }}>
                  <span>{t.weeklyPeriods} periods</span>
                  <span>{t.freeCount} free/wk</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load teacher timetable."} />;
  }
}
