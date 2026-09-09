import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, orDash } from "@/lib/format";
import { listStudentLeaveRequests } from "@/lib/faculty-api";
import { approveAction } from "./actions";
import { RejectModal } from "./RejectModal";

export default async function StudentLeavePage() {
  try {
    const requests = await listStudentLeaveRequests();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Student Leave</h1>
          <p className="mt-1 text-sm text-text-muted">Requests for the sections you advise. Approving auto-marks the student on leave for every date requested.</p>
        </div>

        {requests.length === 0 ? (
          <EmptyState title="No leave requests" body="Nothing has been submitted for your sections yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{r.studentName} <span className="font-normal text-text-muted">· Roll {orDash(r.rollNo)}</span></p>
                    <p className="text-xs text-text-muted">{orDash(r.gradeName)} {orDash(r.sectionName)} · {formatDate(r.fromDate)} – {formatDate(r.toDate)}</p>
                  </div>
                  <StatusPill state={r.state} />
                </div>
                <p className="mt-2 text-sm text-text">{r.reason}</p>

                {r.state === "PENDING" && r.approvalRequestId ? (
                  <div className="mt-3 flex gap-2">
                    <form action={approveAction.bind(null, r.approvalRequestId)}>
                      <PlainButton type="submit" variant="primary">Approve</PlainButton>
                    </form>
                    <RejectModal approvalRequestId={r.approvalRequestId} />
                  </div>
                ) : r.decidedAt ? (
                  <p className="mt-2 text-xs text-text-muted">Decided on {formatDate(r.decidedAt)}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load student leave requests. Nothing was changed — try again." />;
  }
}
