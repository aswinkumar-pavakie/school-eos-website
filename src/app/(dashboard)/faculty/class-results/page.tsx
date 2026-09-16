// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isPerformance"
// screen (nav label "Performance"). Reuses the EXISTING real data functions
// (listClassResultExams, getClassResults) unchanged. The class teacher's
// remark is real too, via GET/PATCH .../students/:studentId/remark
// (faculty-class-results.controller.ts) -- report_card.advisor_remark, with
// total/percentage/rank computed from this exact exam's real results.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections, listClassResultExams, getClassResults, getStudentRemark } from "@/lib/faculty-api";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { RemarkForm } from "./RemarkForm";

export default async function ClassResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; examId?: string; q?: string; filter?: string; studentId?: string }>;
}) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;

    if (sections.length === 0 || !sectionId) {
      return (
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Performance</h1>
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not a class advisor -- performance is only visible to the section's own class advisor." />
          </div>
        </div>
      );
    }

    const section = sections.find((s) => s.sectionId === sectionId) ?? sections[0];
    const exams = await listClassResultExams(sectionId);
    const examId = params.examId || exams[0]?.examId;

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Performance</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Class {section.gradeName}-{section.sectionName} · tap a student for the report card
        </p>

        {exams.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="No exam is configured for this section yet." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4" style={{ marginTop: 22 }}>
              {exams.map((e) => {
                const active = e.examId === examId;
                return (
                  <Link
                    key={e.examId}
                    href={`/faculty/class-results?sectionId=${sectionId}&examId=${e.examId}`}
                    className="fac-hover-lift block"
                    style={{
                      border: "1px solid var(--fac-border)",
                      borderRadius: 11,
                      padding: "16px 18px",
                      background: active ? "var(--fac-primary)" : "var(--fac-white)",
                      color: active ? "#fff" : "var(--fac-ink)",
                    }}
                  >
                    <span style={{ display: "block", font: "600 14.5px/1.2 var(--fac-font-sans)" }}>{e.examName}</span>
                    <span style={{ display: "block", font: "700 21px/1.1 var(--fac-font-sans)", marginTop: 8 }}>{e.examState}</span>
                  </Link>
                );
              })}
            </div>

            {examId ? (
              <ResultsSection sectionId={sectionId} examId={examId} q={params.q ?? ""} filter={params.filter ?? "All"} studentId={params.studentId} />
            ) : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load performance. Nothing was changed -- try again." />;
  }
}

