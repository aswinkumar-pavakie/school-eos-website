import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listAllEducationLoanDDs } from "@/lib/finance-api";
import { clearDDAction } from "./actions";

export default async function EducationLoanDDPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; state?: string }>;
}) {
  const { search, state } = await searchParams;
  try {
    const { data: dds } = await listAllEducationLoanDDs({ search: search || undefined, state: state || undefined, pageSize: 50 });

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Education Loan DD</h1>
          <p className="mt-1 text-sm text-text-muted">Demand drafts received against education loans, across every student.</p>
        </div>

        <form className="flex flex-wrap items-center gap-3" action="/finance/education-loan-dd">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search DD reference, student or admission no."
            className="min-w-64 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            <option value="PENDING">Received (pending)</option>
            <option value="CONFIRMED">Cleared</option>
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
        </form>

        {dds.length === 0 ? (
          <EmptyState title="No education loan DDs found" body="Add one from a student's own workspace." />
        ) : (
          <DataTable
            getKey={(d) => d.id}
            rows={dds}
            columns={[
              { header: "DD Reference No.", render: (d) => d.gatewayRef ?? "—" },
              { header: "Student", render: (d) => <Link href={`/finance/students/${d.studentId}`} className="font-bold text-primary hover:underline">{d.studentDisplayName}</Link> },
              { header: "Bank", render: (d) => d.gateway ?? "—" },
              { header: "Amount", align: "right", render: (d) => formatMoneySummary(d.amountPaise) },
              { header: "Status", render: (d) => <StatusPill state={d.state === "PENDING" ? "PENDING" : d.state} /> },
              {
                header: "",
                render: (d) =>
                  d.state === "PENDING" ? (
                    <form action={clearDDAction.bind(null, d.id)}>
                      <PlainButton variant="primary" type="submit" className="px-2.5 py-1 text-xs">Mark cleared</PlainButton>
                    </form>
                  ) : null,
              },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load Education Loan DDs. Nothing was submitted — try again." />;
  }
}
