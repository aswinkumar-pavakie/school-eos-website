import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApprovalTrail } from "@/components/faculty/ApprovalTrail";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listAppraisals } from "@/lib/faculty-staff-api";
import { AppraisalModal } from "./AppraisalModal";

export default async function AppraisalPage() {
  try {
    const appraisals = await listAppraisals();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Appraisal</h1>
            <p className="mt-1 text-sm text-text-muted">Self-assessment &amp; Principal review.</p>
          </div>
          <AppraisalModal />
        </div>

        {appraisals.length === 0 ? (
          <EmptyState title="No appraisals yet" body="Submit your first self-assessment above." />
        ) : (
          <div className="flex flex-col gap-3">
            {appraisals.map((a) => (
              <div key={a.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">Cycle {a.cycle}</p>
                    <p className="text-xs text-text-muted">Submitted {formatDate(a.createdAt)}</p>
                  </div>
                  <StatusPill state={a.state} />
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-text">{a.selfAssessment}</p>
                {a.state === "REVIEWED" && (a.score !== null || a.principalRemark) ? (
                  <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-sm">
                    {a.score !== null ? <p className="text-text">Score: <span className="font-mono font-bold">{a.score}</span></p> : null}
                    {a.principalRemark ? <p className="text-text-muted">{a.principalRemark}</p> : null}
                  </div>
                ) : null}
                <ApprovalTrail steps={a.approvalTrail} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your appraisals. Nothing was changed — try again." />;
  }
}
