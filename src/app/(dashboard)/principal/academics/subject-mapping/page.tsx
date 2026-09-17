// Subjects & mapping -- design-reframe addition (per the SIS Principal mockup).
// Real data: the subject_offering table already existed, fully populated, with
// only an Admin-only write API in front of it. See subject-offerings.controller.ts's
// own comment for the new PRINCIPAL-readable GET routes this page consumes.
// Read-only oversight, same convention as every other Principal list page --
// assigning a teacher stays an Admin action, not duplicated here.

import { listAllSubjectOfferings } from "@/lib/principal-api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";

// Real section data, just organized instead of dumped inline -- a core
// subject mapped to every section school-wide previously rendered as a single
// 60+ name comma-list wrapping across 6 lines per row (unreadable, per
// explicit user feedback). Shows a compact "N sections" count up front, with
// the full real chip list tucked behind a native <details> disclosure (zero
// extra JS, keeps this a Server Component) instead of always-on screen.
function SectionsCell({ sections }: { sections: string[] }) {
  if (sections.length <= 4) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <span key={s} className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-medium text-text-muted">
            {s}
          </span>
        ))}
      </div>
    );
  }
  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-deep">
        {sections.length} sections
        <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-2 flex max-w-[480px] flex-wrap gap-1.5">
        {sections.map((s) => (
          <span key={s} className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-medium text-text-muted">
            {s}
          </span>
        ))}
      </div>
    </details>
  );
}

export default async function PrincipalSubjectMappingPage() {
  const offerings = await listAllSubjectOfferings();

  const bySubject = new Map<
    string,
    { subjectName: string; sections: Set<string>; periods: number; mapped: number; total: number }
  >();
  const mappedTeacherIds = new Set<string>();
  let unmappedCount = 0;

  for (const o of offerings) {
    const entry = bySubject.get(o.subjectId) ?? {
      subjectName: o.subjectName,
      sections: new Set<string>(),
      periods: 0,
      mapped: 0,
      total: 0,
    };
    entry.sections.add(`${o.gradeName} ${o.sectionName}`);
    entry.periods += o.weeklyPeriods;
    entry.total += 1;
    if (o.teacherStaffId) entry.mapped += 1;
    else unmappedCount += 1;
    if (o.teacherStaffId) mappedTeacherIds.add(o.teacherStaffId);
    bySubject.set(o.subjectId, entry);
  }

  const rows = Array.from(bySubject.entries()).sort((a, b) => a[1].subjectName.localeCompare(b[1].subjectName));
  const avgLoad = mappedTeacherIds.size > 0
    ? Math.round(offerings.reduce((sum, o) => sum + (o.teacherStaffId ? o.weeklyPeriods : 0), 0) / mappedTeacherIds.size)
    : 0;

  return (
    <div className="mx-auto max-w-[1280px]">
      <div>
        <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Subjects &amp; mapping</h1>
        <p className="mt-1 text-sm text-text-muted">Which teacher carries which subject, across every section.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard eyebrow="Subjects mapped" value={String(rows.length)} detail="Across every offered subject" />
        <KpiCard eyebrow="Teachers assigned" value={String(mappedTeacherIds.size)} detail="Real teacher-subject mappings" />
        <KpiCard eyebrow="Average load" value={String(avgLoad)} detail="periods/wk, per mapped teacher" />
        <KpiCard eyebrow="Unmapped offerings" value={String(unmappedCount)} detail="No teacher assigned yet" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Sections</th>
              <th className="px-4 py-3">Periods/wk</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                  No subject offerings for the current academic year.
                </td>
              </tr>
            )}
            {rows.map(([subjectId, r]) => (
              <tr key={subjectId} className="hover:bg-field">
                <td className="px-4 py-3 font-bold text-text">{r.subjectName}</td>
                <td className="px-4 py-3 align-top">
                  <SectionsCell sections={Array.from(r.sections).sort()} />
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{r.periods}</td>
                <td className="px-4 py-3">
                  {r.mapped === r.total ? (
                    <StatusPill tone="success" label="Mapped" />
                  ) : (
                    <StatusPill tone="pending" label={`${r.mapped}/${r.total} mapped`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
