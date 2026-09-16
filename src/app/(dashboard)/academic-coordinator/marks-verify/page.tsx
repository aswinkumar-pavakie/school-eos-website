// Marks verification -- pixel-rebuilt from the design's own "isMarksVerify"
// screen: a real SUBMISSIONS list (click through to a detail page to decide)
// plus a real CORRECTION LOG of past send-backs, both drawn from the same
// exam_verification-backed listMarksSubmissions() -- never touches the
// underlying mark rows or a teacher's own publish step.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, StatusPill, type PillTone } from "@/components/academic-coordinator-ui/primitives";
import { listMarksSubmissions } from "@/lib/faculty-coordinator-api";

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

export default async function MarksVerifyPage() {
  try {
    const submissions = await listMarksSubmissions();
    const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
    const corrections = submissions
      .filter((s) => s.status === "SENT_BACK")
      .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Marks verification</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>{pendingCount} submissions pending</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 12, padding: "15px 18px", fontSize: 14.5, color: "var(--acc-navy)", fontWeight: 600 }}>
          Entered marks are read-only here. Sending a submission back records a correction for the teacher to apply.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>SUBMISSIONS</div>
            {submissions.map((s) => (
              <Link key={`${s.sectionId}:${s.examId}`} href={`/academic-coordinator/marks-verify/${s.sectionId}/${s.examId}`} style={{ textDecoration: "none" }}>
                <Card style={{ padding: "17px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--acc-navy)" }}>
                      Class {s.gradeName} {s.sectionName}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--acc-tertiary)", marginTop: 4 }}>{s.examName}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusPill label={STATUS_LABEL[s.status]} tone={STATUS_TONE[s.status]} />
                    <span style={{ color: "var(--acc-tertiary)", fontSize: 15 }}>&rsaquo;</span>
                  </div>
                </Card>
              </Link>
            ))}
            {submissions.length === 0 && (
              <Card hover={false}>
                <EmptyPanel label="No published exam results in your scope yet." />
              </Card>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>CORRECTION LOG</div>
            {corrections.map((c) => (
              <Card key={`${c.sectionId}:${c.examId}`} style={{ padding: "17px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--acc-navy)" }}>
                      Class {c.gradeName} {c.sectionName}
                    </div>
                    <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 5 }}>
                      {c.examName} · {c.decidedAt ? new Date(c.decidedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                    </div>
                  </div>
                  <StatusPill label="Sent back" tone="red" />
                </div>
                {c.comment && (
                  <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--acc-divider-soft)" }}>
                    &ldquo;{c.comment}&rdquo;
                  </div>
                )}
              </Card>
            ))}
            {corrections.length === 0 && (
              <Card hover={false}>
                <EmptyPanel label="No corrections sent back yet." />
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load marks verification."} />;
  }
}
