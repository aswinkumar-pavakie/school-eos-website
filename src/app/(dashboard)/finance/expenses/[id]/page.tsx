import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getExpense } from "@/lib/finance-api";
import { deleteExpenseAction, payExpenseAction, submitExpenseAction } from "../actions";
import { EditForm } from "./EditForm";
import { ApprovalStatusPanel } from "../../_shared/ApprovalStatusPanel";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const expense = await getExpense(id);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/finance/expenses" className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to Expenses
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{expense.description ?? expense.vendorName ?? "Expense"}</h1>
            <p className="mt-1 text-sm text-text-muted">Incurred {formatDate(expense.incurredOn)}</p>
          </div>
          <StatusPill state={expense.state} />
        </div>

        <p className="text-sm text-text">Amount: <span className="font-mono font-bold">{formatMoneyDetail(expense.amountPaise)}</span></p>

        {expense.approvalRequestId && <ApprovalStatusPanel approvalRequestId={expense.approvalRequestId} />}

        {expense.state === "RECORDED" && <EditForm expense={expense} />}

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
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this expense. Nothing was submitted — try again." />;
  }
}
