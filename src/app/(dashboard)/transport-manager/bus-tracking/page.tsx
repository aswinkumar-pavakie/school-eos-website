// Bus Tracking -- Transport Manager operational phase, screen 1 of 2 built so
// far (see layout.tsx's own scope note). Every value shown is real: vehicle/
// route/driver come from the same existing Admin Transport data
// (/vehicles, /routes, /drivers, /vehicle-route-assignments); location comes
// from the real telemetry_event table via GET /transport-ops/bus-tracking --
// never a fabricated position, and never labeled "LIVE" unless the telemetry
// is actually within the freshness threshold the backend applies.

import { BusTrackingClient } from "@/components/transport/BusTrackingClient";
import { apiFetch } from "@/lib/api";

interface VehicleOption {
  id: string;
  registrationNo: string;
  model: string | null;
}

export default async function BusTrackingPage() {
  const vehiclesRes = await apiFetch("/vehicles");

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Bus Tracking</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicles }: { data: VehicleOption[] } = await vehiclesRes.json();

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Bus Tracking</h1>
      <p className="mt-1 text-sm text-text-muted">Real GPS location for one bus at a time — from the fleet&apos;s own telemetry.</p>
      <div className="mt-6">
        <BusTrackingClient vehicles={vehicles} />
      </div>
    </div>
  );
}
