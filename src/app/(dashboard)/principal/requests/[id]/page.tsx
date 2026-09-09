import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getApproval } from "@/lib/finance-api";
import { DecisionForms } from "./DecisionForms";

// Principal's own copy of Finance's identical approval detail page
// (finance/approvals/[id]/page.tsx) -- same generic engine, only the route lives
// under /principal. Per the permanent Principal-routing rule, every subject type
// has its own Principal-shelled read-only view under /principal/finance/* (see
// finance/_shared/*DetailView.tsx) -- a Principal session must never navigate into
// /finance/*. `refund` is the one exception: it has no standalone detail page
// anywhere, even in Finance's own UI (its closest destination is the whole
// payments list) -- rather than invent one or send Principal into Finance's list,
// the link is simply omitted for that subject type (see the `subjectHref &&`
// guard below).
const SUBJECT_LINKS: Record<string, (id: string) => string> = {
  concession: (id) => `/principal/finance/concessions/${id}`,
  fee_structure: (id) => `/principal/finance/fee-structures/${id}`,
  expense: (id) => `/principal/finance/expenses/${id}`,
  purchase_request: (id) => `/principal/finance/purchase-requests/${id}`,
};

// Payload shape is genuinely different per request type (see each service's
// own approvalsService.createRequest() call: staff-leave.service.ts sends
// {leaveType,fromDate,toDate}, faculty-hr-requests.service.ts sends
// {category,subject}, community-proposals.service.ts sends {title}, etc.) --
// no single request type has every field, so this renders whatever real
// fields exist instead of one type's fields hardcoded for every type (which
// is what previously left this box blank for e.g. STAFF_LEAVE_REQUEST, whose
// payload has no `reason` and whose request carries no amountPaise either).
// *Id-suffixed keys (studentId, membershipId, categoryId, ...) are skipped --
// they're raw foreign-key UUIDs with no human-readable value in the payload
// itself, and showing a bare UUID would be worse than showing nothing.
const HIDDEN_PAYLOAD_KEYS = new Set(["approverScope"]);

function isDisplayableValue(value: unknown): value is string | number | boolean {
  return (typeof value === "string" && value.trim() !== "") || typeof value === "number" || typeof value === "boolean";
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export default async function PrincipalRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [{ request, steps }, actor] = await Promise.all([getApproval(id), getCurrentActor()]);
    const currentStep = steps.find((s) => s.sequenceNo === request.currentStep);
    const isOpen = request.state === "PENDING" || request.state === "RETROSPECTIVE_PENDING";
    const canDecide = isOpen && !!currentStep && actor.roles.includes(currentStep.approverRoleCode) && request.requestedBy !== actor.personId;
    const isRequester = isOpen && request.requestedBy === actor.personId;
    const subjectHref = SUBJECT_LINKS[request.subjectObjectType]?.(request.subjectObjectId);
    const payloadEntries = Object.entries(request.payload ?? {}).filter(
      ([key, value]) => !HIDDEN_PAYLOAD_KEYS.has(key) && !/Id$/.test(key) && isDisplayableValue(value),
    ) as [string, string | number | boolean][];
    const hasDetails = !!request.amountPaise || payloadEntries.length > 0;

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/principal/requests" className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to Approvals
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-text">{request.requestType.replace(/_/g, " ")}</h1>
          <p className="mt-1 text-sm text-text-muted">
            Raised by {request.requestedByName ?? request.requestedBy} on {formatDate(request.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill state={request.state} />
          {request.dueAt && <span className="text-xs text-text-muted">due {formatDate(request.dueAt)}</span>}
          {subjectHref && (
            <Link href={subjectHref} className="text-xs font-bold text-primary hover:underline">
              View underlying record →
            </Link>
          )}
        </div>

        {hasDetails && (
          <div className="rounded-[var(--radius-card)] border border-border bg-field p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted">Details</h2>
            <dl className="mt-2.5 flex flex-col gap-2">
              {request.amountPaise && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-text-muted">Amount</dt>
                  <dd className="font-mono font-bold text-text">{formatMoneyDetail(request.amountPaise)}</dd>
                </div>
              )}
              {payloadEntries.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 text-sm">
                  <dt className="text-text-muted">{humanizeKey(key)}</dt>
                  <dd className="text-right font-semibold text-text">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <section>
          <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Approval chain</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                <span className="font-bold text-text">Step {s.sequenceNo} · {s.approverRoleCode}</span>
                {s.decision ? (
                  <span className="text-text-muted">
                    {s.decision === "APPROVED" ? "Approved" : "Rejected"} · {formatDate(s.decidedAt)}
                    {s.comment ? ` · "${s.comment}"` : ""}
                  </span>
                ) : s.sequenceNo === request.currentStep && request.state === "SENT_BACK" ? (
                  // Not a step decision (approval_step.decision only ever holds
                  // APPROVED/REJECTED) -- the request-level state is the only place
                  // a send-back is recorded, so the chain's own current-step row
                  // must check it separately or it would keep showing "Pending"
                  // forever after a send-back.
                  <StatusPill state="SENT_BACK" />
                ) : s.sequenceNo === request.currentStep ? (
                  <StatusPill state="PENDING" />
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <DecisionForms id={id} canDecide={canDecide} isRequester={isRequester} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this approval. Nothing was submitted — try again." />;
  }
}
