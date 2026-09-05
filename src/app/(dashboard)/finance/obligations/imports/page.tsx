import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { listImportJobs } from "@/lib/finance-api";
import { CreateImportJobModal } from "./CreateImportJobModal";

export default async function ImportJobsPage() {
  try {
    const { data: jobs } = await listImportJobs();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Bulk Import Jobs</h1>
            <p className="mt-1 text-sm text-text-muted">Validate never touches real obligations; Confirm only proceeds from a validated job.</p>
          </div>
          <CreateImportJobModal />
        </div>

        {jobs.length === 0 ? (
          <EmptyState title="No import jobs yet" body="Create one to bulk-load obligations for a term." />
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
