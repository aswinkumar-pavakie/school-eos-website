// Student Boarding Monitor -- Transport Manager operational phase, screen 2 of
// 2 built so far (see layout.tsx's own scope note). Students come from the
// same existing student_transport_allocation data Admin's own Route detail
// page already reads (never all school students); boarding status is the
// real student_trip_status / bus_boarding_event pipeline; leave status is the
// existing student_leave_request module -- see
// GET /transport-ops/boarding-monitor for the exact precedence rules.

import { BoardingMonitorClient } from "@/components/transport/BoardingMonitorClient";
import { apiFetch } from "@/lib/api";

interface VehicleOption {
  id: string;
  registrationNo: string;
  model: string | null;
}

export default async function BoardingMonitorPage() {
  const vehiclesRes = await apiFetch("/vehicles");

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Student Boarding</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicles }: { data: VehicleOption[] } = await vehiclesRes.json();

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Student Boarding</h1>
      <p className="mt-1 text-sm text-text-muted">Who has boarded a bus today, and who hasn&apos;t.</p>
      <div className="mt-6">
        <BoardingMonitorClient vehicles={vehicles} />
      </div>
    </div>
  );
}
