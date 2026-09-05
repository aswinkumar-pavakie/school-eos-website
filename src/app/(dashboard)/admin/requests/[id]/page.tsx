// Request detail -- full record + Approve/Reject/Send Back/Resubmit, plus a
// link to this request's full audit trail (same /admin/audit pattern used
// for enrolment/inventory/repair history) rather than a second, bespoke
// history screen.

import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { RequestActions } from "@/components/requests/RequestActions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ApprovalRequestDetail {
  id: string;
  requestType: string;
  subjectObjectType: string | null;
  subjectObjectId: string | null;
  requestedBy: string;
  requestedByName: string | null;
  requestedByRoleCode: string | null;
  payload: Record<string, unknown>;
  state: string;
  approverRoleCode: string | null;
  decidedByName: string | null;
  decisionComment: string | null;
  createdAt: string;
  decidedAt: string | null;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ADMIN_ACCESS_REQUEST: "Administrative user / access request",
  ATTENDANCE_CORRECTION_REQUEST: "Attendance correction",
  STUDENT_RECORD_CORRECTION_REQUEST: "Student administrative record correction",
  INVENTORY_REQUEST: "Inventory request",
  REPAIR_MAINTENANCE_REQUEST: "Repair & maintenance request",
  ADMIN_OTHER_REQUEST: "Other administrative request",
};

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "APPROVED") return "success";
  if (state === "REJECTED") return "critical";
  return "pending";
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/approval-requests/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this request</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: request } = (await res.json()) as { data: ApprovalRequestDetail };
  const { description, reason, effectResult, ...actionDetails } = request.payload as {
    description?: string;
    reason?: string;
    effectResult?: Record<string, unknown>;
    [key: string]: unknown;
  };

  return (
    <div className="mx-auto max-w-[820px]">
      <BackLink href="/admin/requests" label="Back to Requests & Approvals" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Requested by {request.requestedByName ?? "—"}
            {request.requestedByRoleCode ? ` (${request.requestedByRoleCode})` : ""} · {formatDate(request.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={stateTone(request.state)} label={request.state.replace(/_/g, " ")} />
          <Link
            href={`/admin/audit?objectType=approval_request&objectId=${request.id}&returnTo=${encodeURIComponent(`/admin/requests/${request.id}`)}`}
            className="text-[13px] font-semibold text-primary"
          >
            View audit trail
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Request details</h2>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Description</dt>
            <dd className="mt-0.5 text-text">{description ?? "—"}</dd>
          </div>
          {reason && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Reason</dt>
              <dd className="mt-0.5 text-text">{reason}</dd>
            </div>
          )}
          {Object.keys(actionDetails).length > 0 && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Requested change / action</dt>
              <dd className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1.5">
                {Object.entries(actionDetails).map(([key, value]) => (
                  <span key={key} className="text-text-muted">
                    {key}: <span className="font-semibold text-text">{String(value)}</span>
                  </span>
                ))}
              </dd>
            </div>
          )}
          {request.subjectObjectType && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Related record</dt>
              <dd className="mt-0.5 font-mono text-xs text-text-muted">
                {request.subjectObjectType} · {request.subjectObjectId}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {(request.decidedByName || request.decisionComment) && (
        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Decision</h2>
          <p className="mt-2 text-sm text-text">
            {request.decidedByName && (
              <>
                Decided by <span className="font-semibold">{request.decidedByName}</span>
                {request.decidedAt && ` on ${formatDate(request.decidedAt)}`}
              </>
            )}
          </p>
          {request.decisionComment && <p className="mt-1 text-sm text-text-muted">&ldquo;{request.decisionComment}&rdquo;</p>}
        </section>
      )}

      {effectResult && Object.keys(effectResult).length > 0 && (
        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Applied to</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {Object.entries(effectResult).map(([key, value]) => (
              <span key={key} className="text-text-muted">
                {key}: <span className="font-semibold text-text">{String(value)}</span>
              </span>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Actions</h2>
        <div className="mt-3">
          <RequestActions requestId={request.id} state={request.state} />
        </div>
      </section>
    </div>
  );
}
