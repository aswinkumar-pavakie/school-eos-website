"use client";

import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

export function NfcAttendanceFilterBar({
  date,
  vehicleId,
  routeId,
  gradeId,
  source,
  vehicles,
  routes,
  grades,
}: {
  date: string;
  vehicleId: string;
  routeId: string;
  gradeId: string;
  source: string;
  vehicles: { id: string; registrationNo: string }[];
  routes: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}) {
  return (
    <form action="/transport-manager/nfc-attendance" className="mt-6 flex flex-wrap items-end gap-3">
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
        <span className="font-semibold text-text">Class</span>
        <AutoSubmitSelect
          name="gradeId"
          defaultValue={gradeId}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All classes</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Recorded via</span>
        <AutoSubmitSelect
          name="source"
          defaultValue={source}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All</option>
          <option value="CARD_TAP">NFC card tap</option>
          <option value="ATTENDANT_MANUAL">Attendant (manual)</option>
        </AutoSubmitSelect>
      </label>
    </form>
  );
}
