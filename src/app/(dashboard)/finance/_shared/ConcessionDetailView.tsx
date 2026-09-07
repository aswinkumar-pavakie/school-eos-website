import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail, formatPercent } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getConcession, getStudent } from "@/lib/finance-api";
import { deleteConcessionAction } from "../concessions/actions";
import { EditForm } from "../concessions/[id]/EditForm";
import { ApprovalStatusPanel } from "./ApprovalStatusPanel";

// Shared by Finance's own /finance/concessions/[id] and Principal's
// /principal/finance/concessions/[id]. Unlike PurchaseRequestDetailView, the
// original page had no role gate on its write actions (Edit/Cancel) at all -- they
// only checked the record's own state -- so this extraction adds one: Principal is
// never FINANCE/ADMIN and must only ever see the read-only view, never edit or
// cancel a concession itself.
export async function ConcessionDetailView({
  id,
  backHrefOverride,
  backLabelOverride,
  decideHrefBuilder,
}: {
  id: string;
  backHrefOverride?: string;
  backLabelOverride?: string;
  decideHrefBuilder?: (approvalRequestId: string) => string;
}) {
  try {
    const concession = await getConcession(id);
    const [student, actor] = await Promise.all([
      getStudent(concession.studentId).catch(() => null),
      getCurrentActor(),
    ]);
    const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");
    const backHref = backHrefOverride ?? "/finance/concessions";
    const backLabel = backLabelOverride ?? "Concessions";

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href={backHref} className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to {backLabel}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{concession.concessionType} concession</h1>
            <p className="mt-1 text-sm text-text-muted">
              {student ? (
                isFinanceOrAdmin ? (
                  <Link href={`/finance/students/${student.id}`} className="font-bold text-primary hover:underline">
                    {student.displayName} ({student.admissionNo})
                  </Link>
                ) : (
                  <span className="font-bold text-text">{student.displayName} ({student.admissionNo})</span>
                )
              ) : (
                concession.studentId
              )}
              {" · "}Raised {formatDate(concession.createdAt)}
            </p>
          </div>
          <StatusPill state={concession.state} />
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <p className="text-sm text-text">
            Value:{" "}
            <span className="font-mono font-bold">
              {concession.percent ? formatPercent(concession.percent) : formatMoneyDetail(concession.amountPaise ?? "0")}
            </span>
          </p>
          <p className="mt-2 text-sm text-text">Reason: {concession.reason}</p>
        </div>

        {concession.approvalRequestId && (
          <ApprovalStatusPanel
            approvalRequestId={concession.approvalRequestId}
            decideHrefOverride={decideHrefBuilder?.(concession.approvalRequestId)}
          />
        )}

        {isFinanceOrAdmin && concession.state === "PENDING" && (
          <>
            <EditForm concession={concession} />
            <form action={deleteConcessionAction.bind(null, id)}>
              <PlainButton variant="danger" type="submit">Cancel concession</PlainButton>
            </form>
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this concession. Nothing was submitted — try again." />;
  }
}
