// Academic approvals -- a real, actionable worklist of academic-admin items
// genuinely pending the Coordinator's decision: a subject offering with no
// teacher, or a section with no class advisor. Both conditions and both
// resolving actions already exist elsewhere in this module -- see
// faculty-academic-coordinator.service.ts's own listAcademicApprovals for
// why the generic approval_request/approval_policy engine this schema also
// has isn't used here (nothing routes to ACADEMIC_COORDINATOR in it today).

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getEligibleFaculty, listAcademicApprovals } from "@/lib/faculty-coordinator-api";
import { AdvisorApprovalRow, OfferingApprovalRow } from "./ApprovalRow";

export default async function ApprovalsPage() {
  try {
    const [{ unassignedOfferings, sectionsWithoutAdvisor }, faculty] = await Promise.all([
      listAcademicApprovals(),
      getEligibleFaculty(),
    ]);
    const total = unassignedOfferings.length + sectionsWithoutAdvisor.length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Academic approvals</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {total} item{total === 1 ? "" : "s"} waiting on you
          </div>
        </div>

        <Card hover={false} style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 4 }}>Subject offerings without a teacher</div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginBottom: 10 }}>Assign a teacher so classes and marks entry can proceed</div>
          {unassignedOfferings.map((item) => (
            <OfferingApprovalRow key={item.subjectOfferingId} item={item} faculty={faculty} />
          ))}
          {unassignedOfferings.length === 0 && <EmptyPanel label="Every subject offering in your scope has a teacher." />}
        </Card>

        <Card hover={false} style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 4 }}>Sections without a class advisor</div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginBottom: 10 }}>Assign an advisor so attendance, notices and results reach parents correctly</div>
          {sectionsWithoutAdvisor.map((item) => (
            <AdvisorApprovalRow key={item.sectionId} item={item} faculty={faculty} />
          ))}
          {sectionsWithoutAdvisor.length === 0 && <EmptyPanel label="Every section in your scope has a class advisor." />}
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load academic approvals."} />;
  }
}
