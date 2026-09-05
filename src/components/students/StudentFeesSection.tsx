import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";

export interface StudentFeeDemand {
  id: string;
  feeHeadName: string | null;
  instalmentNo: number;
  amountPaise: string;
  lateFeePaise: string;
  paidPaise: string;
  dueDate: string;
  state: string;
}

export interface StudentPayment {
  id: string;
  amountPaise: string;
  mode: string;
  state: string;
  initiatedAt: string;
  confirmedAt: string | null;
  receiptNo: string | null;
  issuedOn: string | null;
}

export interface StudentFeeSummary {
  assignment: {
    id: string;
    academicYearName: string;
    netPaise: string;
  } | null;
  demands: StudentFeeDemand[];
  payments: StudentPayment[];
  totalDuePaise: string;
  totalPaidPaise: string;
  totalPendingPaise: string;
  totalOverduePaise: string;
  overallStatus: "NO_ASSIGNMENT" | "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
}

const PAYMENT_STATE_TONE: Record<string, "success" | "pending" | "critical"> = {
  CONFIRMED: "success",
  RECONCILED: "success",
  INITIATED: "pending",
  PENDING: "pending",
  FAILED: "critical",
  REVERSED: "critical",
};

const STATUS_DISPLAY: Record<StudentFeeSummary["overallStatus"], { label: string; tone: "success" | "pending" | "critical" }> = {
  PAID: { label: "Paid", tone: "success" },
  PARTIAL: { label: "Partially paid", tone: "pending" },
  PENDING: { label: "Payment pending", tone: "pending" },
  OVERDUE: { label: "Overdue", tone: "critical" },
  NO_ASSIGNMENT: { label: "No fees assigned", tone: "pending" },
};

const DEMAND_STATE_TONE: Record<string, "success" | "pending" | "critical"> = {
  PAID: "success",
  WAIVED: "success",
  PARTIAL: "pending",
  PENDING: "pending",
  OVERDUE: "critical",
  CANCELLED: "pending",
};

export function StudentFeesSection({ summary }: { summary: StudentFeeSummary }) {
  const display = STATUS_DISPLAY[summary.overallStatus];

  if (!summary.assignment) {
    return (
      <div className="flex items-center gap-2.5">
        <StatusPill tone={display.tone} label={display.label} />
        <p className="text-sm text-text-muted">No fee structure has been assigned to this student yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <StatusPill tone={display.tone} label={display.label} />
          <span className="text-sm text-text-muted">{summary.assignment.academicYearName}</span>
        </div>
        <Link href="/admin/finance" className="text-[13px] font-semibold text-primary">
          Finance module
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Total fee</p>
          <p className="mt-0.5 font-semibold text-text">{formatMoneySummary(summary.assignment.netPaise)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Paid</p>
          <p className="mt-0.5 font-semibold text-text">{formatMoneySummary(summary.totalPaidPaise)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Pending</p>
          <p className={`mt-0.5 font-semibold ${Number(summary.totalPendingPaise) > 0 ? "text-critical-text" : "text-text"}`}>
            {formatMoneySummary(summary.totalPendingPaise)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Overdue</p>
          <p className={`mt-0.5 font-semibold ${Number(summary.totalOverduePaise) > 0 ? "text-critical-text" : "text-text"}`}>
            {formatMoneySummary(summary.totalOverduePaise)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Balance due</p>
          <p className={`mt-0.5 font-semibold ${Number(summary.totalDuePaise) > 0 ? "text-critical-text" : "text-text"}`}>
            {formatMoneySummary(summary.totalDuePaise)}
          </p>
        </div>
      </div>

      {summary.demands.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-border border-t border-border">
          {summary.demands.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <p className="font-semibold text-text">
                  {d.feeHeadName ?? "Fee"}
                  {d.instalmentNo > 1 && <span className="text-text-muted"> · Instalment {d.instalmentNo}</span>}
                </p>
                <p className="text-xs text-text-muted">Due {formatDate(d.dueDate)}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-text-muted">{formatMoneySummary(d.amountPaise)}</span>
                <StatusPill
                  tone={DEMAND_STATE_TONE[d.state] ?? "pending"}
                  label={d.state.charAt(0) + d.state.slice(1).toLowerCase()}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {summary.payments.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Payment history</p>
          <ul className="mt-2 flex flex-col divide-y divide-border border-t border-border">
            {summary.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <div>
                  <p className="font-semibold text-text">
                    {formatMoneySummary(p.amountPaise)}
                    <span className="text-text-muted"> · {p.mode.replace(/_/g, " ").toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(p.confirmedAt ?? p.initiatedAt)}
                    {p.receiptNo && ` · Receipt ${p.receiptNo}`}
                  </p>
                </div>
                <StatusPill tone={PAYMENT_STATE_TONE[p.state] ?? "pending"} label={p.state.charAt(0) + p.state.slice(1).toLowerCase()} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
