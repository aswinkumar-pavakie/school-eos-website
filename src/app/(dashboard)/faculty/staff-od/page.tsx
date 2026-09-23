// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpOd" screen.
// Thin route: same real backend model as Staff leave (staff_leave_request,
// leaveType='ON_DUTY') -- reuses listStaffLeave/createStaffLeaveAction
// unchanged, zero new backend. Now renders the same shared
// src/components/shared-ui/LeaveOdView shell Leave uses -- same design,
// per instruction, since OD is the same kind of request feature.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listStaffLeave } from "@/lib/faculty-staff-api";
import { LeaveOdView, type LeaveOdRequestRow } from "@/components/shared-ui/LeaveOdView";
import { StaffLeaveForm } from "../staff-leave/StaffLeaveForm";

export default async function StaffOdPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const { tab } = await searchParams;
    const activeTab = tab === "History" ? "History" : "Apply";
    const requests = (await listStaffLeave()).filter((r) => r.leaveType === "ON_DUTY");

    const rows: LeaveOdRequestRow[] = requests.map((r) => {
      const lastStep = [...r.approvalTrail].reverse().find((s) => s.decision);
      return {
        id: r.id,
        typeLabel: "On-duty request",
        fromDate: r.fromDate,
        toDate: r.toDate,
        reason: r.reason,
        state: r.state,
        decidedLine: lastStep ? `${lastStep.decision === "APPROVED" ? "Approved" : "Rejected"} by ${lastStep.decidedByName ?? lastStep.approverRoleCode}` : null,
      };
    });

    return (
      <LeaveOdView
        title="OD"
        subtitle="Apply for on-duty and track your applications"
        basePath="/faculty/staff-od"
        activeTab={activeTab}
        applySlot={<StaffLeaveForm defaultType="ON_DUTY" />}
        requests={rows}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed -- try again." />;
  }
}
