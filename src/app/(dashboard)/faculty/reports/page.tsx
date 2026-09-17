// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isReports" screen.
// CORRECTED: there is no dedicated faculty-scoped report endpoint (confirmed
// -- the existing reports.controller.ts is ADMIN/PRINCIPAL/VICE_PRINCIPAL-
// only and school-wide, and no faculty-reports lib file exists in the
// mobile app either), but every number this screen needs is already real
// data available through OTHER endpoints this build already uses
// (listClassResultExams/getClassResults for exam results, getAttendanceHistory
// for attendance) -- so this composes a genuinely real report from those,
// rather than showing a gap notice for a whole screen worth of data most of
// which is actually available.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections, listClassResultExams, getClassResults, getAttendanceHistory } from "@/lib/faculty-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { StatTile } from "@/components/faculty-ui/StatTile";

function monthRange(monthsAgo: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
}

export default async function ReportsPage() {
  try {
    const sections = await listAdvisorSections();
    if (sections.length === 0) {
      return (
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Reports</h1>
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not a class advisor -- reports are only available to the section's own class advisor." />
          </div>
        </div>
      );
    }
    const section = sections[0];

    const exams = await listClassResultExams(section.sectionId);
    const publishedExams = exams.filter((e) => e.examState === "PUBLISHED");
    const resultAttempts = await Promise.all(
      publishedExams.map(async (e) => {
        try {
          return { exam: e, r: await getClassResults(section.sectionId, e.examId), failed: false as const };
        } catch {
          return { exam: e, r: null, failed: true as const };
        }
      }),
    );
    // A failed fetch (transient network/server error) is never treated the
    // same as "not published yet" -- silently dropping it would make a real
    // exam's results look like they don't exist. Surfaced separately below
    // instead of being swallowed into the table.
    const failedExamNames = resultAttempts.filter((x) => x.failed).map((x) => x.exam.examName);
    const validResults = resultAttempts.filter(
      (x): x is { exam: typeof x.exam; r: NonNullable<typeof x.r>; failed: false } => !x.failed && x.r !== null && x.r.classAvg !== null,
    );

    // Subject-wise average per exam, real: derived from each exam's real
    // per-student per-subject marks (the same data Performance already uses).
    const subjectNames = [...new Set(validResults.flatMap(({ r }) => r.students.flatMap((s) => s.subjects.map((sub) => sub.subjectName))))];
    const subjectRows = subjectNames.map((subjectName) => {
      const perExam = validResults.map(({ exam, r }) => {
        const marks = r.students
          .flatMap((s) => s.subjects.filter((sub) => sub.subjectName === subjectName && !sub.isAbsent))
          .map((sub) => sub.marksObtained)
          .filter((v): v is number => v !== null);
        const avg = marks.length > 0 ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : null;
        return { examName: exam.examName, avg };
      });
      const allAvgs = perExam.map((p) => p.avg).filter((v): v is number => v !== null);
      const below40 = validResults.reduce(
        (count, { r }) => count + r.students.filter((s) => s.subjects.some((sub) => sub.subjectName === subjectName && !sub.isAbsent && sub.marksObtained !== null && sub.marksObtained < 40)).length,
        0,
      );
      return { subjectName, perExam, avg: allAvgs.length > 0 ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10 : null, below40 };
    });

    const months = [0, 1, 2].map(monthRange);
    const attendanceAttempts = await Promise.all(
      months.map(async (m) => {
        try {
          return { days: await getAttendanceHistory(section.sectionId, m.start, m.end), failed: false };
        } catch {
          return { days: [] as Awaited<ReturnType<typeof getAttendanceHistory>>, failed: true };
        }
      }),
    );
    const failedAttendanceMonths = months.filter((_, i) => attendanceAttempts[i].failed).map((m) => m.label);
    const monthlyAttendance = months.map((m, i) => {
      const { days, failed } = attendanceAttempts[i];
      const totalPresent = days.reduce((sum, d) => sum + d.present, 0);
      const totalStudents = days.reduce((sum, d) => sum + d.total, 0);
      const pct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : null;
      return { label: m.label, pct, daysMarked: days.length, failed };
    });

    const latest = validResults[validResults.length - 1];
    const supportList = latest
      ? [...latest.r.students].filter((s) => (s.percent ?? 100) < 60).sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0)).slice(0, 6)
      : [];

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Reports</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Class {section.gradeName}-{section.sectionName} · exams, results and attendance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3" style={{ marginTop: 24 }}>
          <StatTile label="Latest class average" value={latest?.r.classAvg !== null && latest?.r.classAvg !== undefined ? `${latest.r.classAvg}%` : "--"} sub={latest?.exam.examName ?? "No published exam yet"} />
          <StatTile label="Latest pass rate" value={latest ? `${latest.r.pass.count}/${latest.r.pass.total}` : "--"} sub="students passed" />
          <StatTile label="Attendance this month" value={monthlyAttendance[0]?.pct !== null ? `${monthlyAttendance[0].pct}%` : "--"} sub={monthlyAttendance[0]?.label ?? ""} />
        </div>

        {(failedExamNames.length > 0 || failedAttendanceMonths.length > 0) && (
          <div style={{ marginTop: 14, background: "var(--fac-red-bg)", border: "1px solid var(--fac-red-text)", borderRadius: 10, padding: "12px 16px", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>
            {failedExamNames.length > 0 && <>Couldn&rsquo;t load results for {failedExamNames.join(", ")}. </>}
            {failedAttendanceMonths.length > 0 && <>Couldn&rsquo;t load attendance for {failedAttendanceMonths.join(", ")}. </>}
            These are not included below -- try refreshing this page.
          </div>
        )}

        {subjectRows.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="No published exam results yet -- subject-wise results appear once the exam cell publishes marks." />
          </div>
        ) : (
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", marginTop: 18, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 6px" }}>
              <h3 style={{ margin: 0, font: "700 20px/1.2 var(--fac-font-sans)" }}>Exam results · subject wise</h3>
              <p style={{ margin: "5px 0 0", font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Class average per subject, across published exams</p>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 560 }}>
                <div className="grid" style={{ gridTemplateColumns: `1.6fr repeat(${validResults.length}, minmax(0,1fr)) 1.1fr`, padding: "14px 20px", borderBottom: "1px solid var(--fac-border)", background: "var(--fac-panel)", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".07em", color: "var(--fac-body-muted)" }}>
                  <div>SUBJECT</div>
                  {validResults.map(({ exam }) => (
                    <div key={exam.examId} style={{ textAlign: "right" }}>{exam.examName.toUpperCase()}</div>
                  ))}
                  <div style={{ textAlign: "right" }}>BELOW 40</div>
                </div>
                {subjectRows.map((row) => (
                  <div key={row.subjectName} className="fac-hover-lift grid items-center" style={{ gridTemplateColumns: `1.6fr repeat(${validResults.length}, minmax(0,1fr)) 1.1fr`, padding: "15px 20px", borderBottom: "1px solid var(--fac-divider)" }}>
                    <span style={{ font: "600 14.5px/1.2 var(--fac-font-sans)" }}>{row.subjectName}</span>
                    {row.perExam.map((p, i) => (
                      <span key={i} className="fac-font-mono" style={{ textAlign: "right", font: "500 14.5px/1 var(--fac-font-mono)" }}>{p.avg ?? "--"}</span>
                    ))}
                    <span className="fac-font-mono" style={{ textAlign: "right", font: "500 14.5px/1 var(--fac-font-mono)", color: row.below40 > 0 ? "var(--fac-red-text)" : "var(--fac-body)" }}>{row.below40}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 18 }}>
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 12px", font: "700 20px/1.2 var(--fac-font-sans)" }}>Monthly attendance</h3>
            {monthlyAttendance.map((m) => (
              <div key={m.label} className="fac-hover-lift" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <div className="flex justify-between" style={{ font: "500 14px/1.3 var(--fac-font-sans)" }}>
                  <span>{m.label}</span>
                  <span className="fac-font-mono" style={{ color: m.failed ? "var(--fac-red-text)" : "var(--fac-primary)" }}>
                    {m.failed ? "couldn't load" : m.pct !== null ? `${m.pct}%` : "no data"}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "var(--fac-border)", marginTop: 9, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--fac-primary)", width: `${m.pct ?? 0}%` }} />
                </div>
                <div style={{ font: "400 12px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 7 }}>{m.daysMarked} day{m.daysMarked === 1 ? "" : "s"} marked</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 12px", font: "700 20px/1.2 var(--fac-font-sans)" }}>Students needing support</h3>
            {supportList.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No students below 60% in the latest published exam.</p>
            ) : (
              supportList.map((s) => (
                <div key={s.studentId} className="fac-hover-lift flex items-center gap-3" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--fac-font-sans)" }}>
                    {s.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", font: "600 14px/1.3 var(--fac-font-sans)" }}>{s.studentName}</span>
                    <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Roll {s.rollNo ?? "--"} · {latest!.exam.examName}</span>
                  </span>
                  <span style={{ font: "500 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "6px 10px" }}>{s.percent}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load reports. Nothing was changed -- try again." />;
  }
}
