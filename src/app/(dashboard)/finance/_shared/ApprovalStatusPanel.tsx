import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import { getApproval } from "@/lib/finance-api";

/**
 * Shows a record's own approval chain right where the record itself lives — Fee
 * Structures, Expenses, Concessions and Purchase/Service Requests all embed this
 * instead of making "what happened to my request" a separate page you have to
 * navigate to just to read. The "Decide / manage" link still goes to the full
 * approvals page — that's the one place Approve/Reject/Withdraw actually live — but
 * seeing the status itself never requires leaving this page.
 */
export async function ApprovalStatusPanel({ approvalRequestId }: { approvalRequestId: string }) {
  const result = await getApproval(approvalRequestId).catch(() => null);
  if (!result) return null;
  const { request, steps } = result;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Approval status</h2>
        <StatusPill state={request.state} />
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-text">Step {s.sequenceNo} · {s.approverRoleCode}</span>
            {s.decision ? (
              <span className="text-text-muted">
                {s.decision === "APPROVED" ? "Approved" : "Rejected"} · {formatDate(s.decidedAt)}
                {s.comment ? ` · "${s.comment}"` : ""}
              </span>
            ) : s.sequenceNo === request.currentStep ? (
              <StatusPill state="PENDING" />
            ) : (
              <span className="text-text-muted">—</span>
            )}
          </li>
        ))}
      </ol>
      {request.dueAt && (request.state === "PENDING" || request.state === "RETROSPECTIVE_PENDING") && (
        <p className="mt-2 text-xs text-text-muted">Due {formatDate(request.dueAt)}</p>
      )}
      <Link href={`/finance/approvals/${approvalRequestId}`} className="mt-3 inline-block text-xs font-bold text-primary hover:underline">
        Decide / manage this approval →
      </Link>
    </section>
  );
}
