import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail, formatPercent } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getConcession, getStudent } from "@/lib/finance-api";
import { deleteConcessionAction } from "../actions";
import { EditForm } from "./EditForm";
import { ApprovalStatusPanel } from "../../_shared/ApprovalStatusPanel";

// Reached from the Concessions list's "Approval →" link and from a concession-type
// approval's own "View underlying record →" link — this is the one page both point to.
export default async function ConcessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const concession = await getConcession(id);
    const student = await getStudent(concession.studentId).catch(() => null);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/finance/concessions" className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to Concessions
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{concession.concessionType} concession</h1>
            <p className="mt-1 text-sm text-text-muted">
              {student ? (
                <Link href={`/finance/students/${student.id}`} className="font-bold text-primary hover:underline">
                  {student.displayName} ({student.admissionNo})
                </Link>
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

        {concession.approvalRequestId && <ApprovalStatusPanel approvalRequestId={concession.approvalRequestId} />}

        {concession.state === "PENDING" && (
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
