// Transport -- pixel-matched to the reference design's own landing page: a
// 5-KPI row (Buses/Routes/Students ferried/Avg occupancy/Docs to renew) above
// a simple Routes row-list (serial badge, route name + area/stops/km/code,
// real active-student count, "View ->"). Replaces the old Vehicles/Routes/
// Drivers tabs entirely -- every real write those tabs offered (vehicle/
// route/driver/attendant create+edit, assignment create) still exists via
// the same actions.ts functions, now reachable from the route detail page
// this design's "View ->" link opens (see routes/[id]/page.tsx), matching
// how the reference design itself has no separate "Vehicles" or "Drivers"
// list screen of its own.
//
// KPI numbers are the exact same real computation transport-kpis.ts already
// runs for Transport Manager's own list pages (Buses/Routes/Students ferried/
// Avg occupancy/Docs to renew) -- one real source of truth, not a second
// hand-rolled version. Two of its own sub-lines have no real backing data
// anywhere in this schema ("Route 04 added 18 Aug" -- no route created_at
// column; "Waiting list of 6" -- no waitlist concept) and stay honestly
// substituted with a real figure there, not fabricated here either.

import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AddRouteForm } from "@/components/transport/admin/AddRouteForm";
import { computeTransportKpis } from "@/components/transport/transport-kpis";
import { apiFetch } from "@/lib/api";

interface Route {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
}
interface RouteStop {
  id: string;
}
interface AssignedStudent {
  id: string;
  studentId: string;
  status: string;
}

export default async function TransportPage() {
  const [routesRes] = await Promise.all([apiFetch("/routes")]);

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Transport</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const [kpis, { data: routesRaw }] = await Promise.all([
    computeTransportKpis(),
    routesRes.json() as Promise<{ data: Route[] }>,
  ]);

  const routes = await Promise.all(
    routesRaw.map(async (route) => {
      const [stopsRes, studentsRes] = await Promise.all([
        apiFetch(`/routes/${route.id}/stops`),
        apiFetch(`/routes/${route.id}/assigned-students`),
      ]);
      const stops: RouteStop[] = stopsRes.ok ? (await stopsRes.json()).data : [];
      const students: AssignedStudent[] = studentsRes.ok ? (await studentsRes.json()).data : [];
      // Each real rider has TWO allocation rows here (PICKUP + DROP), so a
      // plain .length doubles the count -- count distinct students instead.
      const activeStudents = new Set(students.filter((s) => s.status === "ACTIVE").map((s) => s.studentId)).size;
      return { ...route, stopCount: stops.length, activeStudents };
    }),
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Transport</h1>
      <p className="mt-1 text-sm text-text-muted">Routes, stops and the students boarding at each stop.</p>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            eyebrow={k.label}
            value={k.value}
            detail={[k.subA, k.subB].filter((s): s is string => Boolean(s))}
            pctBadge={k.badge}
            bar={k.bar}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold leading-[28px] tracking-[-0.015em] text-text">Routes</h2>
          <p className="mt-1 text-sm text-text-muted">Open a route to see its bus, crew, stops and the students boarding.</p>
        </div>
        <AddRouteForm triggerClassName="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:border-primary/40" />
      </div>

      <div className="mt-4 rounded-[16px] border border-border bg-surface">
        {routes.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-text-muted">No routes yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {routes.map((route, i) => (
              <li key={route.id} className="card-hover flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                    style={{ background: "var(--color-tint)", border: "1px solid var(--color-tint-2)", color: "var(--color-primary)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-text">
                      {route.name} {route.code && <span className="font-mono text-text-muted">· {route.code}</span>}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-muted">
                      {route.direction.toLowerCase()} · {route.stopCount} stops
                      {route.distanceKm ? ` · ${route.distanceKm} km` : ""}
                      {route.code ? ` · ${route.code}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[14px]">
                    <span className="font-bold text-text">{route.activeStudents}</span> <span className="text-text-muted">students</span>
                  </p>
                  <Link href={`/admin/transport/routes/${route.id}`} className="text-[13px] font-semibold text-primary">
                    View →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
