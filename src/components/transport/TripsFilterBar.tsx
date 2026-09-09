"use client";

import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

const STATES = ["SCHEDULED", "STARTED", "IN_PROGRESS", "COMPLETED", "INTERRUPTED", "CANCELLED"];

export function TripsFilterBar({
  date,
  vehicleId,
  routeId,
  state,
  vehicles,
  routes,
}: {
  date: string;
  vehicleId: string;
  routeId: string;
  state: string;
  vehicles: { id: string; registrationNo: string }[];
  routes: { id: string; name: string }[];
}) {
  return (
    <form action="/transport-manager/trips" className="mt-6 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Date</span>
        <input
          type="date"
          name="date"
          defaultValue={date}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Bus</span>
        <AutoSubmitSelect
          name="vehicleId"
          defaultValue={vehicleId}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All buses</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.registrationNo}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Route</span>
        <AutoSubmitSelect
          name="routeId"
          defaultValue={routeId}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Status</span>
        <AutoSubmitSelect
          name="state"
          defaultValue={state}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All statuses</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
    </form>
  );
}
