// Parent Leave -- now renders the shared src/components/shared-ui/LeaveOdView
// shell, the same canonical Apply/History tabbed screen Faculty's own
// staff-leave/page.tsx renders. Real leave_request data (listLeaveRequests)
// -- same real data as before, only the presentation (tabs instead of a
// side-by-side layout) is now shared. No attachment upload here
// (deliberately, same as the mobile app's own Leave screen -- no storage
// bucket exists for leave attachments yet); a past request's attachment
// field, if ever non-null, is shown as plain text only, never a picker.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listChildren, listLeaveRequests, resolveSelectedChild } from "@/lib/parent-api";
import { LeaveOdView, type LeaveOdRequestRow } from "@/components/shared-ui/LeaveOdView";
import { LeaveRequestForm } from "./LeaveRequestForm";

export default async function ParentLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; tab?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, tab } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const activeTab = tab === "History" ? "History" : "Apply";
    const requests = await listLeaveRequests(selected.studentId);

    const rows: LeaveOdRequestRow[] = requests.map((r) => ({
      id: r.id,
      typeLabel: "Leave",
      fromDate: r.fromDate,
      toDate: r.toDate,
      reason: r.reason + (r.skipSchoolTransport ? " (bus will not stop for these days)" : ""),
      state: r.state,
      decidedLine: r.decidedAt ? `Decided on ${new Date(r.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : null,
    }));

    return (
      <div>
        <div className="mb-4 flex justify-end">
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>
        <LeaveOdView
          title="Leave"
          subtitle={`Apply for leave and track past requests for ${selected.studentName}`}
          basePath={`/parent/leave?studentId=${selected.studentId}`}
          activeTab={activeTab}
          applySlot={<LeaveRequestForm studentId={selected.studentId} />}
          requests={rows}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load leave requests. Nothing was changed — try again." />;
  }
}
