import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listApprovals, type ApprovalRequest } from "@/lib/finance-api";

const STATUS_TABS = [
  { status: "PENDING" as const, label: "Pending" },
  { status: "APPROVED" as const, label: "Approved" },
  { status: "REJECTED" as const, label: "Rejected" },
];

function humanizeType(type: string): string {
  return type.replace(/_/g, " ");
}

// Principal's own copy of Finance's identical approvals inbox
// (finance/approvals/page.tsx) -- same generic engine, same listApprovals() call,
// only the route lives under /principal so a Principal session never navigates
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

  try {
    const [pending, approved, rejected] = await Promise.all([
      listApprovals({ status: "PENDING" }),
      listApprovals({ status: "APPROVED" }),
      listApprovals({ status: "REJECTED" }),
    ]);
    const byStatus: Record<typeof status, ApprovalRequest[]> = { PENDING: pending, APPROVED: approved, REJECTED: rejected };

    const types = Array.from(new Set([...pending, ...approved, ...rejected].map((r) => r.requestType))).sort((a, b) =>
      humanizeType(a).localeCompare(humanizeType(b)),
    );

    const type = types.includes(rawType ?? "") ? rawType : undefined;
    const requestsForStatus = byStatus[status];
    const requests = type ? requestsForStatus.filter((r) => r.requestType === type) : requestsForStatus;

    function hrefWith(overrides: { status?: string; type?: string }) {
      const next = new URLSearchParams();
      next.set("status", overrides.status ?? status);
      const nextType = "type" in overrides ? overrides.type : type;
      if (nextType) next.set("type", nextType);
      return `/principal/requests?${next.toString()}`;
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Requests & Approvals</h1>
          <p className="mt-1 text-sm text-text-muted">Everything routed to you for a decision, and what you&apos;ve already decided.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefWith({ type: undefined })}
            className={`rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              !type ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            All types
          </Link>
          {types.map((t) => (
            <Link
              key={t}
              href={hrefWith({ type: t })}
              className={`rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                type === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
              }`}
            >
              {humanizeType(t)}
            </Link>
          ))}
        </div>

        <div className="flex gap-2 border-b border-border">
          {STATUS_TABS.map((t) => (
            <Link
              key={t.status}
              href={hrefWith({ status: t.status })}
              className={`px-3 py-2 text-sm font-bold ${
                status === t.status ? "border-b-2 border-primary text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs font-semibold text-text-muted">
                {type ? byStatus[t.status].filter((r) => r.requestType === type).length : byStatus[t.status].length}
              </span>
            </Link>
          ))}
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title={`No ${status.toLowerCase()}${type ? ` ${humanizeType(type).toLowerCase()}` : ""} approvals`}
            body="Nothing here right now."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/principal/requests/${r.id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-field"
              >
                <div>
                  <p className="text-sm font-bold text-text">{humanizeType(r.requestType)}</p>
                  <p className="text-xs text-text-muted">
                    {r.requestedByName ?? r.requestedBy} · raised {formatDate(r.createdAt)}
                    {r.dueAt ? ` · due ${formatDate(r.dueAt)}` : ""}
                    {r.amountPaise ? ` · ${formatMoneySummary(r.amountPaise)}` : ""}
                  </p>
                </div>
                <StatusPill state={r.state} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load approvals. Nothing was submitted — try again." />;
  }
}
