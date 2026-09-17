// Feedback -- pixel-rebuilt from the design's own isFeedback screen
// (star ratings per subject teacher). Real staff_feedback_response data
// (listFeedbackSubjects/submitFeedback), this parent's own rating only --
// no class average, no other parents' scores.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listChildren, listFeedbackSubjects, resolveSelectedChild } from "@/lib/parent-api";
import { FeedbackStars } from "./FeedbackStars";

export default async function ParentFeedbackPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const subjects = await listFeedbackSubjects(selected.studentId);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Feedback</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Rate this term&apos;s subject teachers for {selected.studentName}. Only you can see your own rating.</div>
        </div>

        {subjects.length === 0 ? (
          <EmptyPanel label="Feedback opens once subject offerings are set up for this term." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {subjects.map((s) => (
              <div key={s.subjectOfferingId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "18px 22px" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{s.subjectName}</div>
                  <div style={{ fontSize: 13, color: "var(--par-body-muted)" }}>{orDash(s.teacherName)}</div>
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
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load feedback."} />;
  }
}
