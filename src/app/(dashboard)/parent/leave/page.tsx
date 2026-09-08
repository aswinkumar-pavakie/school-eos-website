// Parent Leave -- Apply + History. No attachment upload here (deliberately,
// same as the mobile app's own Leave screen -- no storage bucket exists for
// leave attachments yet); a past request's attachment field, if ever
// non-null, is shown as plain text only, never a picker.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listChildren, listLeaveRequests, resolveSelectedChild } from "@/lib/parent-api";
import { LeaveRequestForm } from "./LeaveRequestForm";

export default async function ParentLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const requests = await listLeaveRequests(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Leave</h1>
            <p className="mt-1 text-sm text-text-muted">Apply for leave and track past requests for {selected.studentName}.</p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <LeaveRequestForm studentId={selected.studentId} />
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">History</h2>
            {requests.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No leave requests yet" body="Requests you submit for this child will appear here." />
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">
                          {formatDate(r.fromDate)} – {formatDate(r.toDate)}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">Applied {formatDate(r.createdAt)}</p>
                      </div>
                      <StatusPill state={r.state} />
                    </div>
                    <p className="mt-2 text-sm text-text">{r.reason}</p>
                    {r.skipSchoolTransport ? (
                      <p className="mt-1 text-xs text-text-muted">Bus will not stop for these days</p>
                    ) : null}
                    <p className="mt-2 text-xs text-text-muted">
                      {r.attachmentFileName ? `Attachment: ${r.attachmentFileName}` : "No attachment"}
                    </p>
                    {r.decidedAt ? <p className="mt-1 text-xs text-text-muted">Decided on {formatDate(r.decidedAt)}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load leave requests. Nothing was changed — try again." />;
  }
}
