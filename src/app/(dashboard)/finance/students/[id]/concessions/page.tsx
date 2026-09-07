import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatMoneySummary, formatPercent } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listConcessions } from "@/lib/finance-api";

export default async function StudentConcessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { data: concessions } = await listConcessions({ studentId: id, pageSize: 100 });

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Link href={`/finance/concessions?studentId=${id}`}>
            <PlainButton variant="primary">+ Apply Concession</PlainButton>
          </Link>
        </div>
        {concessions.length === 0 ? (
          <EmptyState title="No concessions for this student" body="Apply one from here — it routes through Finance, then Principal." />
        ) : (
          <DataTable
            getKey={(c) => c.id}
            rows={concessions}
            columns={[
              { header: "Type", render: (c) => c.concessionType },
              { header: "Value", align: "right", render: (c) => (c.percent ? formatPercent(c.percent) : formatMoneySummary(c.amountPaise ?? "0")) },
              { header: "Reason", render: (c) => c.reason },
              { header: "Status", render: (c) => <StatusPill state={c.state} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this student's concessions. Nothing was submitted — try again." />;
  }
}
