import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { listTeachingOfferings, getSubjectRecords } from "@/lib/faculty-api";
import { orDash } from "@/lib/format";

export default async function SubjectRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectOfferingId?: string }>;
}) {
  try {
    const offerings = await listTeachingOfferings();
    const params = await searchParams;
    const subjectOfferingId = params.subjectOfferingId || offerings[0]?.subjectOfferingId;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Subject Records</h1>
          <p className="mt-1 text-sm text-text-muted">Real marks, exam by exam, for the classes you teach.</p>
        </div>

        {offerings.length === 0 ? (
          <EmptyState title="No teaching assignments" body="You are not currently assigned to teach any subject." />
        ) : (
          <>
            <form action="/faculty/subject-records" className="flex flex-wrap items-center gap-3">
              <select name="subjectOfferingId" defaultValue={subjectOfferingId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                {offerings.map((o) => (
                  <option key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName} · {o.gradeName} {o.sectionName}</option>
                ))}
              </select>
              <PlainButton type="submit" variant="secondary">Go</PlainButton>
            </form>

            {subjectOfferingId ? <RecordsSection subjectOfferingId={subjectOfferingId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load subject records. Nothing was changed — try again." />;
  }
}

async function RecordsSection({ subjectOfferingId }: { subjectOfferingId: string }) {
  const records = await getSubjectRecords(subjectOfferingId);

  return (
    <div className="flex flex-col gap-4">
      <KpiGrid>
        <KpiCard eyebrow="Students" value={String(records.studentCount)} />
        <KpiCard eyebrow="Class average" value={records.classAvg !== null ? `${records.classAvg}%` : "—"} />
        <KpiCard eyebrow="Highest" value={records.highest !== null ? `${records.highest}%` : "—"} />
      </KpiGrid>

      {records.students.length === 0 ? (
        <EmptyState title="No students found" body="This class has no active enrolments." />
      ) : (
        <div className="flex flex-col gap-2">
          {records.students.map((st) => (
            <details key={st.studentId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text">{st.studentName}</p>
                  <p className="text-xs text-text-muted">Roll {orDash(st.rollNo)} · {st.totalObtained}/{st.totalMax}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-text">
                  {st.grade ? `${st.grade} · ${st.percent}%` : "No marks yet"}
                </span>
              </summary>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {st.exams.map((ex, i) => (
                  <div key={i} className="rounded-[var(--radius-input)] border border-border bg-field px-3 py-2 text-xs">
                    <p className="font-bold uppercase tracking-wide text-text-muted">{ex.examName}</p>
                    <p className="mt-0.5 font-mono font-bold text-text">{ex.isAbsent ? "Absent" : `${ex.marksObtained}/${ex.maxMarks}`}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-muted">Attendance {st.attendancePercent !== null ? `${st.attendancePercent}%` : "—"} · Guardian {orDash(st.guardianPhone)}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
