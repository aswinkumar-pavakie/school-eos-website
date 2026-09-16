// Correction requests -- real submissions the Academic Coordinator has sent
// back (see faculty-marks.service.ts's own listSentBackSubmissions), scoped
// to only the subjects this teacher actually owns. Submitting a correction
// here never edits the published mark row directly (guard_published_mark,
// a real DB trigger, rejects that) -- it inserts a real mark_correction
// row and flips the coordinator's decision back to PENDING, so this exact
// submission reaches their queue again as a fresh request.

import { redirect } from "next/navigation";
import { Card } from "@/components/faculty-ui/Card";
import { StatusPill } from "@/components/faculty-ui/StatusPill";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getMarksRoster, listSentBackSubmissions } from "@/lib/faculty-api";
import { CorrectionRow } from "./CorrectionRow";

export default async function CorrectionRequestsPage() {
  try {
    const submissions = await listSentBackSubmissions();

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Correction requests</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Marks the Academic Coordinator has sent back for your subjects
        </p>

        {submissions.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="No correction requests right now." />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
            {submissions.map((s) => (
              <SubmissionCard key={`${s.sectionId}:${s.examId}`} submission={s} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load correction requests. Nothing was changed -- try again." />;
  }
}

async function SubmissionCard({
  submission,
}: {
  submission: Awaited<ReturnType<typeof listSentBackSubmissions>>[number];
}) {
  const rosters = await Promise.all(
    submission.subjects.map((s) => getMarksRoster(s.examSubjectId)),
  );

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ font: "700 19px/1.2 var(--fac-font-sans)" }}>
            {submission.gradeName} {submission.sectionName} · {submission.examName}
          </div>
          {submission.comment && (
            <div style={{ font: "500 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 6 }}>
              &ldquo;{submission.comment}&rdquo;
            </div>
          )}
        </div>
        <StatusPill tone="red">Sent back</StatusPill>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
        {rosters.map(({ examSubject, roster }) => (
          <div key={examSubject.examSubjectId}>
            <div style={{ font: "700 14.5px/1.2 var(--fac-font-sans)", color: "var(--fac-navy)", marginBottom: 6 }}>
              {examSubject.examName} · Max {examSubject.maxMarks}
            </div>
            {roster.map((student) => (
              <CorrectionRow key={student.studentId} examSubjectId={examSubject.examSubjectId} student={student} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
