// Reports & Analytics -- every figure comes from a real query against real tables
// (see reports.service.ts on the backend + each section's comment below for the
// exact source). Fees, Library and Requests & Approvals reuse those modules' own
// existing read-only repository/service rather than re-querying the same data a
// second way; every other domain is GET /admin/reports-summary's own count
// queries, same cross-cutting-aggregation convention as the Dashboard.

import { redirect } from "next/navigation";
import {
  AcademicsIcon,
  FacultyIcon,
  FinanceIcon,
  HostelIcon,
  InventoryIcon,
  RequestsIcon,
  StudentsIcon,
  TransportIcon,
} from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ReportBarChart } from "@/components/reports/ReportBarChart";
import { ReportDonutChart, type DonutSlice } from "@/components/reports/ReportDonutChart";
import { ReportLineChart } from "@/components/reports/ReportLineChart";
import { ReportStackedBarChart } from "@/components/reports/ReportStackedBarChart";
import { assignCategoricalColors, STATUS_HEX } from "@/components/reports/chart-colors";
import { AuthExpiredError } from "@/lib/api";
import { formatMoneySummary, statusLabel, statusTone, type StatusTone } from "@/lib/format";
import { getReportsSummary } from "@/lib/reports-api";

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function prettifyLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** statusLabel() falls back to the raw state string when it doesn't recognise a
 * value (e.g. MAINTENANCE, GROUNDED, RESUBMITTED aren't in its table) -- this
 * catches that fallback and prettifies it instead of showing it SCREAMING_CASE. */
function humanizeState(state: string): string {
  const label = statusLabel(state);
  return label === state ? prettifyLabel(state) : label;
}

// Vehicle operational_status isn't in format.ts's shared STATUS_TONE table (that
// table is a cross-app default; blindly reusing its pending fallback would show
// GROUNDED -- a vehicle that can't run -- as merely "pending"). Mapped locally,
// by this section's own real meaning, instead.
const VEHICLE_STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  MAINTENANCE: "pending",
  GROUNDED: "critical",
  RETIRED: "critical",
};

function buildStatusDonut(
  items: { count: number }[],
  getState: (item: { count: number }) => string,
  toneFn: (state: string) => StatusTone,
): DonutSlice[] {
  return items
    .filter((item) => item.count > 0)
    .map((item) => {
      const state = getState(item);
      return { label: humanizeState(state), value: item.count, color: STATUS_HEX[toneFn(state)] };
    });
}

