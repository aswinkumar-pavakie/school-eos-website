import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { getImportJob, listStudentFeeAssignments } from "@/lib/finance-api";
import { cancelImportJobAction } from "../actions";
import { RowsForm } from "./RowsForm";

export default async function ImportJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const job = await getImportJob(id);
    const canCancel = ["DRAFT", "VALIDATED", "VALIDATION_FAILED"].includes(job.state);
    const assignments = canCancel ? await listStudentFeeAssignments() : [];

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{job.fileName}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {job.totalRows != null ? `${job.validRows}/${job.totalRows} valid` : "Not yet validated"}
            </p>
          </div>
          <StatusPill state={job.state} />
        </div>

        {canCancel && <RowsForm id={id} canConfirm={job.state === "VALIDATED"} assignments={assignments} />}

        {job.rowErrors != null && Array.isArray(job.rowErrors) && job.rowErrors.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-wide text-critical-text uppercase">Row errors</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-critical-text">
              {(job.rowErrors as { index: number; message: string }[]).map((e, i) => (
                <li key={i}>Row {e.index + 1}: {e.message}</li>
              ))}
            </ul>
          </section>
        )}

        {canCancel && (
          <form action={cancelImportJobAction.bind(null, id)}>
            <PlainButton variant="danger" type="submit">Cancel job</PlainButton>
          </form>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this import job. If migration 0002 hasn't been run yet, this is expected — see the Finance module README." />;
  }
}
