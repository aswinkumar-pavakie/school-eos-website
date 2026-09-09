// "Approved/Rejected by whom" -- one shared component reused across Student
// Leave, Staff Leave, HR Payroll, Payslip and Appraisal, matching the
// mobile app's own ApprovalTrail component exactly (same data shape,
// src/lib/faculty-api.ts's ApprovalStepSummary).

import type { ApprovalStepSummary } from "@/lib/faculty-api";
import { roleLabel } from "@/lib/faculty-api";
import { formatDate } from "@/lib/format";

export function ApprovalTrail({ steps }: { steps: ApprovalStepSummary[] }) {
  const decided = steps.filter((s) => s.decision);
  if (decided.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2.5">
      {decided.map((s) => (
        <div key={s.sequenceNo} className="text-xs">
          <span className={s.decision === "APPROVED" ? "font-bold text-success-text" : "font-bold text-critical-text"}>
            {s.decision === "APPROVED" ? "Approved" : "Rejected"}
          </span>{" "}
          <span className="text-text">by <strong>{s.decidedByName ?? "—"}</strong> ({roleLabel(s.approverRoleCode)})</span>
          {s.decidedAt ? <span className="text-text-muted"> · {formatDate(s.decidedAt)}</span> : null}
          {s.comment ? <p className="mt-0.5 italic text-text-muted">&ldquo;{s.comment}&rdquo;</p> : null}
        </div>
      ))}
    </div>
  );
}
