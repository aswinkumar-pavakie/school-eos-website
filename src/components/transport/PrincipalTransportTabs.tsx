"use client";

// Principal's read-only Transport oversight -- same 3 top-level areas as
// Admin's own Transport tabs (Vehicles/Routes/Drivers), same data, but built
// fresh rather than reusing VehiclesPanel/RoutesPanel/DriversPanel verbatim:
// those panels embed create/edit forms and Admin-only server actions inline
// in every row, not just a display concern. Only Admin can create/edit
// vehicles, routes, or drivers -- Transport operational management stays with
// Admin; Principal gets the same oversight visibility, no write controls.

import Link from "next/link";
import { useState } from "react";
import type { Vehicle, VehicleAssignment } from "./VehiclesPanel";
import type { Route, RouteAssignment } from "./RoutesPanel";
import type { Driver, DriverVehicleAssignment } from "./DriversPanel";
import { StatusPill } from "@/components/dashboard/StatusPill";

const TABS = ["Vehicles", "Routes", "Drivers"] as const;
type Tab = (typeof TABS)[number];

function vehicleTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "GROUNDED" || status === "RETIRED") return "critical";
  return "pending";
}

/** Mirrors VehiclesPanel/RoutesPanel/DriversPanel's own currentAssignmentFor* --
 * a truly-open row (effectiveTo null) is always the real current one when
 * there is one; only fall back to "most recently started" otherwise. */
function currentAssignment<T extends { effectiveFrom: string; effectiveTo: string | null }>(
  rows: T[],
): T | null {
  if (rows.length === 0) return null;
  const openEnded = rows.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : rows;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

export function PrincipalTransportTabs({
  vehicles,
  routes,
  drivers,
  assignments,
}: {
  vehicles: Vehicle[];
  routes: Route[];
  drivers: Driver[];
  assignments: (VehicleAssignment | RouteAssignment | DriverVehicleAssignment)[];
}) {
  const [tab, setTab] = useState<Tab>("Vehicles");
  const [statusFilter, setStatusFilter] = useState("");

  const routeNameById = new Map(routes.map((r) => [r.id, r.code ? `${r.name} (${r.code})` : r.name]));
  const driverNameById = new Map(drivers.map((d) => [d.id, d.fullName]));
  const vehicleRegNoById = new Map(vehicles.map((v) => [v.id, v.registrationNo]));

  const filteredVehicles = statusFilter ? vehicles.filter((v) => v.operationalStatus === statusFilter) : vehicles;

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
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-text-muted">{vehicles.length} vehicles</p>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="GROUNDED">Grounded</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </label>
            </div>
            <ul className="mt-4 flex flex-col divide-y divide-border">
              {filteredVehicles.length === 0 && (
                <li className="py-6 text-center text-sm text-text-muted">No vehicles match this filter.</li>
              )}
              {filteredVehicles.map((vehicle) => {
                const assignment = currentAssignment(
                  (assignments as VehicleAssignment[]).filter((a) => a.vehicleId === vehicle.id),
                );
                const routeName = assignment ? (routeNameById.get(assignment.routeId) ?? null) : null;
                const driverName = assignment?.driverId ? (driverNameById.get(assignment.driverId) ?? null) : null;
                return (
                  <li key={vehicle.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-[13.5px] font-semibold text-text">{vehicle.registrationNo}</p>
                        <p className="text-xs text-text-muted">
                          {vehicle.model ?? "—"} · {vehicle.capacity} seats
                          {vehicle.ownership ? ` · ${vehicle.ownership.toLowerCase()}` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {routeName ? (
                            <>
                              Route: <span className="font-semibold text-text">{routeName}</span>
                              {driverName && (
                                <>
                                  {" "}
                                  · Driver: <span className="font-semibold text-text">{driverName}</span>
                                </>
                              )}
                            </>
                          ) : (
                            "No route currently assigned"
                          )}
                        </p>
                      </div>
                      <StatusPill tone={vehicleTone(vehicle.operationalStatus)} label={vehicle.operationalStatus} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "Routes" && (
          <div>
            <p className="text-[13px] text-text-muted">{routes.length} routes</p>
            <ul className="mt-4 flex flex-col divide-y divide-border">
              {routes.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No routes yet.</li>}
              {routes.map((route) => {
                const assignment = currentAssignment(
                  (assignments as RouteAssignment[]).filter((a) => a.routeId === route.id),
                );
                const vehicleRegNo = assignment ? (vehicleRegNoById.get(assignment.vehicleId) ?? null) : null;
                return (
                  <li key={route.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13.5px] font-semibold text-text">
                          {route.name} {route.code && <span className="font-mono text-text-muted">· {route.code}</span>}
                        </p>
                        <p className="text-xs text-text-muted">
                          {route.direction.toLowerCase()}
                          {route.distanceKm ? ` · ${route.distanceKm} km` : ""} · {route.stops.length} stops
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {vehicleRegNo ? (
                            <>
                              Vehicle: <span className="font-semibold text-text">{vehicleRegNo}</span>
                            </>
                          ) : (
                            "No vehicle currently assigned"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <StatusPill tone={route.status === "ACTIVE" ? "success" : "pending"} label={route.status} />
                        <Link href={`/principal/transport/routes/${route.id}`} className="text-[13px] font-semibold text-primary">
                          View route
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "Drivers" && (
          <div>
            <p className="text-[13px] text-text-muted">{drivers.length} drivers</p>
            <ul className="mt-4 flex flex-col divide-y divide-border">
              {drivers.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No drivers yet.</li>}
              {drivers.map((driver) => {
                const assignment = currentAssignment(
                  (assignments as DriverVehicleAssignment[]).filter((a) => a.driverId === driver.id),
                );
                const vehicleRegNo = assignment ? (vehicleRegNoById.get(assignment.vehicleId) ?? null) : null;
                return (
                  <li key={driver.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13.5px] font-semibold text-text">{driver.fullName}</p>
                        <p className="text-xs text-text-muted">
                          {driver.phone ?? "—"} · licence {driver.licenceNo}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {vehicleRegNo ? (
                            <>
                              Driving <span className="font-semibold text-text">{vehicleRegNo}</span>
                            </>
                          ) : (
                            "No vehicle currently assigned"
                          )}
                        </p>
                      </div>
                      <StatusPill tone={driver.status === "ACTIVE" ? "success" : "pending"} label={driver.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
