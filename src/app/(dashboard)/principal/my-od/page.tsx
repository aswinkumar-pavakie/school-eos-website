// New route -- splits Principal's own on-duty requests out of the folded
// my-leave list into their own screen, matching Faculty's own separate
// Leave/OD screens (staff-od/page.tsx) instead of one combined list. Same
// real backend as my-leave (staff_leave_request, leaveType='ON_DUTY') --
// zero new backend, reuses listMyLeaveRequests/createMyLeaveAction/
// withdrawMyLeaveAction from my-leave/actions.ts unchanged. Renders the
// same shared src/components/shared-ui/LeaveOdView shell Leave uses.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listMyLeaveRequests } from "@/lib/principal-staff-api";
import { LeaveOdView, type LeaveOdRequestRow } from "@/components/shared-ui/LeaveOdView";
import { RequestModal } from "../my-leave/RequestModal";
import { WithdrawButton } from "../my-leave/WithdrawButton";

export default async function PrincipalMyOdPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "History" ? "History" : "Apply";

  let requests: Awaited<ReturnType<typeof listMyLeaveRequests>>;
  try {
    requests = (await listMyLeaveRequests()).filter((r) => r.leaveType === "ON_DUTY");
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed — try again." />;
  }

  const rows: LeaveOdRequestRow[] = requests.map((r) => {
    const state = r.approvalState ?? r.state;
    return {
      id: r.id,
      typeLabel: "On-duty request",
      fromDate: r.fromDate,
      toDate: r.toDate,
      reason: r.reason,
      state,
      action: state === "PENDING" ? <WithdrawButton id={r.id} /> : null,
    };
  });

  return (
    <LeaveOdView
      title="OD"
      subtitle="Apply for on-duty and track your applications"
      basePath="/principal/my-od"
      activeTab={activeTab}
      applySlot={
        <div style={{ marginTop: 18, padding: 40, textAlign: "center", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)" }}>
          <p style={{ font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-body-muted)", marginBottom: 16 }}>Submit a new on-duty request.</p>
          <RequestModal defaultType="ON_DUTY" triggerLabel="+ New OD request" />
        </div>
      }
      requests={rows}
    />
  );
}
