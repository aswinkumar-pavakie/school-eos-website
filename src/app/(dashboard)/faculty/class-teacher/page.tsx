import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, orDash } from "@/lib/format";
import { listAdvisorSections, getClassTeacherDashboard, listStudentDuties } from "@/lib/faculty-api";
import { DutyModal } from "./DutyModal";
import { endDutyAction, removeDutyAction } from "./actions";

export default async function ClassTeacherPage({ searchParams }: { searchParams: Promise<{ sectionId?: string }> }) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Class Teacher</h1>
          <p className="mt-1 text-sm text-text-muted">Your section&apos;s daily duties and class officers.</p>
        </div>

        {sections.length === 0 ? (
          <EmptyState title="You are not a class advisor" body="This dashboard is only available to a section's own class advisor." />
        ) : (
          <>
            {sections.length > 1 ? (
              <form action="/faculty/class-teacher" className="flex flex-wrap items-center gap-3">
                <select name="sectionId" defaultValue={sectionId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                  {sections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>{s.gradeName} {s.sectionName}</option>
                  ))}
                </select>
                <PlainButton type="submit" variant="secondary">Go</PlainButton>
              </form>
            ) : null}

            {sectionId ? <SectionDashboard sectionId={sectionId} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your class dashboard. Nothing was changed — try again." />;
  }
}

async function SectionDashboard({ sectionId }: { sectionId: string }) {
  const [dashboard, duties] = await Promise.all([
    getClassTeacherDashboard(sectionId),
    listStudentDuties(sectionId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <KpiGrid>
        <KpiCard eyebrow="Strength" value={String(dashboard.stats.strength)} />
        <KpiCard eyebrow="Present today" value={String(dashboard.stats.presentToday)} />
        <KpiCard eyebrow="On leave today" value={String(dashboard.stats.onLeaveToday)} />
      </KpiGrid>

      <div className="flex flex-col gap-3">
        {dashboard.classDuties.map((duty) => (
          <div key={duty.key} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">{duty.title}</p>
                <p className="text-xs text-text-muted">{duty.meta}</p>
              </div>
              <span className="shrink-0 rounded-[7px] bg-field px-2 py-0.5 text-xs font-bold text-text-muted">{duty.status}</span>
            </div>
            {duty.pending && duty.pending.length > 0 ? (
              <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border pt-2">
                {duty.pending.map((p) => (
                  <li key={p.id} className="py-2 text-sm">
                    <span className="font-semibold text-text">{p.studentName}</span>{" "}
                    <span className="text-text-muted">{formatDate(p.fromDate)} – {formatDate(p.toDate)} · {p.reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text">Class officers</h2>
          <DutyModal sectionId={sectionId} />
        </div>
        {duties.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No class officers assigned yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {duties.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3">
                <div>
                  <p className="text-sm font-bold text-text">{d.title} <span className="font-normal text-text-muted">— {d.studentName} · Roll {orDash(d.rollNo)}</span></p>
                  {d.duties ? <p className="text-xs text-text-muted">{d.duties}</p> : null}
                </div>
                <div className="flex gap-2">
                  <DutyModal sectionId={sectionId} duty={d} />
                  <form action={endDutyAction.bind(null, d.id)}>
                    <PlainButton type="submit" variant="secondary">End</PlainButton>
                  </form>
                  <form action={removeDutyAction.bind(null, d.id)}>
                    <PlainButton type="submit" variant="danger">Remove</PlainButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
