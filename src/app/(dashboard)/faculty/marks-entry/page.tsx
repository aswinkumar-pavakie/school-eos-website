// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEntryMarks"
// screen. Reuses EXISTING real data (listTeachingOfferings,
// listExamsForOffering, getMarksRoster) and actions unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listTeachingOfferings, listExamsForOffering, getMarksRoster } from "@/lib/faculty-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { PixelRosterForm } from "./PixelRosterForm";
import { SubjectClassSelect } from "./SubjectClassSelect";

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
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Entry marks</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Enter marks while the window is open, then save a draft or publish
        </p>

        {offerings.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not currently assigned to teach any subject." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2" style={{ marginTop: 22 }}>
              <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 20px" }}>
                <SubjectClassSelect offerings={offerings} subjectOfferingId={subjectOfferingId} />
              </div>
              {subjectOfferingId ? <ExamSelectCard subjectOfferingId={subjectOfferingId} examSubjectId={params.examSubjectId} /> : null}
            </div>

            {subjectOfferingId ? <ExamPicker subjectOfferingId={subjectOfferingId} examSubjectId={params.examSubjectId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load marks entry. Nothing was changed -- try again." />;
  }
}

async function ExamSelectCard({ subjectOfferingId, examSubjectId }: { subjectOfferingId: string; examSubjectId?: string }) {
  const exams = await listExamsForOffering(subjectOfferingId);
  const selected = exams.find((e) => e.examSubjectId === examSubjectId) ?? exams[0];
  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--fac-tint)", flex: "0 0 40px" }} />
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>EXAM</span>
          <span style={{ display: "block", font: "600 17px/1.2 var(--fac-font-sans)", marginTop: 6 }}>{selected?.examName ?? "--"}</span>
        </span>
      </div>
      {exams.length > 1 && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          {exams.map((e) => (
            <a
              key={e.examSubjectId}
              href={`/faculty/marks-entry?subjectOfferingId=${subjectOfferingId}&examSubjectId=${e.examSubjectId}`}
              style={{
                border: "1px solid var(--fac-border)",
                borderRadius: 20,
                padding: "8px 14px",
                font: "600 12.5px/1 var(--fac-font-sans)",
                background: e.examSubjectId === selected?.examSubjectId ? "var(--fac-primary)" : "var(--fac-white)",
                color: e.examSubjectId === selected?.examSubjectId ? "#fff" : "var(--fac-body)",
              }}
            >
              {e.examName}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

async function ExamPicker({ subjectOfferingId, examSubjectId }: { subjectOfferingId: string; examSubjectId?: string }) {
  const exams = await listExamsForOffering(subjectOfferingId);
  if (exams.length === 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <FacultyEmptyState message="No exam is configured for this class yet." />
      </div>
    );
  }
  const selected = exams.find((e) => e.examSubjectId === examSubjectId) ?? exams[0]!;
  return <RosterSection examSubjectId={selected.examSubjectId} />;
}

async function RosterSection({ examSubjectId }: { examSubjectId: string }) {
  const { examSubject, roster } = await getMarksRoster(examSubjectId);
  if (roster.length === 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <FacultyEmptyState message="This class has no active enrolments." />
      </div>
    );
  }
  return <PixelRosterForm exam={examSubject} roster={roster} />;
}
