"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { VehiclesPanel, type Vehicle, type VehicleAssignment } from "./VehiclesPanel";
import { RoutesPanel, type Route, type RouteAssignment } from "./RoutesPanel";
import { DriversPanel, type Driver, type DriverVehicleAssignment } from "./DriversPanel";

// Attendants and vehicle-route Assignments were removed from this tab bar per
// request -- day-to-day admin work now happens from the person's own profile
// (Student/Faculty "Transport" section) instead of a separate fleet-assignment
// screen. The panels, their DTOs, and the backend endpoints are untouched --
// only this UI entry point was removed, so nothing here is destructive.
const TABS = ["Vehicles", "Routes", "Drivers"] as const;
type Tab = (typeof TABS)[number];

// Lets a link land directly on a tab -- e.g. Dashboard's "Active routes" KPI
// card goes to /admin/transport?tab=routes instead of always opening on
// Vehicles and making the admin click over.
function tabFromSearchParam(value: string | null): Tab {
  const match = TABS.find((t) => t.toLowerCase() === value?.toLowerCase());
  return match ?? "Vehicles";
}

export function TransportTabs({
  vehicles,
  routes,
  drivers,
  driverAssignments,
}: {
  vehicles: Vehicle[];
  routes: Route[];
  drivers: Driver[];
  driverAssignments: DriverVehicleAssignment[];
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => tabFromSearchParam(searchParams.get("tab")));

  const routeNameById = new Map(routes.map((r) => [r.id, r.code ? `${r.name} (${r.code})` : r.name]));
  const driverNameById = new Map(drivers.map((d) => [d.id, d.fullName]));
  const vehicleRegNoById = new Map(vehicles.map((v) => [v.id, v.registrationNo]));

  // vehicle_route_assignment rows -- the same "current assignment" list serves
  // all three panels (Vehicles looks it up by vehicleId, Routes by routeId,
  // Drivers by driverId), so it's fetched once at the page level.
  const vehicleAssignments: VehicleAssignment[] = driverAssignments;
  const routeAssignments: RouteAssignment[] = driverAssignments;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        {tab === "Vehicles" && (
          <VehiclesPanel
            vehicles={vehicles}
            assignments={vehicleAssignments}
            routeNameById={routeNameById}
            driverNameById={driverNameById}
          />
        )}
        {tab === "Routes" && (
          <RoutesPanel routes={routes} assignments={routeAssignments} vehicleRegNoById={vehicleRegNoById} />
        )}
        {tab === "Drivers" && <DriversPanel drivers={drivers} vehicles={vehicles} assignments={driverAssignments} />}
      </div>
    </div>
  );
}
