// Principal/Vice Principal Transport landing page's "Routes" section -- a
// simple real row list (per the SIS mockup's oversight Transport screen),
// deliberately NOT Transport Manager's own dense 9-column grid (TransportGrid)
// since these two roles only need "which route, which bus, how many
// students, open for detail" -- not the operational columns (status edit,
// last odometer, etc.) Admin/Transport Manager need. Pure/presentational,
// shared verbatim between both roles so their route lists are guaranteed
// identical by construction. "Area" has no real column anywhere on `route`
// (checked information_schema) -- shown here as the real first-stop ->
// last-stop span instead of a fabricated area name.

import Link from "next/link";

export interface OversightRouteRow {
  id: string;
  name: string;
  code: string | null;
  firstStop: string | null;
  lastStop: string | null;
  stopsCount: number;
  distanceKm: string | null;
  vehicleRegNo: string | null;
  studentCount: number;
}

export function TransportOversightRoutesList({ routes, basePath }: { routes: OversightRouteRow[]; basePath: string }) {
  return (
    <section className="mt-6 rounded-[16px] border border-border bg-surface p-[22px]">
      <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Routes</h2>
      <p className="mt-1 text-[13px] text-text-muted">Open a route to see its bus, crew, stops and the students boarding.</p>

      {routes.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No routes yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {routes.map((route, i) => {
            const area = route.firstStop && route.lastStop ? `${route.firstStop} – ${route.lastStop}` : null;
            const sub = [area, `${route.stopsCount} stops`, route.distanceKm ? `${route.distanceKm} km` : null, route.vehicleRegNo]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={route.id} className="card-hover flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-3 py-[15px]">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[13px] text-primary-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[16px] font-semibold text-text">{route.code ?? route.name}</span>
                    <span className="truncate text-[13px] text-text-muted">{sub}</span>
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  <span className="text-[13px] text-text-muted">
                    <span className="font-mono font-semibold text-text">{route.studentCount}</span> students
                  </span>
                  <Link href={`${basePath}/routes/${route.id}`} className="text-[13px] font-semibold text-primary hover:underline">
                    View →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
