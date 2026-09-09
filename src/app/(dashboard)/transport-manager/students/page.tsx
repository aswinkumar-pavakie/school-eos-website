// Students -- transport mapping search, aggregated across every route via
// the same /routes/:id/assigned-students endpoint Route detail already uses
// (never a separate/invented student directory). Read-only, matching
// student-transport-allocations' own TRANSPORT_MANAGER read-only grant.

import { TransportStudentsTable } from "@/components/transport/TransportStudentsTable";
import type { TransportStudentRow } from "@/components/transport/TransportStudentsTable";
import { apiFetch } from "@/lib/api";

interface RouteOption {
  id: string;
  name: string;
}

interface RouteAssignedStudentRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  routeStopId: string;
  stopName: string;
  direction: string;
  status: string;
}

export default async function TransportManagerStudentsPage() {
  const routesRes = await apiFetch("/routes");

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Students</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: routes }: { data: RouteOption[] } = await routesRes.json();

  const perRoute = await Promise.all(
    routes.map(async (route) => {
      const res = await apiFetch(`/routes/${route.id}/assigned-students`);
      const rows: RouteAssignedStudentRow[] = res.ok ? (await res.json()).data : [];
      return rows.map(
        (row): TransportStudentRow => ({
          ...row,
          routeId: route.id,
          routeName: route.name,
        }),
      );
    }),
  );
  const students = perRoute.flat();

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Students</h1>
      <p className="mt-1 text-sm text-text-muted">Who is using transport, and on which bus/route/stop.</p>
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <TransportStudentsTable students={students} routes={routes} />
      </div>
    </div>
  );
}
