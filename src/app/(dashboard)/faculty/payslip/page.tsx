import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApprovalTrail } from "@/components/faculty/ApprovalTrail";
import { AuthExpiredError } from "@/lib/api";
import { formatMoneyDetail } from "@/lib/format";
import { getPayslipRequestStatus, listPayslips } from "@/lib/faculty-staff-api";
import { RequestAccessButton } from "./RequestAccessButton";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function PayslipPage() {
  try {
    const status = await getPayslipRequestStatus();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Payslip</h1>
          <p className="mt-1 text-sm text-text-muted">Gated by request — Principal, then Finance. Once approved, access stays granted.</p>
        </div>

        {!status.hasAccess ? (
          <>
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
              <p className="text-sm font-bold text-text">Payslip access required</p>
              <p className="mt-1.5 text-sm text-text-muted">Request access to view your payslips. This goes to the Principal, then Finance for approval.</p>
              {!status.requests.some((r) => r.state === "PENDING") ? (
                <div className="mt-4">
                  <RequestAccessButton />
                </div>
              ) : null}
            </div>

            {status.requests.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-extrabold text-text">My requests</h2>
                {status.requests.map((r) => (
                  <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-text">{r.subject}</p>
                      <StatusPill state={r.state} />
                    </div>
                    <ApprovalTrail steps={r.approvalTrail} />
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <PayslipList />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your payslip access. Nothing was changed — try again." />;
  }
}

async function PayslipList() {
  const payslips = await listPayslips();
  if (payslips.length === 0) {
    return <EmptyState title="No payslips yet" body="Access is approved — no payslip has been processed yet." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {payslips.map((p) => (
        <details key={p.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span className="text-sm font-bold text-text">{MONTH_NAMES[p.month - 1]} {p.year}</span>
            <span className="font-mono text-sm font-bold text-success-text">{formatMoneyDetail(p.netPaise)}</span>
          </summary>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Gross</span><span className="font-mono text-text">{formatMoneyDetail(p.grossPaise)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Deductions</span><span className="font-mono text-text">{formatMoneyDetail(p.deductionsPaise)}</span></div>
            {p.breakdown ? Object.entries(p.breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between"><span className="text-text-muted">{key}</span><span className="font-mono text-text">₹{value}</span></div>
            )) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
