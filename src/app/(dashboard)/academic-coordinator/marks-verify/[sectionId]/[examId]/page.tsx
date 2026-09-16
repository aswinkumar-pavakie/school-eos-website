// Marks verification -- submission detail, pixel-rebuilt from the design's
// own "isSubmission" screen. Real data only: getMarksSubmissionDetail reuses
// the exact same computation Performance shows for this section+exam (class
// average, per-student totals/grades), plus the real exam_verification
// decision (status/comment/decidedAt). Note the design's mock is written
// around a single subject-paper submission ("Max 50"); this coordinator
// module reviews a whole class's cross-subject exam results at once (same
// unit Performance/Reports already work in), so "average/highest/lowest"
// here are real per-student overall percentages, not one subject's raw
// marks -- an honest adaptation of the design to this app's real data
// shape, not a fabricated number.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, StatusPill, type PillTone } from "@/components/academic-coordinator-ui/primitives";
import { getMarksSubmissionDetail, listMarksSubmissions } from "@/lib/faculty-coordinator-api";
import { VerifyPanel } from "./VerifyPanel";

const STATUS_TONE: Record<string, PillTone> = {
  PENDING: "amber",
  VERIFIED: "green",
  SENT_BACK: "red",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  SENT_BACK: "Sent back",
};

export default async function MarksSubmissionDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string; examId: string }>;
}) {
  const { sectionId, examId } = await params;
  try {
    const [detail, submissions] = await Promise.all([
      getMarksSubmissionDetail(sectionId, examId),
      listMarksSubmissions(),
    ]);
    const meta = submissions.find((s) => s.sectionId === sectionId && s.examId === examId);
    const appeared = detail.students.filter((s) => s.percent !== null);
    const highest = appeared.length > 0 ? Math.max(...appeared.map((s) => s.percent!)) : null;
    const lowest = appeared.length > 0 ? Math.min(...appeared.map((s) => s.percent!)) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link href="/academic-coordinator/marks-verify" style={{ textDecoration: "none" }}>
              <span style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
                ← Back to verification
              </span>
            </Link>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--acc-navy)" }}>
                Class {meta?.gradeName} {meta?.sectionName}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 2 }}>{meta?.examName}</div>
            </div>
          </div>
          <StatusPill label={STATUS_LABEL[detail.status]} tone={STATUS_TONE[detail.status]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <Card style={{ padding: "19px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>AVERAGE</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--acc-navy)", marginTop: 8 }}>{detail.classAvg ?? "—"}%</div>
          </Card>
          <Card style={{ padding: "19px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>HIGHEST</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--acc-navy)", marginTop: 8 }}>{highest ?? "—"}%</div>
          </Card>
          <Card style={{ padding: "19px 20px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>LOWEST</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--acc-navy)", marginTop: 8 }}>{lowest ?? "—"}%</div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" }}>
          <Card style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>Student marks</div>
              <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)" }}>{detail.students.length} students</div>
            </div>
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {[...detail.students]
                .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1))
                .map((s) => (
                  <div key={s.studentId} style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                    <div style={{ width: 36, height: 36, flex: "0 0 36px", borderRadius: 9, background: "var(--acc-accent-tint)", color: "var(--acc-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700 }}>
                      {s.studentName.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{s.studentName}</div>
                      <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12, color: "var(--acc-tertiary)" }}>Roll {s.rollNo ?? "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 15, color: "var(--acc-navy)" }}>
                        {s.totalObtained}/{s.totalMax}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--acc-tertiary)" }}>{s.grade ?? "—"}</div>
                    </div>
                  </div>
                ))}
              {detail.students.length === 0 && <EmptyPanel label="No students found for this exam." />}
            </div>
          </Card>

          <VerifyPanel sectionId={sectionId} examId={examId} examName={meta?.examName ?? "this exam"} />
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this submission."} />;
  }
}
