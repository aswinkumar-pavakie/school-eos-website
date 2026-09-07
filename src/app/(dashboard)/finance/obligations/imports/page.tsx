import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { listImportJobs } from "@/lib/finance-api";
import { CreateImportJobModal } from "./CreateImportJobModal";

const STATE_OPTIONS = ["DRAFT", "VALIDATED", "VALIDATION_FAILED", "COMMITTED", "CANCELLED"];

export default async function ImportJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  try {
    const { data: allJobs } = await listImportJobs();
    const jobs = state ? allJobs.filter((j) => j.state === state) : allJobs;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Bulk Import Jobs</h1>
            <p className="mt-1 text-sm text-text-muted">Validate never touches real obligations; Confirm only proceeds from a validated job.</p>
          </div>
          <CreateImportJobModal />
        </div>

        <form action="/finance/obligations/imports" className="flex flex-wrap items-center gap-3">
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/obligations/imports" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {jobs.length === 0 ? (
          <EmptyState title="No import jobs match this filter" body="Try clearing the status filter, or create one to bulk-load obligations for a term." />
        ) : (
          <DataTable
            getKey={(j) => j.id}
            rows={jobs}
            columns={[
              { header: "File", render: (j) => j.fileName },
              { header: "Rows", render: (j) => (j.totalRows != null ? `${j.validRows}/${j.totalRows}` : "—") },
              { header: "Status", render: (j) => <StatusPill state={j.state} /> },
              { header: "", render: (j) => <Link href={`/finance/obligations/imports/${j.id}`} className="text-xs font-bold text-primary hover:underline">View →</Link> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load import jobs. If migration 0002 hasn't been run yet, this is expected — see the Finance module README." />;
  }
}
