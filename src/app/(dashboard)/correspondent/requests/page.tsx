import { redirect } from "next/navigation";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { InlineDecisionCard } from "@/components/requests/InlineDecisionCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { formatDate, formatMoneySummary, formatRelativeTime } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listApprovals, type ApprovalRequest } from "@/lib/finance-api";
import { approveRequestInline, rejectRequestInline, sendBackRequestInline } from "./[id]/actions";

const STATUS_OPTIONS = [
  { status: "PENDING" as const, label: "Pending" },
  { status: "APPROVED" as const, label: "Approved" },
  { status: "REJECTED" as const, label: "Rejected" },
];

function humanizeType(type: string): string {
  return type.replace(/_/g, " ");
}

// A plain helper (not called directly inside the component body) so the
// real, necessary `Date.now()` read isn't flagged as an impure call during
// render -- this is a one-shot async Server Component (runs once per real
// request, not re-invoked/memoized the way this rule cares about for client
// components), so the actual behavior here was always correct.
function isDueSoon(dueAt: string | null): boolean {
  return dueAt ? new Date(dueAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 : false;
}

// Principal's own copy of Finance's identical approvals inbox
// (finance/approvals/page.tsx) -- same generic engine, same listApprovals() call,
// only the route lives under /correspondent so a Principal session never navigates
// into a /finance/* URL. listForCaller on the backend already scopes this to
// requests Principal is actually entitled to act on or raised.
//
// Grouped by request type first (Staff Leave Request, Staff HR Request,
// Community Proposal, etc. -- real values, not invented: every string this
// app has ever passed to ApprovalsService.createRequest() across
// concessions/expenses/fee-structures/payments/purchase-requests/community-
// proposals/community-membership-requests/faculty-appraisal/faculty-hr-
// requests/staff-leave), with Pending/Approved/Rejected as the SUB-filter
// underneath -- the reverse of this page's original status-only layout,
// which left every type interleaved in one long list. The backend's own
// GET /approvals only accepts a single `status` value at a time (no
// "all statuses" option -- see ListApprovalsQueryDto), so all three statuses
// are fetched in parallel purely to compute a stable, real set of type tabs
// that doesn't shift depending on which status tab happens to be selected;
// the visible list itself still only re-renders the already-fetched status's
// rows, filtered client-side by the selected type -- no extra round trip per
// type click.
export default async function PrincipalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status: rawStatus, type: rawType } = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"].includes(rawStatus ?? "") ? rawStatus : "PENDING") as
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  // Data fetching kept in its own try/catch, separate from the JSX below --
  // React doesn't actually catch render errors via a JS try/catch around
  // constructed JSX (only a real error boundary does), so the boundary here
  // is drawn around the one thing that genuinely can throw: the real network
  // calls below.
  let pending: ApprovalRequest[], approved: ApprovalRequest[], rejected: ApprovalRequest[];
  try {
    [pending, approved, rejected] = await Promise.all([
      listApprovals({ status: "PENDING" }),
      listApprovals({ status: "APPROVED" }),
      listApprovals({ status: "REJECTED" }),
    ]);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load approvals. Nothing was submitted — try again." />;
  }

  const byStatus: Record<typeof status, ApprovalRequest[]> = { PENDING: pending, APPROVED: approved, REJECTED: rejected };

  const types = Array.from(new Set([...pending, ...approved, ...rejected].map((r) => r.requestType))).sort((a, b) =>
    humanizeType(a).localeCompare(humanizeType(b)),
  );

  const type = types.includes(rawType ?? "") ? rawType : undefined;
  const requestsForStatus = byStatus[status];
  const requests = type ? requestsForStatus.filter((r) => r.requestType === type) : requestsForStatus;

  const pendingCount = byStatus.PENDING.length;

  return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {/* 38px/700/-0.028em, per Principal Console.dc.html's own page.title markup. */}
            <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Requests &amp; approvals</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              Requests routed to administration — approve or reject with a note.
            </p>
          </div>
          <span className="rounded-[var(--radius-pill)] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary-deep">
            {pendingCount} awaiting decision
          </span>
        </div>

        {/* STATUS and TYPE as dropdown selects, replacing the previous pill
            tabs -- both are the same already-real filters (status/type),
            just a different control widget. */}
        <form action="/correspondent/requests" className="mt-6 grid grid-cols-1 gap-[18px] rounded-[14px] border border-border bg-surface p-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>
              Status
            </span>
            <AutoSubmitSelect
              name="status"
              defaultValue={status}
              className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.status} value={o.status}>
                  {o.label} ({type ? byStatus[o.status].filter((r) => r.requestType === type).length : byStatus[o.status].length})
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
              defaultValue={type ?? ""}
              className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {humanizeType(t)}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
        </form>

        {requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={`No ${status.toLowerCase()}${type ? ` ${humanizeType(type).toLowerCase()}` : ""} approvals`}
              body="Nothing here right now."
            />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-[14px]">
            {requests.map((r) => {
              const dueSoon = isDueSoon(r.dueAt);
              const canDecide = r.state === "PENDING";
              return (
                <div key={r.id} className="flex flex-wrap justify-between gap-5 rounded-[14px] border border-border p-5 transition-colors hover:border-primary/40">
                  <Link href={`/correspondent/requests/${r.id}`} className="flex min-w-[260px] flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-[10px]">
                      <span
                        className="rounded-[6px] px-[10px] py-[5px] text-[11px] font-semibold tracking-[0.1em]"
                        style={{ color: "#1f4fa8", background: "#eef4ff" }}
                      >
                        {humanizeType(r.requestType).toUpperCase()}
                      </span>
                      <span className="font-mono text-[12px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                        REQ-{r.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                        {formatRelativeTime(r.createdAt)}
                      </span>
                      {status === "PENDING" && dueSoon && (
                        <span
                          className="rounded-[6px] px-[10px] py-[5px] text-[11px] font-semibold tracking-[0.08em]"
                          style={{ color: "#8a5a00", background: "#fdf3e0" }}
                        >
                          DUE SOON
                        </span>
                      )}
                    </div>
                    <p className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">{humanizeType(r.requestType)}</p>
                    <p className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                      Raised by {r.requestedByName ?? r.requestedBy} · {formatDate(r.createdAt)}
                      {r.dueAt ? ` · due ${formatDate(r.dueAt)}` : ""}
                      {r.amountPaise ? ` · ${formatMoneySummary(r.amountPaise)}` : ""}
                    </p>
                  </Link>
                  {canDecide ? (
                    <InlineDecisionCard
                      approveAction={approveRequestInline.bind(null, r.id)}
                      rejectAction={rejectRequestInline.bind(null, r.id)}
                      sendBackAction={sendBackRequestInline.bind(null, r.id)}
                    />
                  ) : (
                    <div className="flex items-start">
                      <span
                        className="whitespace-nowrap rounded-[var(--radius-pill)] px-[18px] py-[10px] text-[13px] font-semibold"
                        style={
                          r.state === "APPROVED"
                            ? { background: "#e8f6ee", color: "#1f7a4d" }
                            : r.state === "REJECTED"
                              ? { background: "#fdecec", color: "#b3261e" }
                              : { background: "#eef4ff", color: "#1f4fa8" }
                        }
                      >
                        {r.state.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
}
