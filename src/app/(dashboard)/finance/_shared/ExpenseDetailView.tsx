import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getExpense } from "@/lib/finance-api";
import { deleteExpenseAction, payExpenseAction, submitExpenseAction } from "../expenses/actions";
import { EditForm } from "../expenses/[id]/EditForm";
import { ApprovalStatusPanel } from "./ApprovalStatusPanel";

// Shared by Finance's own /finance/expenses/[id] and Principal's
// /principal/finance/expenses/[id]. Same reasoning as ConcessionDetailView: the
// original page gated its write actions purely on the record's own state, not
// caller role -- Principal must only ever get the read-only view, never edit,
// submit, delete, or mark an expense paid.
export async function ExpenseDetailView({
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
    const [expense, actor] = await Promise.all([getExpense(id), getCurrentActor()]);
    const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");
    const backHref = backHrefOverride ?? "/finance/expenses";
    const backLabel = backLabelOverride ?? "Expenses";

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href={backHref} className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to {backLabel}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{expense.description ?? expense.vendorName ?? "Expense"}</h1>
            <p className="mt-1 text-sm text-text-muted">Incurred {formatDate(expense.incurredOn)}</p>
          </div>
          <StatusPill state={expense.state} />
        </div>

        <p className="text-sm text-text">Amount: <span className="font-mono font-bold">{formatMoneyDetail(expense.amountPaise)}</span></p>

        {expense.approvalRequestId && (
          <ApprovalStatusPanel
            approvalRequestId={expense.approvalRequestId}
            decideHrefOverride={decideHrefBuilder?.(expense.approvalRequestId)}
          />
        )}

        {isFinanceOrAdmin && expense.state === "RECORDED" && <EditForm expense={expense} />}

        {isFinanceOrAdmin && (
          <div className="flex gap-3">
            {expense.state === "RECORDED" && (
              <>
                <form action={submitExpenseAction.bind(null, id)}>
                  <PlainButton variant="primary" type="submit">Submit</PlainButton>
                </form>
                <form action={deleteExpenseAction.bind(null, id)}>
                  <PlainButton variant="danger" type="submit">Delete</PlainButton>
                </form>
              </>
            )}
            {expense.state === "APPROVED" && (
              <form action={payExpenseAction.bind(null, id)}>
                <PlainButton variant="primary" type="submit">Mark paid</PlainButton>
              </form>
            )}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this expense. Nothing was submitted — try again." />;
  }
}
