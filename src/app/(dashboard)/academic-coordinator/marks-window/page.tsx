// Marks entry window -- real exam.marks_entry_opens_at/closes_at columns,
// same ones Admin's own Examinations module reads/writes on the identical
// table. A real, enforced gate: faculty-marks.service.ts's own save()
// rejects a subject teacher's entry outside this window, even while the
// exam is still in its MARKS_ENTRY state.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { listCoordinatorExams } from "@/lib/faculty-coordinator-api";
import { MarksWindowRow } from "./MarksWindowRow";

export default async function MarksWindowPage() {
  try {
    const exams = await listCoordinatorExams();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Marks entry window</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            Set the dates you want subject teachers to enter marks for each exam
          </div>
        </div>

        <Card hover={false} style={{ padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ minWidth: 620 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 110px", gap: 12, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>EXAM</div>
              <div>OPENS</div>
              <div>CLOSES</div>
              <div></div>
            </div>
            {exams.map((exam) => (
              <MarksWindowRow key={exam.examId} exam={exam} />
            ))}
            {exams.length === 0 && <EmptyPanel label="No exams configured in your scope yet." />}
          </div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load marks entry windows."} />;
  }
}
