import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listAdvisorSections, listClassResultExams, getClassResults } from "@/lib/faculty-api";

export default async function ClassResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; examId?: string }>;
}) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Class Results</h1>
          <p className="mt-1 text-sm text-text-muted">Whole-section results across every subject, one exam at a time.</p>
        </div>

        {sections.length === 0 ? (
          <EmptyState title="You are not a class advisor" body="Class results are only available to the section's own class advisor." />
        ) : (
          <>
            <form action="/faculty/class-results" className="flex flex-wrap items-center gap-3">
              <select name="sectionId" defaultValue={sectionId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>{s.gradeName} {s.sectionName}</option>
                ))}
              </select>
              <PlainButton type="submit" variant="secondary">Go</PlainButton>
            </form>

            {sectionId ? <ExamPicker sectionId={sectionId} examId={params.examId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load class results. Nothing was changed — try again." />;
  }
}

async function ExamPicker({ sectionId, examId }: { sectionId: string; examId?: string }) {
  const exams = await listClassResultExams(sectionId);
  const selectedExamId = examId || exams[0]?.examId;

  if (exams.length === 0) {
    return <EmptyState title="No exams found" body="No exam is configured for this section yet." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <form action="/faculty/class-results" className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="sectionId" value={sectionId} />
        <select name="examId" defaultValue={selectedExamId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
          {exams.map((e) => (
            <option key={e.examId} value={e.examId}>{e.examName}{e.term ? ` · ${e.term}` : ""}</option>
          ))}
        </select>
        <PlainButton type="submit" variant="secondary">View results</PlainButton>
      </form>

      {selectedExamId ? <ResultsSection sectionId={sectionId} examId={selectedExamId} /> : null}
    </div>
  );
}

async function ResultsSection({ sectionId, examId }: { sectionId: string; examId: string }) {
  const results = await getClassResults(sectionId, examId);

  return (
    <div className="flex flex-col gap-5">
      <KpiGrid>
        <KpiCard eyebrow="Class average" value={results.classAvg !== null ? `${results.classAvg}%` : "—"} />
        <KpiCard eyebrow="Passed" value={`${results.pass.count} / ${results.pass.total}`} />
        <KpiCard eyebrow="Topper" value={results.topper !== null ? `${results.topper}%` : "—"} />
      </KpiGrid>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h2 className="text-sm font-extrabold text-text">Grade distribution</h2>
        <div className="mt-3 flex flex-col gap-2">
          {results.gradeDistribution.map((band) => (
            <div key={band.grade} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs font-semibold text-text-muted">{band.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-field">
                <div className="h-full rounded-full bg-primary" style={{ width: `${band.percentOfClass}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-text">{band.count}</span>
            </div>
          ))}
        </div>
      </div>

      {results.toppers.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <h2 className="text-sm font-extrabold text-text">Toppers</h2>
          <ol className="mt-3 flex flex-col divide-y divide-border">
            {results.toppers.map((s, i) => (
              <li key={s.studentId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-text">{i + 1}. {s.studentName}</span>
                <span className="font-mono font-bold text-text">{s.percent}%</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {results.students.map((st) => (
          <details key={st.studentId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text">{st.studentName}</p>
                <p className="text-xs text-text-muted">Roll {orDash(st.rollNo)} · {st.totalObtained}/{st.totalMax}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-text">
                {st.grade ? `${st.grade} · ${st.percent}%` : "No marks"} {st.passed ? "" : "· Not passed"}
              </span>
            </summary>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {st.subjects.map((sub, i) => (
                <div key={i} className="rounded-[var(--radius-input)] border border-border bg-field px-3 py-2 text-xs">
                  <p className="font-bold uppercase tracking-wide text-text-muted">{sub.subjectName}</p>
                  <p className="mt-0.5 font-mono font-bold text-text">{sub.isAbsent ? "Absent" : `${sub.marksObtained}/${sub.maxMarks}`}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
