// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpLeave" screen.
// Reuses EXISTING real listStaffLeave/createStaffLeaveAction unchanged. Now
// renders the shared src/components/shared-ui/LeaveOdView shell -- Faculty's
// screen is the canonical design every other role's own Leave feature also
// renders verbatim (see parent/leave/page.tsx, principal/my-leave/page.tsx).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listStaffLeave } from "@/lib/faculty-staff-api";
import { LeaveOdView, type LeaveOdRequestRow } from "@/components/shared-ui/LeaveOdView";
import { StaffLeaveForm } from "./StaffLeaveForm";

const LEAVE_LABELS: Record<string, string> = { CASUAL: "Casual leave", MEDICAL: "Medical leave", EARNED: "Earned leave" };

export default async function StaffLeavePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const { tab } = await searchParams;
    const activeTab = tab === "History" ? "History" : "Apply";
    const requests = (await listStaffLeave()).filter((r) => r.leaveType !== "ON_DUTY");

    const rows: LeaveOdRequestRow[] = requests.map((r) => {
      const lastStep = [...r.approvalTrail].reverse().find((s) => s.decision);
      return {
        id: r.id,
        typeLabel: LEAVE_LABELS[r.leaveType] ?? r.leaveType,
        fromDate: r.fromDate,
        toDate: r.toDate,
        reason: r.reason,
        state: r.state,
        decidedLine: lastStep ? `${lastStep.decision === "APPROVED" ? "Approved" : "Rejected"} by ${lastStep.decidedByName ?? lastStep.approverRoleCode}` : null,
      };
    });

    return (
      <LeaveOdView
        title="Leave"
        subtitle="Requests are routed to the academic coordinator, then the Principal's office"
        basePath="/faculty/staff-leave"
        activeTab={activeTab}
        applySlot={<StaffLeaveForm />}
        requests={rows}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed -- try again." />;
  }
}
