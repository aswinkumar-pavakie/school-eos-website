import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApprovalTrail } from "@/components/faculty/ApprovalTrail";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listHrRequests } from "@/lib/faculty-staff-api";
import { RequestModal } from "./RequestModal";

const CATEGORY_LABELS: Record<string, string> = {
  SALARY_QUERY: "Salary query",
  PF_ESI: "PF / ESI",
  INCOME_TAX_DECLARATION: "Income tax declaration",
  INCREMENT_ARREARS: "Increment / arrears",
  BANK_ACCOUNT_CHANGE: "Bank account change",
  SERVICE_CERTIFICATE: "Service certificate",
  PAYSLIP_REQUEST: "Payslip access",
};

export default async function HrRequestsPage() {
  try {
    const requests = await listHrRequests();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">HR Payroll</h1>
            <p className="mt-1 text-sm text-text-muted">Two-step approval — Principal, then Finance.</p>
          </div>
          <RequestModal />
        </div>

        {requests.length === 0 ? (
          <EmptyState title="No requests yet" body="Submit your first HR request above." />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{r.subject}</p>
                    <p className="text-xs text-text-muted">{CATEGORY_LABELS[r.category] ?? r.category} · {formatDate(r.createdAt)}</p>
                  </div>
                  <StatusPill state={r.state} />
                </div>
                {r.description ? <p className="mt-2 text-sm text-text">{r.description}</p> : null}
                <ApprovalTrail steps={r.approvalTrail} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load HR requests. Nothing was changed — try again." />;
  }
}
