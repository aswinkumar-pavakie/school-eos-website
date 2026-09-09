// Parent Health -- read-only profile summary (blood group/height/weight/family
// doctor) plus the real infirmary visit log, newest first -- same
// /parent/students/:id/health route the Parent mobile app's own Health screen
// already calls. `profile` can genuinely be null (no record on file yet); every
// field still renders, just as "—", rather than the whole card disappearing.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatDateTime, orDash } from "@/lib/format";
import { getHealthOverview, listChildren, resolveSelectedChild, type InfirmaryVisit } from "@/lib/parent-api";

export default async function ParentHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const { profile, visits } = await getHealthOverview(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Health</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Health profile</h2>
            {profile?.measuredOn ? <p className="text-xs text-text-muted">Measured {formatDate(profile.measuredOn)}</p> : null}
          </div>
          {!profile ? <p className="mt-1 text-xs text-text-muted">No health profile on record yet.</p> : null}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Blood group" value={orDash(profile?.bloodGroup)} />
            <Field label="Height" value={profile?.heightCm !== null && profile?.heightCm !== undefined ? `${profile.heightCm} cm` : "—"} />
            <Field label="Weight" value={profile?.weightKg !== null && profile?.weightKg !== undefined ? `${profile.weightKg} kg` : "—"} />
            <Field label="Insurance ref" value={orDash(profile?.insuranceRef)} />
            <Field label="Family doctor" value={orDash(profile?.familyDoctor)} />
            <Field label="Doctor phone" value={orDash(profile?.doctorPhone)} />
          </div>

          {profile?.notes ? (
            <div className="mt-4 rounded-[var(--radius-input)] border border-border bg-field p-3">
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Notes</p>
              <p className="mt-1 text-sm text-text">{profile.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Infirmary visits</h2>
          {visits.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No infirmary visits" body="Visits recorded by the school nurse will appear here." />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {visits.map((v) => (
                <VisitCard key={v.id} visit={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load health records. Nothing was changed — try again." />;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.09em] text-text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function VisitCard({ visit }: { visit: InfirmaryVisit }) {
  const vitalsEntries = visit.vitals ? Object.entries(visit.vitals).filter(([, v]) => v !== null && v !== undefined && v !== "") : [];

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{visit.complaint}</p>
          <p className="mt-1 text-xs text-text-muted">
            {formatDateTime(visit.visitedAt)} · Attended by {visit.attendedByName}
          </p>
        </div>
        <p className="text-xs font-semibold text-text-muted">
          {visit.parentNotifiedAt ? `Parent notified ${formatDateTime(visit.parentNotifiedAt)}` : "Parent not notified yet"}
        </p>
      </div>

      <p className="mt-2 text-sm text-text">
        <span className="font-semibold">Action: </span>
        {visit.action}
      </p>
      {visit.observation ? (
        <p className="mt-1 text-sm text-text-muted">
          <span className="font-semibold text-text">Observation: </span>
          {visit.observation}
        </p>
      ) : null}
      {visit.outcome ? (
        <p className="mt-1 text-sm text-text-muted">
          <span className="font-semibold text-text">Outcome: </span>
          {visit.outcome}
        </p>
      ) : null}

      {vitalsEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {vitalsEntries.map(([key, value]) => (
            <span key={key} className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-semibold text-text-muted">
              {key}: {String(value)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
