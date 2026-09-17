// Correspondent -> Students -> Attention (Phase 9). Real, transparent,
// rule-based attendance visibility over the real attendance_record data --
// no AI, no invented risk score. IMPORTANT scope note (see query.md/Phase 9
// report): academic/examination marks are FACULTY-only everywhere in this
// backend (faculty-marks.controller.ts, faculty-class-results.controller.ts
// -- checked, no PRINCIPAL/CORRESPONDENT grant exists on any results/marks
// route), so Correspondent has no authorized data source for an "Academic
// Attention" or "Examination Attention" signal -- only Attendance is real and
// authorized here. This page shows every student's own real numbers
// (presentCount/totalCount for the selected window), ranked lowest-first; it
// does not apply a pass/fail cutoff, since no attendance threshold is
// configured anywhere in this schema (checked before building this).

import Link from "next/link";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { apiFetch } from "@/lib/api";

interface LowAttendanceRow {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  presentCount: number;
  totalCount: number;
  percentage: number | null;
}

const WINDOW_OPTIONS = [
  { days: "7", label: "Last 7 days" },
  { days: "30", label: "Last 30 days" },
  { days: "90", label: "Last 90 days" },
];

export default async function CorrespondentStudentAttentionPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = WINDOW_OPTIONS.some((o) => o.days === params.days) ? params.days! : "30";

  const res = await apiFetch(`/students/attendance-lowest?days=${days}&limit=50`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Attendance attention</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const rows: LowAttendanceRow[] = (await res.json()).data;

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Student Attention</h1>
      <p className="mt-1 text-sm text-text-muted">
        Attendance, ranked lowest-first — real counts, not a fabricated risk score. No attendance threshold is
        configured for this school, so nothing here is auto-flagged as &quot;at risk&quot;; use the real numbers to
        judge. Academic and examination records are Faculty-only in this system and aren&apos;t shown here.
      </p>

      <form action="/correspondent/students/attention" className="mt-6 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Period</span>
          <AutoSubmitSelect
            name="days"
            defaultValue={days}
            className="min-w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Present / Sessions</th>
              <th className="px-4 py-3">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                  No attendance sessions recorded in this period.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.studentId} className="card-hover">
                <td className="px-4 py-3 font-semibold text-text">
                  <Link href={`/correspondent/students/${r.studentId}`} className="hover:underline">
                    {r.firstName} {r.lastName ?? ""}
                  </Link>
                  <p className="font-mono text-xs font-normal text-text-muted">{r.admissionNo}</p>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {r.gradeName ? `${r.gradeName} · ${r.sectionName}` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text-muted">
                  {r.presentCount} / {r.totalCount}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] font-semibold text-text">
                  {r.percentage === null ? "—" : `${r.percentage}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
