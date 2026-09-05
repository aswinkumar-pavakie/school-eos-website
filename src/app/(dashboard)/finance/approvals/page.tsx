import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listApprovals } from "@/lib/finance-api";

const TABS = [
  { status: "PENDING" as const, label: "Pending" },
  { status: "APPROVED" as const, label: "Approved" },
  { status: "REJECTED" as const, label: "Rejected" },
];

// The one inbox every approver (Finance, Principal, ...) lands on to decide anything
// routed through the generic approvals engine — a refund, a fee structure activation,
// an above-petty expense, or a Purchase/Service Request. listForCaller on the backend
// already scopes this to requests the caller is actually entitled to act on or raised.
export default async function ApprovalsInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = (["PENDING", "APPROVED", "REJECTED"].includes(rawStatus ?? "") ? rawStatus : "PENDING") as
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  try {
    const requests = await listApprovals({ status });

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Approvals</h1>
          <p className="mt-1 text-sm text-text-muted">Everything routed to you for a decision, and what you've already decided.</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <Link
              key={t.status}
              href={`/finance/approvals?status=${t.status}`}
              className={`px-3 py-2 text-sm font-bold ${
                status === t.status ? "border-b-2 border-primary text-text" : "text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {requests.length === 0 ? (
          <EmptyState title={`No ${status.toLowerCase()} approvals`} body="Nothing here right now." />
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/finance/approvals/${r.id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-field"
              >
                <div>
                  <p className="text-sm font-bold text-text">{r.requestType.replace(/_/g, " ")}</p>
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
