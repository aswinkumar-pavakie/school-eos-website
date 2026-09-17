// Admin -> Requests & Approvals -- only the six administrative request types
// Admin is authorized to decide (see the backend's admin-request-types.ts):
// user/access, attendance corrections, student administrative record
// corrections, inventory, repair & maintenance, and other essential
// administrative requests. Academic, disciplinary, staff-performance and
// finance-operational decisions are never representable here at all.
//
// Card design pixel-matched against Principal Console.dc.html's own
// isApprovals markup (line 496-534) -- checked against the literal inline
// styles, not inferred. Real one-click Approve/Reject on each pending card
// (DecideApprovalRequestDto.comment is optional -- a plain click is real
// functionality, not a stub); STATUS and TYPE are now dropdown selects
// instead of the previous pill tabs, both already real, already-supported
// backend filters (`view`/`requestType` on GET /approval-requests) -- this
// swaps the control widget, not the filtering logic. "HIGH PRIORITY" isn't
// shown -- this request type has no due-date/priority field the way the
// generic approvals engine's requests do, so there's nothing real to flag.

import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { InlineDecisionCard } from "@/components/requests/InlineDecisionCard";
import { CreateApprovalRequestModal } from "@/components/requests/CreateApprovalRequestModal";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { listApprovals } from "@/lib/finance-api";
import {
  approveApprovalRequestInline,
  rejectApprovalRequestInline,
  sendBackApprovalRequestInline,
  approveGenericApprovalInline,
  rejectGenericApprovalInline,
  sendBackGenericApprovalInline,
} from "./actions";

interface ApprovalRequestRow {
  id: string;
  requestType: string;
  requestedByName: string | null;
  requestedByRoleCode: string | null;
  payload: { description?: string; reason?: string };
  state: string;
  createdAt: string;
  decidedByName: string | null;
}

