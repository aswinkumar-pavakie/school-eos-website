// Parent Feedback -- one rating per subject teacher, this parent's own only:
// no class average, no other parents' scores, same
// /parent/students/:id/feedback route the Parent mobile app's own Feedback
// screen already calls. Depends on a new staff_feedback_response table that
// may not have its migration confirmed run yet -- listFeedbackSubjects
// throwing is handled by this page's own try/catch below, same as every
// other page in this app, so a missing table degrades to a plain
// ErrorState rather than a crash.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listChildren, listFeedbackSubjects, resolveSelectedChild } from "@/lib/parent-api";
import { FeedbackStars } from "./FeedbackStars";

export default async function ParentFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const subjects = await listFeedbackSubjects(selected.studentId);

    return (
      <div className="mx-auto max-w-[960px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Feedback</h1>
            <p className="mt-1 text-sm text-text-muted">
              Rate this term&apos;s subject teachers for {selected.studentName}. Only you can see your own rating.
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No subjects yet" body="Feedback opens once subject offerings are set up for this term." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {subjects.map((s) => (
              <div
                key={s.subjectOfferingId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-bold text-text">{s.subjectName}</p>
                  <p className="text-xs text-text-muted">{orDash(s.teacherName)}</p>
                </div>
                <FeedbackStars studentId={selected.studentId} subjectOfferingId={s.subjectOfferingId} myRating={s.myRating} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load feedback. Nothing was changed — try again." />;
  }
}