function EmptySection({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-text-muted">{label}</p>;
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase leading-[14px] tracking-[0.06em] text-text-muted">{children}</p>;
}

export default async function ReportsPage() {
  try {
    const data = await getReportsSummary();

    const gradeBarData = data.enrollment.byGrade.map((g) => ({ label: g.gradeName, value: g.count }));
    const genderDonutData = assignCategoricalColors(
      data.enrollment.byGender.map((g) => ({ label: titleCase(g.gender), value: g.count })),
    );

    const designationBarData = data.staff.byDesignation.map((d) => ({ label: d.designation, value: d.count }));

    const attendanceLineData = data.attendance.dailyPercentPresent.map((a) => ({ date: a.date, value: a.percentPresent }));

    const feesDonutData = buildStatusDonut(
      data.fees.byState.map((f) => ({ count: f.count, state: f.state })),
      (item) => (item as unknown as { state: string }).state,
      statusTone,
    );

    const ridershipBarData = data.transport.ridershipByRoute.map((r) => ({ label: r.routeName, value: r.count }));
    const vehicleDonutData = buildStatusDonut(
      data.transport.vehiclesByStatus.map((v) => ({ count: v.count, status: v.status })),
      (item) => (item as unknown as { status: string }).status,
      (state) => VEHICLE_STATUS_TONE[state] ?? "pending",
    );

    const hostelStackedData = data.hostel.occupancyByHostel.map((h) => ({
      label: h.hostelName,
      occupied: h.occupied,
      vacant: h.vacant,
    }));

    const inventoryDonutData = buildStatusDonut(
      data.inventory.byStatus.map((i) => ({ count: i.count, status: i.status })),
      (item) => (item as unknown as { status: string }).status,
      statusTone,
    );

    const libraryDonutData = buildStatusDonut(
      data.library.byStatus.map((l) => ({ count: l.count, status: l.status })),
      (item) => (item as unknown as { status: string }).status,
      statusTone,
    );

    const requestsDonutData = buildStatusDonut(
      data.requestsApprovals.byState.map((r) => ({ count: r.count, state: r.state })),
      (item) => (item as unknown as { state: string }).state,
      statusTone,
    );
    const requestTypeBarData = data.requestsApprovals.byType.map((t) => ({
      label: humanizeState(t.requestType),
      value: t.count,
    }));

    return (
      <div className="mx-auto max-w-[1280px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            Institution-wide figures, straight from each module&apos;s own real data.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Enrollment -- student/person/student_enrolment/section/grade */}
          <SectionCard title="Enrollment" icon={<StudentsIcon className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard eyebrow="Active students" value={String(data.enrollment.activeCount)} detail="Currently enrolled" icon={<StudentsIcon className="h-5 w-5" />} />
              <KpiCard eyebrow="Inactive / archived" value={String(data.enrollment.inactiveCount)} detail="Left, TC issued or archived" icon={<StudentsIcon className="h-5 w-5" />} />
            </div>
            <div className="mt-5">
              <SubLabel>Students by grade</SubLabel>
              {gradeBarData.length === 0 ? <EmptySection label="No active enrolment for the current academic year yet." /> : <ReportBarChart data={gradeBarData} />}
            </div>
            <div className="mt-5">
              <SubLabel>Students by gender</SubLabel>
              {genderDonutData.length === 0 ? <EmptySection label="No gender recorded on active students yet." /> : <ReportDonutChart data={genderDonutData} />}
            </div>
          </SectionCard>

          {/* Staff -- staff (designation, is_teaching) */}
          <SectionCard title="Staff" icon={<FacultyIcon className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard eyebrow="Teaching staff" value={String(data.staff.teachingCount)} detail="Active, is_teaching" icon={<FacultyIcon className="h-5 w-5" />} />
              <KpiCard eyebrow="Non-teaching staff" value={String(data.staff.nonTeachingCount)} detail="Active, support roles" icon={<FacultyIcon className="h-5 w-5" />} />
            </div>
            <div className="mt-5">
              <SubLabel>Staff by designation</SubLabel>
              {designationBarData.length === 0 ? <EmptySection label="No designation recorded on active staff yet." /> : <ReportBarChart data={designationBarData} />}
            </div>
          </SectionCard>

          {/* Attendance -- attendance_session + attendance_record (effective status) */}
          <SectionCard title="Attendance" icon={<AcademicsIcon className="h-4 w-4" />}>
            <SubLabel>Daily attendance %, last 30 days</SubLabel>
            {attendanceLineData.length === 0 ? (
              <EmptySection label="No attendance sessions marked in the last 30 days." />
            ) : (
              <ReportLineChart data={attendanceLineData} />
            )}
          </SectionCard>

          {/* Fees -- reuses AdminFinanceModule's FeeOverviewService (fee_demand) */}
          <SectionCard title="Fees" icon={<FinanceIcon className="h-4 w-4" />}>
            <KpiCard
              eyebrow="Total outstanding"
              value={formatMoneySummary(data.fees.totalOutstandingPaise)}
              detail="Pending, partial & overdue instalments"
              icon={<FinanceIcon className="h-5 w-5" />}
            />
            <div className="mt-5">
              <SubLabel>Collection status</SubLabel>
              {feesDonutData.length === 0 ? <EmptySection label="No fee demands raised yet." /> : <ReportDonutChart data={feesDonutData} />}
            </div>
          </SectionCard>

          {/* Transport -- student_transport_allocation, route, route_stop, vehicle */}
          <SectionCard title="Transport" icon={<TransportIcon className="h-4 w-4" />}>
            <div>
              <SubLabel>Ridership by active route</SubLabel>
              {ridershipBarData.length === 0 ? <EmptySection label="No active routes with student allocations yet." /> : <ReportBarChart data={ridershipBarData} />}
            </div>
            <div className="mt-5">
              <SubLabel>Vehicle operational status</SubLabel>
              {vehicleDonutData.length === 0 ? <EmptySection label="No vehicles registered yet." /> : <ReportDonutChart data={vehicleDonutData} />}
            </div>
          </SectionCard>

          {/* Hostel -- hostel_bed status, joined through room/floor/block/hostel */}
          <SectionCard title="Hostel" icon={<HostelIcon className="h-4 w-4" />}>
            <SubLabel>Occupancy by hostel</SubLabel>
            {hostelStackedData.length === 0 ? (
              <EmptySection label="No hostels with beds configured yet." />
            ) : (
              <ReportStackedBarChart data={hostelStackedData} />
            )}
          </SectionCard>

          {/* Inventory -- inventory_item.status */}
          <SectionCard title="Inventory" icon={<InventoryIcon className="h-4 w-4" />}>
            <SubLabel>Items by status</SubLabel>
            {inventoryDonutData.length === 0 ? <EmptySection label="No inventory items recorded yet." /> : <ReportDonutChart data={inventoryDonutData} />}
          </SectionCard>

          {/* Library -- reuses GET /library/overview (LibraryOverviewService) */}
          <SectionCard title="Library" icon={<AcademicsIcon className="h-4 w-4" />}>
            <KpiCard
              eyebrow="Outstanding fines"
              value={formatMoneySummary(data.library.outstandingFinesPaise)}
              detail="Pending, not yet sent to Finance"
              icon={<AcademicsIcon className="h-5 w-5" />}
            />
            <div className="mt-5">
              <SubLabel>Copies by status</SubLabel>
              {libraryDonutData.length === 0 ? <EmptySection label="No book copies catalogued yet." /> : <ReportDonutChart data={libraryDonutData} />}
            </div>
          </SectionCard>

          {/* Requests & Approvals -- reuses ApprovalRequestRepository (approval_request) */}
          <SectionCard title="Requests & Approvals" icon={<RequestsIcon className="h-4 w-4" />}>
            <div>
              <SubLabel>Status breakdown</SubLabel>
              {requestsDonutData.length === 0 ? <EmptySection label="No requests raised yet." /> : <ReportDonutChart data={requestsDonutData} />}
            </div>
            <div className="mt-5">
              <SubLabel>Volume by request type</SubLabel>
              {requestTypeBarData.length === 0 ? <EmptySection label="No requests raised yet." /> : <ReportBarChart data={requestTypeBarData} />}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Reports &amp; Analytics</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
