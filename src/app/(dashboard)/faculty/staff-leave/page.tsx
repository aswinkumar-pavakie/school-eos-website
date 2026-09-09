import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { ApprovalTrail } from "@/components/faculty/ApprovalTrail";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listStaffLeave } from "@/lib/faculty-staff-api";
import { RequestModal } from "./RequestModal";

const LEAVE_LABELS: Record<string, string> = { CASUAL: "Casual", MEDICAL: "Medical", EARNED: "Earned", ON_DUTY: "On duty" };

export default async function StaffLeavePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const { tab } = await searchParams;
    const odOnly = tab === "od";
    const requests = await listStaffLeave();
    const filtered = requests.filter((r) => (odOnly ? r.leaveType === "ON_DUTY" : r.leaveType !== "ON_DUTY"));

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Leave &amp; OD</h1>
            <p className="mt-1 text-sm text-text-muted">Approval auto-marks your real attendance record for every date covered.</p>
          </div>
          <RequestModal />
        </div>

        <div className="flex gap-2 border-b border-border">
          <Link href="/faculty/staff-leave" className={`px-3 py-2 text-sm font-bold ${!odOnly ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Leave</Link>
          <Link href="/faculty/staff-leave?tab=od" className={`px-3 py-2 text-sm font-bold ${odOnly ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>On duty</Link>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={`No ${odOnly ? "OD" : "leave"} requests`} body="Nothing has been submitted yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{LEAVE_LABELS[r.leaveType] ?? r.leaveType}</p>
                    <p className="text-xs text-text-muted">{formatDate(r.fromDate)} – {formatDate(r.toDate)}</p>
                  </div>
                  <StatusPill state={r.state} />
                </div>
                <p className="mt-2 text-sm text-text">{r.reason}</p>
                <ApprovalTrail steps={r.approvalTrail} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed — try again." />;
  }
}
