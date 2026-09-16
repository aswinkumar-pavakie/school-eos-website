// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isExam" screen.
// Reuses the EXISTING real listClassResultExams(sectionId) data (name/type/
// term/state) for the exam list. The per-paper date/time schedule is real
// too, via GET /faculty/exams/:examId/schedule (faculty-exam-schedule.
// controller.ts) -- a new, section/offering-scoped read over the same
// exam_subject data ADMIN/VICE_PRINCIPAL already see unscoped.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections, listClassResultExams, getExamSchedule } from "@/lib/faculty-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ term?: string; examId?: string }> }) {
  try {
    const sections = await listAdvisorSections();
    const sectionId = sections[0]?.sectionId;
    const { term: termParam, examId } = await searchParams;

    if (!sectionId) {
      return (
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Exam</h1>
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not a class advisor -- the exam schedule is only visible to the section's own class advisor." />
          </div>
        </div>
      );
    }

    const exams = await listClassResultExams(sectionId);
    const terms = [...new Set(exams.map((e) => e.term))];
    const activeTerm = termParam && terms.includes(termParam) ? termParam : terms[0];
    const rows = exams.filter((e) => e.term === activeTerm);
    const selected = rows.find((e) => e.examId === examId) ?? rows[0];
    const schedule = selected ? await getExamSchedule(selected.examId).catch(() => []) : [];

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Exam</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Exam schedule for your class</p>

        {terms.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <Tabs items={terms.map((t) => ({ key: t, label: t, href: `/faculty/exams?term=${encodeURIComponent(t)}` }))} activeKey={activeTerm ?? ""} />
          </div>
        )}

        {rows.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="No exam is configured for this term." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.15fr]" style={{ marginTop: 16, alignItems: "start" }}>
            <div className="flex flex-col gap-3">
              {rows.map((e) => {
                const active = e.examId === selected?.examId;
                return (
                  <a
                    key={e.examId}
                    href={`/faculty/exams?term=${encodeURIComponent(activeTerm ?? "")}&examId=${e.examId}`}
                    className="fac-hover-lift flex items-center gap-4"
                    style={{
                      border: "1px solid var(--fac-border)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      background: active ? "var(--fac-tint)" : "var(--fac-white)",
                    }}
                  >
                    <span style={{ width: 56, height: 56, borderRadius: 11, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: active ? "var(--fac-primary)" : "var(--fac-panel)", color: active ? "#fff" : "var(--fac-ink)" }}>
                      <span style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".06em" }}>{e.examType.slice(0, 3).toUpperCase()}</span>
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", font: "700 17px/1.3 var(--fac-font-sans)" }}>{e.examName}</span>
                      <span style={{ display: "block", font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>{e.term}</span>
                    </span>
                    <span
                      style={{
                        font: "600 11.5px/1 var(--fac-font-sans)",
                        letterSpacing: ".05em",
                        borderRadius: 20,
                        padding: "7px 12px",
                        background: e.examState === "PUBLISHED" ? "var(--fac-tint)" : "var(--fac-divider)",
                        color: e.examState === "PUBLISHED" ? "var(--fac-primary)" : "var(--fac-body)",
                      }}
                    >
                      {e.examState}
                    </span>
                  </a>
                );
              })}
            </div>

            <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
              {selected ? (
                <>
                  <div className="flex items-center gap-3">
                    <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".05em", borderRadius: 20, padding: "7px 12px", background: "var(--fac-tint)", color: "var(--fac-primary)" }}>
                      {selected.examState}
                    </span>
                    <span style={{ font: "400 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{selected.examName} · {selected.term}</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    {schedule.length === 0 ? (
                      <FacultyEmptyState message="No paper-by-paper schedule has been published for this exam yet." />
                    ) : (
                      <div
                        className="grid"
                        style={{ gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr", gap: 10, padding: "0 0 10px", borderBottom: "1px solid var(--fac-border)", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".07em", color: "var(--fac-tertiary)" }}
                      >
                        <div>SUBJECT</div>
                        <div>DATE</div>
                        <div>TIME</div>
                        <div style={{ textAlign: "right" }}>MAX MARKS</div>
                      </div>
                    )}
                    {schedule.map((s) => (
                      <div
                        key={s.id}
                        className="grid items-center"
                        style={{ gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr", gap: 10, padding: "13px 0", borderBottom: "1px solid var(--fac-divider)" }}
                      >
                        <div>
                          <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{s.subjectName}</div>
                          {s.room && <div style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 2 }}>Room {s.room}</div>}
                        </div>
                        <div className="fac-font-mono" style={{ font: "400 13.5px/1 var(--fac-font-mono)", color: "#475569" }}>
                          {s.examDate ? new Date(s.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "--"}
                        </div>
                        <div className="fac-font-mono" style={{ font: "400 13.5px/1 var(--fac-font-mono)", color: "#475569" }}>
                          {s.startTime ? s.startTime.slice(0, 5) : "--"}
                          {s.durationMinutes ? ` · ${s.durationMinutes}m` : ""}
                        </div>
                        <div style={{ textAlign: "right", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                          {s.maxMarks}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <FacultyEmptyState message="Select an exam to see its schedule." />
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load exams. Nothing was changed -- try again." />;
  }
}
