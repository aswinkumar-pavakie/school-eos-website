// Exam setup -- pixel-rebuilt from the design's own "isExamSetup" screen
// (New/History tabs). Real data: getCoordinatorStructure() (grade picker)
// and listCoordinatorExams() (real exam records) -- same lib the older
// /faculty/coordinator/exams pages already use.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, StatusPill, type PillTone } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorStructure, listCoordinatorExams } from "@/lib/faculty-coordinator-api";
import { NewExamForm } from "./NewExamForm";

const STATE_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  CONDUCTED: "Conducted",
  MARKS_ENTRY: "Marks entry open",
  VERIFIED: "Verified",
  PUBLISHED: "Published",
  LOCKED: "Locked",
};
const STATE_TONE: Record<string, PillTone> = {
  DRAFT: "gray",
  SCHEDULED: "blue",
  CONDUCTED: "blue",
  MARKS_ENTRY: "amber",
  VERIFIED: "amber",
  PUBLISHED: "green",
  LOCKED: "gray",
};

export default async function ExamSetupPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const isNew = tab !== "history";

  try {
    const [{ grades }, exams] = await Promise.all([getCoordinatorStructure(), listCoordinatorExams()]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 12, padding: 5, width: "fit-content", gap: 4 }}>
          <Link
            href="/academic-coordinator/exams"
            style={{ padding: "10px 34px", borderRadius: 9, fontSize: 14.5, background: isNew ? "var(--acc-accent)" : "transparent", color: isNew ? "#fff" : "var(--acc-body)", fontWeight: isNew ? 700 : 500 }}
          >
            New exam
          </Link>
          <Link
            href="/academic-coordinator/exams?tab=history"
            style={{ padding: "10px 34px", borderRadius: 9, fontSize: 14.5, background: !isNew ? "var(--acc-accent)" : "transparent", color: !isNew ? "#fff" : "var(--acc-body)", fontWeight: !isNew ? 700 : 500 }}
          >
            History
          </Link>
        </div>

        {isNew ? (
          <NewExamForm grades={grades} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {exams.length === 0 && <EmptyPanel label="No exams created yet." />}
            {exams.map((e) => (
              <Card key={e.examId} style={{ padding: "19px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: "var(--acc-navy)" }}>{e.name}</div>
                    <div style={{ fontSize: 13, color: "var(--acc-tertiary)", marginTop: 4 }}>
                      {e.examType.replace(/_/g, " ")}
                      {e.term ? ` · ${e.term}` : ""} · {e.gradeNames.join(", ")}
                    </div>
                  </div>
                  <StatusPill label={STATE_LABELS[e.state] ?? e.state} tone={STATE_TONE[e.state] ?? "gray"} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--acc-divider-soft)" }}>
                  <Link href={`/academic-coordinator/exams/${e.examId}`} style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-accent)", borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 700 }}>
                    Manage
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load exams."} />;
  }
}
