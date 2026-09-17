// Principal -- Attendance Sessions: a REAL oversight module, distinct from
// the existing /principal/attendance page (staff daily roll call, a
// different table entirely). Vice Principal's own web console got this
// module first (attendance-sessions.controller.ts's class-level stays
// ADMIN-only; VICE_PRINCIPAL got its own explicit method-level grant, "Phase
// 7 mobile Attendance module"), and by later explicit instruction PRINCIPAL
// was added to that same grant so Principal's console could have the same
// real class-attendance oversight. Read-only: list/get only, matching the
// real backend surface -- no create/lock controls, those stay ADMIN-only.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Section {
  id: string;
  name: string;
  gradeId: string;
}
interface Grade {
  id: string;
  name: string;
}
interface AttendanceSessionRow {
  id: string;
  sectionId: string;
  sessionDate: string;
  sessionType: string;
  markedAt: string | null;
  isLocked: boolean;
}

export default async function VicePrincipalAttendanceSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const query = new URLSearchParams();
  if (params.sectionId) query.set("sectionId", params.sectionId);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  query.set("page", String(page));
  query.set("limit", "50");

  const [sessionsRes, sectionsRes, gradesRes] = await Promise.all([
    apiFetch(`/attendance-sessions?${query.toString()}`),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/grades"),
  ]);

  if (!sessionsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load attendance sessions</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: sessions, meta } = (await sessionsRes.json()) as {
    data: AttendanceSessionRow[];
    meta: { page: number; limit: number; total: number };
  };
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const gradeById = new Map(grades.map((g) => [g.id, g.name] as const));
  const sectionById = new Map(sections.map((s) => [s.id, s] as const));
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.sectionId) next.set("sectionId", params.sectionId);
    if (params.dateFrom) next.set("dateFrom", params.dateFrom);
    if (params.dateTo) next.set("dateTo", params.dateTo);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/principal/attendance-sessions?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Attendance Sessions</h1>
      <p className="mt-1 text-sm text-text-muted">
        {meta.total} session(s) — read-only oversight. Taking or locking attendance is a class-teacher/Admin action.
      </p>

      <form action="/principal/attendance-sessions" className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Section</span>
          <select
            name="sectionId"
            defaultValue={params.sectionId ?? ""}
            className="min-w-[200px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {gradeById.get(s.gradeId) ?? "—"} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">From</span>
          <input
            type="date"
            name="dateFrom"
            defaultValue={params.dateFrom ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">To</span>
          <input
            type="date"
            name="dateTo"
            defaultValue={params.dateTo ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <button type="submit" className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white">
          Filter
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Marked at</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                  No attendance sessions match this filter.
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const section = sectionById.get(s.sectionId);
              return (
                <tr key={s.id} className="card-hover">
                  <td className="px-4 py-3 font-semibold text-text">
                    <Link href={`/principal/attendance-sessions/${s.id}`} className="hover:underline">
                      {formatDate(s.sessionDate)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {section ? `${gradeById.get(section.gradeId) ?? "—"} · ${section.name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{s.sessionType}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {s.markedAt ? new Date(s.markedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={s.isLocked ? "success" : "pending"} label={s.isLocked ? "Locked" : "Open"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
