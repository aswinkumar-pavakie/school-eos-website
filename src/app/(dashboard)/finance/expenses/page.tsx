import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listExpenseCategories, listExpenses } from "@/lib/finance-api";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { CreateExpenseCategoryModal } from "./CreateExpenseCategoryModal";

const STATE_OPTIONS = ["RECORDED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PAID"];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; categoryId?: string }>;
}) {
  const { state, categoryId } = await searchParams;
  try {
    const [{ data: expenses }, categories] = await Promise.all([
      listExpenses({ state: state || undefined, categoryId: categoryId || undefined, pageSize: 200 }),
      listExpenseCategories(),
    ]);

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

        <form action="/finance/expenses" className="flex flex-wrap items-center gap-3">
          <select name="categoryId" defaultValue={categoryId ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Category: All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/expenses" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {expenses.length === 0 ? (
          <EmptyState title="No expenses match this filter" body="Try clearing category/status, or record one." />
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
