import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listMyLeaveRequests } from "@/lib/principal-staff-api";
import { RequestModal } from "./RequestModal";
import { WithdrawButton } from "./WithdrawButton";

const LEAVE_LABELS: Record<string, string> = { CASUAL: "Casual", MEDICAL: "Medical", EARNED: "Earned", ON_DUTY: "On duty" };

export default async function PrincipalMyLeavePage() {
  try {
    const requests = await listMyLeaveRequests();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">My Leave</h1>
            <p className="mt-1 text-sm text-text-muted">Your own leave &amp; on-duty requests.</p>
          </div>
          <RequestModal />
        </div>

        {requests.length === 0 ? (
          <EmptyState title="No leave requests" body="Nothing has been submitted yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="card-hover rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{LEAVE_LABELS[r.leaveType] ?? r.leaveType}</p>
                    <p className="text-xs text-text-muted">{formatDate(r.fromDate)} – {formatDate(r.toDate)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill state={r.approvalState ?? r.state} />
                    {/* r.state itself stays a stale "PENDING" after withdrawal
                        (see staff-leave-request.repository.ts's own comment) --
                        approvalState is the real current status. */}
                    {(r.approvalState ?? r.state) === "PENDING" && <WithdrawButton id={r.id} />}
                  </div>
                </div>
                <p className="mt-2 text-sm text-text">{r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed — try again." />;
  }
}
