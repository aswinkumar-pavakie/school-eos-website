// Now renders the shared src/components/shared-ui/LeaveOdView shell, the
// same canonical Apply/History tabbed screen Faculty's own
// staff-leave/page.tsx renders. Real staff_leave_request data
// (listMyLeaveRequests) -- same real data as before, filtered to non-OD
// here (see vice-principal/my-od/page.tsx for the OD-only screen, split out
// to match Faculty's own separate Leave/OD screens instead of one folded
// list). The real "Withdraw" action (WithdrawButton) is preserved as the
// shared view's per-row action slot.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMyLeaveRequests } from "@/lib/principal-staff-api";
import { LeaveOdView, type LeaveOdRequestRow } from "@/components/shared-ui/LeaveOdView";
import { RequestModal } from "./RequestModal";
import { WithdrawButton } from "./WithdrawButton";

const LEAVE_LABELS: Record<string, string> = { CASUAL: "Casual leave", MEDICAL: "Medical leave", EARNED: "Earned leave" };

export default async function VicePrincipalMyLeavePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "History" ? "History" : "Apply";

  let requests: Awaited<ReturnType<typeof listMyLeaveRequests>>;
  try {
    requests = (await listMyLeaveRequests()).filter((r) => r.leaveType !== "ON_DUTY");
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed — try again." />;
  }

  const rows: LeaveOdRequestRow[] = requests.map((r) => {
    const state = r.approvalState ?? r.state;
    return {
      id: r.id,
      typeLabel: LEAVE_LABELS[r.leaveType] ?? r.leaveType,
      fromDate: r.fromDate,
      toDate: r.toDate,
      reason: r.reason,
      state,
      action: state === "PENDING" ? <WithdrawButton id={r.id} /> : null,
    };
  });

  return (
    <LeaveOdView
      title="Leave"
      subtitle="Your own leave requests"
      basePath="/vice-principal/my-leave"
      activeTab={activeTab}
      applySlot={
        <div style={{ marginTop: 18, padding: 40, textAlign: "center", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)" }}>
          <p style={{ font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-body-muted)", marginBottom: 16 }}>Submit a new leave request.</p>
          <RequestModal defaultType="CASUAL" triggerLabel="+ New leave request" />
        </div>
      }
      requests={rows}
    />
  );
}