const VIEW_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "sent_back", label: "Sent back / requires changes" },
  { value: "history", label: "All history" },
];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ADMIN_ACCESS_REQUEST: "Admin access request",
  ATTENDANCE_CORRECTION_REQUEST: "Attendance correction",
  STUDENT_RECORD_CORRECTION_REQUEST: "Student record correction",
  INVENTORY_REQUEST: "Inventory request",
  REPAIR_MAINTENANCE_REQUEST: "Repair & maintenance request",
  ADMIN_OTHER_REQUEST: "Other administrative request",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; type?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = params.view ?? "pending";
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  query.set("view", view);
  if (params.type) query.set("requestType", params.type);
  if (params.search) query.set("search", params.search);
  query.set("page", String(page));
  query.set("limit", "50");

  const res = await apiFetch(`/approval-requests?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Requests &amp; Approvals</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: requests, meta } = (await res.json()) as {
    data: ApprovalRequestRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  // Second, real source: the generic approvals engine (approval_policy /
  // GET /approvals) -- see actions.ts's own comment on
  // approveGenericApprovalInline for why this is needed. listForCaller on the
  // backend already scopes this to requests genuinely routed to ADMIN as the
  // current approver (e.g. a Principal's own STAFF_LEAVE_REQUEST, self-
  // approval blocked, routed here instead) -- not every request in the
  // system. Only PENDING/APPROVED/REJECTED are supported by this engine's own
  // status filter (ListApprovalsQueryDto), so "sent back" / "all history"
  // simply show none from this source -- the 6-type module above still covers
  // those views for its own requests.
  const genericStatus = view === "pending" ? "PENDING" : view === "approved" ? "APPROVED" : view === "rejected" ? "REJECTED" : undefined;
  const genericRequests = genericStatus ? await listApprovals({ status: genericStatus }) : [];

  const pendingCount = view === "pending" ? meta.total + genericRequests.length : undefined;

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    next.set("view", view);
    if (params.type) next.set("type", params.type);
    if (params.search) next.set("search", params.search);
    next.set("page", overrides.page ?? String(page));
    return `/admin/requests?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* 38px/700/-0.028em, per Principal Console.dc.html's own page.title markup. */}
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Requests &amp; approvals</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Limited, high-importance administrative requests only — academic, disciplinary and finance decisions
            stay with Principal/Vice Principal/Finance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount !== undefined && (
            <span className="rounded-[var(--radius-pill)] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary-deep">
              {pendingCount} awaiting decision
            </span>
          )}
          <CreateApprovalRequestModal />
        </div>
      </div>

      <form action="/admin/requests" className="mt-6 grid grid-cols-1 gap-[18px] rounded-[14px] border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>
            Status
          </span>
          <AutoSubmitSelect
            name="view"
            defaultValue={view}
            className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
          >
            {VIEW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>
            Type
          </span>
          <AutoSubmitSelect
            name="type"
            defaultValue={params.type ?? ""}
            className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
          >
            <option value="">All types</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>
            Search
          </span>
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Requester name or description…"
            className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
          />
        </label>
      </form>

      {requests.length === 0 ? (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">No requests match this view</p>
          <p className="mt-1.5 text-sm text-text-muted">Nothing here right now.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-[14px]">
          {requests.map((r) => (
            <div key={r.id} className="card-hover flex flex-wrap justify-between gap-5 rounded-[14px] border border-border p-5">
              <div className="flex min-w-[260px] flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <span
                    className="rounded-[6px] px-[10px] py-[5px] text-[11px] font-semibold tracking-[0.1em]"
                    style={{ color: "#1f4fa8", background: "#eef4ff" }}
                  >
                    {(REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType).toUpperCase()}
                  </span>
                  <span className="font-mono text-[12px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    REQ-{r.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    {formatRelativeTime(r.createdAt)}
                  </span>
                </div>
                <p className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">
                  {REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}
                </p>
                {(r.payload?.description || r.payload?.reason) && (
                  <p className="text-[14px]" style={{ color: "var(--color-text-secondary, var(--color-text-muted))" }}>
                    {r.payload.description ?? r.payload.reason}
                  </p>
                )}
                <p className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                  Raised by {r.requestedByName ?? "—"}
                  {r.requestedByRoleCode ? ` · ${r.requestedByRoleCode}` : ""}
                </p>
              </div>

              {r.state === "PENDING" || r.state === "RESUBMITTED" ? (
                <InlineDecisionCard
                  approveAction={approveApprovalRequestInline.bind(null, r.id)}
                  rejectAction={rejectApprovalRequestInline.bind(null, r.id)}
                  sendBackAction={sendBackApprovalRequestInline.bind(null, r.id)}
                  rejectRequiresComment={false}
                />
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="whitespace-nowrap rounded-[var(--radius-pill)] px-[18px] py-[10px] text-[13px] font-semibold"
                    style={
                      r.state === "APPROVED"
                        ? { background: "#e8f6ee", color: "#1f7a4d" }
                        : r.state === "REJECTED"
                          ? { background: "#fdecec", color: "#b3261e" }
                          : { background: "var(--color-field)", color: "var(--color-text-muted)" }
                    }
                  >
                    {r.state.replace(/_/g, " ")}
                  </span>
                  {r.decidedByName && (
                    <span className="text-[12px] text-text-muted">by {r.decidedByName}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </a>
            )}
          </div>
        </div>
      )}

      {genericRequests.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Other requests routed to you</h2>
            <span className="rounded-[var(--radius-pill)] border border-border bg-field px-2.5 py-1 text-xs font-semibold text-text-muted">
              {genericRequests.length}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-text-muted">
            Not one of the 6 request types above — routed to you here because the normal approver was blocked from
            self-approving (e.g. a Principal&apos;s own leave request).
          </p>
          <div className="mt-4 flex flex-col gap-[14px]">
            {genericRequests.map((r) => (
              <div key={r.id} className="card-hover flex flex-wrap justify-between gap-5 rounded-[14px] border border-border p-5">
                <div className="flex min-w-[260px] flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <span
                      className="rounded-[6px] px-[10px] py-[5px] text-[11px] font-semibold tracking-[0.1em]"
                      style={{ color: "#1f4fa8", background: "#eef4ff" }}
                    >
                      {r.requestType.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="font-mono text-[12px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                      REQ-{r.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                      {formatRelativeTime(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">
                    {r.requestType.replace(/_/g, " ")}
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    Raised by {r.requestedByName ?? "—"}
                  </p>
                </div>

                {r.state === "PENDING" ? (
                  <InlineDecisionCard
                    approveAction={approveGenericApprovalInline.bind(null, r.id)}
                    rejectAction={rejectGenericApprovalInline.bind(null, r.id)}
                    sendBackAction={sendBackGenericApprovalInline.bind(null, r.id)}
                    rejectRequiresComment={true}
                    sendBackRequiresComment={true}
                  />
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="whitespace-nowrap rounded-[var(--radius-pill)] px-[18px] py-[10px] text-[13px] font-semibold"
                      style={
                        r.state === "APPROVED"
                          ? { background: "#e8f6ee", color: "#1f7a4d" }
                          : r.state === "REJECTED"
                            ? { background: "#fdecec", color: "#b3261e" }
                            : { background: "var(--color-field)", color: "var(--color-text-muted)" }
                      }
                    >
                      {r.state.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
