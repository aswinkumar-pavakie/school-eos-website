"use client";

// Students -- Transport Manager's read-only search over the real
// student_transport_allocation data already fetched server-side (via each
// route's own /routes/:id/assigned-students, same endpoint Route detail
// uses) -- never a second, invented student directory. Client-side
// search/filter only, no extra network round-trip, since the whole dataset
// (every currently-transported student) is small enough to fetch once.
// Pixel-matched to this role's own established filter-bar/list styling
// (Drivers & crew's own search toolbar, Compliance's own row spacing) --
// this page hadn't been brought in line with the rest of the role's design
// system yet. Real "Bus" filter added alongside Route/Status, derived from
// each route's own real current vehicle_route_assignment (a route can carry
// at most one current bus, so this stays a simple 1:1 lookup, not a second
// picker with its own independent state).

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { MaterialIcon } from "./MaterialIcon";

export interface TransportStudentRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  routeId: string;
  routeName: string;
  routeStopId: string;
  stopName: string;
  direction: string;
  status: string;
  vehicleId: string | null;
  vehicleRegNo: string | null;
}

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}
function initialsOf(first: string, last: string | null): string {
  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function TransportStudentsTable({
  students,
  routes,
  buses,
}: {
  students: TransportStudentRow[];
  routes: { id: string; name: string; code: string | null }[];
  buses: { id: string; registrationNo: string }[];
}) {
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [busFilter, setBusFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (routeFilter && s.routeId !== routeFilter) return false;
      if (busFilter && s.vehicleId !== busFilter) return false;
      if (!q) return true;
      const name = `${s.studentFirstName} ${s.studentLastName ?? ""}`.toLowerCase();
      const classLabel = `${s.gradeName ?? ""} ${s.sectionName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        classLabel.includes(q) ||
        s.stopName.toLowerCase().includes(q) ||
        (s.vehicleRegNo ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, search, routeFilter, busFilter, statusFilter]);

  return (
    <div>
      <div
        className="flex flex-wrap items-end gap-4 rounded-[14px] px-4 py-3.5"
        style={{ background: "#FFFFFF", border: "1px solid #E8EDF3" }}
      >
        <label className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Search</span>
          <div className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ border: "1px solid #E2E8F0" }}>
            <MaterialIcon name="search" size={18} className="text-[#94A3B8]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, admission no, class, or stop…"
              className="w-full border-0 bg-transparent text-[14px] text-text outline-none"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Route</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="rounded-[10px] px-3.5 py-2.5 text-[14px] text-text outline-none transition-colors focus:border-primary"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <option value="">All routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ?? r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Bus</span>
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="rounded-[10px] px-3.5 py-2.5 text-[14px] text-text outline-none transition-colors focus:border-primary"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <option value="">All buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.registrationNo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[10px] px-3.5 py-2.5 text-[14px] text-text outline-none transition-colors focus:border-primary"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="CHANGED">Changed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <p className="pb-2.5 text-[13px] font-semibold text-text-muted">
          {filtered.length} of {students.length}
        </p>
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-text-muted">No students match this filter.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {filtered.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#F8FAFC]">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold"
                    style={{ background: "#EFF4FF", color: "#1D4ED8" }}
                  >
                    {initialsOf(s.studentFirstName, s.studentLastName)}
                  </span>
                  <div>
                    <p className="text-[14.5px] font-bold text-text">
                      {s.studentFirstName} {s.studentLastName ?? ""}
                    </p>
                    <p className="mt-[2px] text-[13px]" style={{ color: "#64748B" }}>
                      <span className="font-mono">{s.admissionNo}</span>
                      {s.gradeName ? ` · ${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""}` : ""}
                      {" · "}
                      {s.routeName} · Stop: {s.stopName}
                      {s.vehicleRegNo ? (
                        <>
                          {" · "}
                          <span className="font-mono">{s.vehicleRegNo}</span>
                        </>
                      ) : (
                        ""
                      )}
                      {" · "}
                      {s.direction.toLowerCase()}
                    </p>
                  </div>
                </div>
                <StatusPill tone={tone(s.status)} label={s.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
