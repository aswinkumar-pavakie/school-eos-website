import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listExpenseCategories, listExpenses } from "@/lib/finance-api";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { CreateExpenseCategoryModal } from "./CreateExpenseCategoryModal";

export default async function ExpensesPage() {
  try {
    const [{ data: expenses }, categories] = await Promise.all([listExpenses(), listExpenseCategories()]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Expenses</h1>
            <p className="mt-1 text-sm text-text-muted">At/below a category's petty-cash limit, Finance clears it directly; above, Principal approves.</p>
          </div>
          <div className="flex gap-2">
            <CreateExpenseCategoryModal />
            <CreateExpenseModal categories={categories} />
          </div>
        </div>

        {expenses.length === 0 ? (
          <EmptyState title="No expenses yet" body="Record one to start tracking school spend." />
        ) : (
          <DataTable
            getKey={(e) => e.id}
            rows={expenses}
            columns={[
              { header: "Description", render: (e) => <Link href={`/finance/expenses/${e.id}`} className="font-bold text-primary hover:underline">{e.description ?? e.vendorName ?? "Expense"}</Link> },
              { header: "Incurred", render: (e) => formatDate(e.incurredOn) },
              { header: "Amount", align: "right", render: (e) => formatMoneySummary(e.amountPaise) },
              { header: "Status", render: (e) => <StatusPill state={e.state} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load expenses. Nothing was submitted — try again." />;
  }
}
