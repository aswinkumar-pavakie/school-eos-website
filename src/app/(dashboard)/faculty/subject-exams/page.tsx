// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isSubExams" screen
// (nav label "Exams", under MY SUBJECTS). Reuses EXISTING real data
// (listTeachingOfferings, listExamsForOffering -- the same function
// marks-entry uses). Per-paper schedule is real too, via the same
// GET /faculty/exams/:examId/schedule used by the MY CLASS Exam screen (see
// /faculty/exams) -- scoped down to subject offerings this teacher actually
// teaches.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listTeachingOfferings, listExamsForOffering, getExamSchedule } from "@/lib/faculty-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { SubjectExamsClassPicker } from "./SubjectExamsClassPicker";

export default async function SubjectExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectOfferingId?: string; examSubjectId?: string }>;
}) {
  try {
    const offerings = await listTeachingOfferings();
    const params = await searchParams;
    const subjectOfferingId = params.subjectOfferingId || offerings[0]?.subjectOfferingId;
    const offering = offerings.find((o) => o.subjectOfferingId === subjectOfferingId);

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Exams</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Exam schedule published for {offering ? `${offering.subjectName} · ${offering.gradeName}-${offering.sectionName}` : "your subject"}
        </p>

        {offerings.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not currently assigned to teach any subject." />
          </div>
        ) : (
          <>
            <div style={{ marginTop: 22 }}>
              <SubjectExamsClassPicker offerings={offerings} subjectOfferingId={subjectOfferingId} />
            </div>
            {subjectOfferingId ? <ExamsList subjectOfferingId={subjectOfferingId} examSubjectId={params.examSubjectId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load exams. Nothing was changed -- try again." />;
  }
}

async function ExamsList({ subjectOfferingId, examSubjectId }: { subjectOfferingId: string; examSubjectId?: string }) {
  const exams = await listExamsForOffering(subjectOfferingId);
  const selected = exams.find((e) => e.examSubjectId === examSubjectId) ?? exams[0];
  const schedule = selected
    ? (await getExamSchedule(selected.examId).catch(() => [])).filter((s) => s.subjectOfferingId === subjectOfferingId)
    : [];
  const paper = schedule[0] ?? null;

  if (exams.length === 0) {
    return (
      <div style={{ marginTop: 18 }}>
        <FacultyEmptyState message="No exam is configured for this class yet." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.15fr]" style={{ marginTop: 16, alignItems: "start" }}>
      <div className="flex flex-col gap-3">
        {exams.map((e) => {
          const active = e.examSubjectId === selected?.examSubjectId;
          return (
            <a
              key={e.examSubjectId}
              href={`/faculty/subject-exams?subjectOfferingId=${subjectOfferingId}&examSubjectId=${e.examSubjectId}`}
              className="fac-hover-lift flex items-center gap-4"
              style={{ border: "1px solid var(--fac-border)", borderRadius: 12, padding: "16px 18px", background: active ? "var(--fac-tint)" : "var(--fac-white)" }}
            >
              <span style={{ width: 56, height: 56, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "var(--fac-primary)" : "var(--fac-panel)", color: active ? "#fff" : "var(--fac-ink)" }}>
                <span style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".06em" }}>{e.examType.slice(0, 3).toUpperCase()}</span>
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "700 17px/1.3 var(--fac-font-sans)" }}>{e.examName}</span>
                <span style={{ display: "block", font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>{e.term} · Max {e.maxMarks}</span>
              </span>
              <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".05em", borderRadius: 20, padding: "7px 12px", background: e.examState === "PUBLISHED" ? "var(--fac-tint)" : "var(--fac-divider)", color: e.examState === "PUBLISHED" ? "var(--fac-primary)" : "var(--fac-body)" }}>
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
              <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".05em", borderRadius: 20, padding: "7px 12px", background: "var(--fac-tint)", color: "var(--fac-primary)" }}>{selected.examState}</span>
              <span style={{ font: "400 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{selected.examName} · {selected.term}</span>
            </div>
            <div style={{ marginTop: 18 }}>
              {!paper ? (
                <FacultyEmptyState message="No date/time has been published for your subject's paper in this exam yet." />
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                  {[
                    { label: "DATE", value: paper.examDate ? new Date(paper.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "--" },
                    { label: "TIME", value: paper.startTime ? paper.startTime.slice(0, 5) : "--" },
                    { label: "DURATION", value: paper.durationMinutes ? `${paper.durationMinutes}m` : "--" },
                    { label: "ROOM", value: paper.room ?? "--" },
                  ].map((t) => (
                    <div key={t.label} style={{ background: "var(--fac-panel)", borderRadius: 10, padding: 14 }}>
                      <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>{t.label}</div>
                      <div className="fac-font-mono" style={{ font: "600 16px/1 var(--fac-font-mono)", marginTop: 9 }}>{t.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <FacultyEmptyState message="Select an exam to see its schedule." />
        )}
      </div>
    </div>
  );
}