async function ResultsSection({
  sectionId,
  examId,
  q,
  filter,
  studentId,
}: {
  sectionId: string;
  examId: string;
  q: string;
  filter: string;
  studentId?: string;
}) {
  const results = await getClassResults(sectionId, examId);

  if (results.students.length === 0 || results.classAvg === null) {
    return (
      <Card className="mt-[18px]" padding="64px 20px">
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--fac-tint)", margin: "0 auto" }} />
          <div style={{ font: "700 20px/1.3 var(--fac-font-sans)", marginTop: 16 }}>Marks are not published</div>
          <div style={{ font: "400 14.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 6 }}>
            Rank and report cards appear once the exam cell publishes marks.
          </div>
        </div>
      </Card>
    );
  }

  const ranked = [...results.students].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
  const needle = q.trim().toLowerCase();
  let rows = ranked.filter((s) => !needle || s.studentName.toLowerCase().includes(needle) || String(s.rollNo ?? "").includes(needle));
  if (filter === "Top 10") rows = rows.slice(0, 10);
  else if (filter === "60-79%") rows = rows.filter((s) => (s.percent ?? 0) >= 60 && (s.percent ?? 0) < 80);
  else if (filter === "Below 60%") rows = rows.filter((s) => (s.percent ?? 0) < 60);

  const detail = studentId ? results.students.find((s) => s.studentId === studentId) : undefined;
  const detailRank = detail ? ranked.findIndex((s) => s.studentId === detail.studentId) + 1 : 0;
  const remark = detail ? await getStudentRemark(sectionId, examId, detail.studentId).catch(() => ({ remark: null })) : null;

  const qs = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ sectionId, examId, q, filter, ...(studentId ? { studentId } : {}) });
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    return `/faculty/class-results?${p.toString()}`;
  };

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px]" style={{ marginTop: 18, alignItems: "start" }}>
      <div>
        <Card padding="18px 22px" className="flex flex-wrap items-center gap-7">
          <div>
            <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>CLASS AVERAGE</div>
            <div style={{ font: "700 34px/1.1 var(--fac-font-sans)", marginTop: 8 }}>{results.classAvg}%</div>
          </div>
          <div style={{ width: 1, height: 44, background: "var(--fac-border)" }} />
          <div style={{ font: "400 14px/1.7 var(--fac-font-sans)", color: "#475569" }}>
            Topper · <strong>{results.toppers[0]?.studentName ?? "--"}</strong>
            <br />
            {results.pass.count} of {results.pass.total} passed
          </div>
        </Card>

        <Card padding="0" className="mt-4">
          <div className="fac-hover-lift flex flex-wrap items-center gap-3" style={{ padding: "14px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
            <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>RANK LIST</span>
            <form action={`/faculty/class-results`} style={{ flex: 1, minWidth: 220, maxWidth: 320 }}>
              <input type="hidden" name="sectionId" value={sectionId} />
              <input type="hidden" name="examId" value={examId} />
              <input type="hidden" name="filter" value={filter} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "10px 14px" }}>
                <input name="q" defaultValue={q} placeholder="Search student or roll number" style={{ flex: 1, border: 0, font: "400 14px/1 var(--fac-font-sans)", background: "none", outline: "none" }} />
              </div>
            </form>
            {["All", "Top 10", "60-79%", "Below 60%"].map((f) => (
              <Link
                key={f}
                href={qs({ filter: f })}
                style={{
                  border: "1px solid var(--fac-border)",
                  borderRadius: 20,
                  padding: "8px 15px",
                  font: "600 13px/1 var(--fac-font-sans)",
                  background: filter === f ? "var(--fac-primary)" : "var(--fac-white)",
                  color: filter === f ? "#fff" : "var(--fac-body)",
                }}
              >
                {f}
              </Link>
            ))}
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: "64px 1.6fr 1fr 1fr", padding: "13px 22px", background: "var(--fac-panel)", borderBottom: "1px solid var(--fac-border)", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".07em", color: "var(--fac-body-muted)" }}
          >
            <div>RANK</div>
            <div>STUDENT</div>
            <div style={{ textAlign: "right" }}>TOTAL</div>
            <div style={{ textAlign: "right" }}>PERCENT</div>
          </div>
          {rows.map((s) => {
            const rank = ranked.findIndex((r) => r.studentId === s.studentId) + 1;
            return (
              <Link
                key={s.studentId}
                href={qs({ studentId: s.studentId })}
                className="fac-hover-lift grid w-full items-center"
                style={{ gridTemplateColumns: "64px 1.6fr 1fr 1fr", padding: "13px 22px", borderBottom: "1px solid var(--fac-divider)" }}
              >
                <span style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 8, padding: "7px 0", textAlign: "center", width: 44 }}>
                  {rank}
                </span>
                <span>
                  <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{s.studentName}</span>
                  <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Roll {s.rollNo ?? "--"}</span>
                </span>
                <span className="fac-font-mono" style={{ textAlign: "right", font: "500 14.5px/1 var(--fac-font-mono)" }}>{s.totalObtained}/{s.totalMax}</span>
                <span className="fac-font-mono" style={{ textAlign: "right", font: "500 14.5px/1 var(--fac-font-mono)", color: "var(--fac-primary)" }}>{s.percent}%</span>
              </Link>
            );
          })}
          {rows.length === 0 && <div style={{ padding: 40, textAlign: "center", font: "400 15px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No student matches this search or filter.</div>}
        </Card>
      </div>

      {detail && (
        <Card padding="20px 22px" className="lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ font: "700 21px/1.2 var(--fac-font-sans)" }}>{detail.studentName}</div>
              <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Roll {detail.rollNo ?? "--"} · rank {detailRank}</div>
            </div>
            <Link
              href={qs({ studentId: undefined })}
              style={{ width: 32, height: 32, border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 8, color: "var(--fac-body-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </Link>
          </div>

          <div style={{ background: "var(--fac-panel)", borderRadius: 11, padding: 16, marginTop: 16, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>TOTAL MARKS</div>
              <div style={{ font: "700 32px/1.1 var(--fac-font-sans)", marginTop: 7 }}>
                {detail.totalObtained}
                <span style={{ font: "400 15px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}> / {detail.totalMax}</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>RANK</div>
              <div style={{ font: "700 32px/1.1 var(--fac-font-sans)", marginTop: 7, color: "var(--fac-primary)" }}>{detailRank}</div>
            </div>
          </div>
          {detail.grade && (
            <div className="flex items-center gap-2.5" style={{ marginTop: 12 }}>
              <span style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "8px 13px" }}>Grade {detail.grade}</span>
              <span style={{ font: "400 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{detail.percent}% average</span>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            {detail.subjects.map((s, i) => (
              <div key={i} className="fac-hover-lift flex items-center gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--fac-divider)", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12px/1 var(--fac-font-sans)" }}>
                  {s.subjectName.slice(0, 2).toUpperCase()}
                </span>
                <span style={{ flex: 1, font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{s.subjectName}</span>
                <span style={{ textAlign: "right" }}>
                  <span className="fac-font-mono" style={{ display: "block", font: "600 15px/1 var(--fac-font-mono)" }}>
                    {s.isAbsent ? "Absent" : <>{s.marksObtained}<span style={{ color: "var(--fac-tertiary)" }}>/{s.maxMarks}</span></>}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <RemarkForm sectionId={sectionId} examId={examId} studentId={detail.studentId} initialRemark={remark?.remark ?? ""} />
          </div>
        </Card>
      )}
    </div>
  );
}
