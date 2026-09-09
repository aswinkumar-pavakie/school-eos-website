import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { listTeachingOfferings, listExamsForOffering, getMarksRoster } from "@/lib/faculty-api";
import { RosterForm } from "./RosterForm";

export default async function MarksEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectOfferingId?: string; examSubjectId?: string }>;
}) {
  try {
    const offerings = await listTeachingOfferings();
    const params = await searchParams;
    const subjectOfferingId = params.subjectOfferingId || offerings[0]?.subjectOfferingId;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Marks Entry</h1>
          <p className="mt-1 text-sm text-text-muted">Real exam tabs for the classes you teach — entry only while the exam is open.</p>
        </div>

        {offerings.length === 0 ? (
          <EmptyState title="No teaching assignments" body="You are not currently assigned to teach any subject." />
        ) : (
          <>
            <form action="/faculty/marks-entry" className="flex flex-wrap items-center gap-3">
              <select name="subjectOfferingId" defaultValue={subjectOfferingId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                {offerings.map((o) => (
                  <option key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName} · {o.gradeName} {o.sectionName}</option>
                ))}
              </select>
              <PlainButton type="submit" variant="secondary">Go</PlainButton>
            </form>

            {subjectOfferingId ? <ExamPicker subjectOfferingId={subjectOfferingId} examSubjectId={params.examSubjectId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load marks entry. Nothing was changed — try again." />;
  }
}

async function ExamPicker({ subjectOfferingId, examSubjectId }: { subjectOfferingId: string; examSubjectId?: string }) {
  const exams = await listExamsForOffering(subjectOfferingId);
  if (exams.length === 0) {
    return <EmptyState title="No exams found" body="No exam is configured for this class yet." />;
  }
  const selected = exams.find((e) => e.examSubjectId === examSubjectId) ?? exams[0]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-border">
        {exams.map((e) => (
          <a
            key={e.examSubjectId}
            href={`/faculty/marks-entry?subjectOfferingId=${subjectOfferingId}&examSubjectId=${e.examSubjectId}`}
            className={`px-3 py-2 text-sm font-bold ${selected.examSubjectId === e.examSubjectId ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
          >
            {e.examName}
          </a>
        ))}
      </div>

      <RosterSection examSubjectId={selected.examSubjectId} />
    </div>
  );
}

async function RosterSection({ examSubjectId }: { examSubjectId: string }) {
  const { examSubject, roster } = await getMarksRoster(examSubjectId);
  if (roster.length === 0) {
    return <EmptyState title="No students found" body="This class has no active enrolments." />;
  }
  return <RosterForm exam={examSubject} roster={roster} />;
}
