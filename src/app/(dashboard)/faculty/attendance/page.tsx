import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { getAttendanceRoster, listAdvisorSections } from "@/lib/faculty-api";
import { markAllPresentAction } from "./actions";
import { StatusSelect } from "./StatusSelect";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;
    const date = params.date || todayIso();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Student Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">Mark and correct daily attendance for your own section.</p>
        </div>

        {sections.length === 0 ? (
          <EmptyState title="You are not a class advisor" body="Attendance can only be marked by the section's own class advisor." />
        ) : (
          <>
            <form action="/faculty/attendance" className="flex flex-wrap items-center gap-3">
              <select name="sectionId" defaultValue={sectionId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>{s.gradeName} {s.sectionName}</option>
                ))}
              </select>
              <input type="date" name="date" defaultValue={date} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
              <PlainButton type="submit" variant="secondary">Go</PlainButton>
            </form>

            {sectionId ? <RosterSection sectionId={sectionId} date={date} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load attendance. Nothing was changed — try again." />;
  }
}

async function RosterSection({ sectionId, date }: { sectionId: string; date: string }) {
  const { session, records } = await getAttendanceRoster(sectionId, date);
  const presentCount = records.filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {presentCount} / {records.length} marked present{session.isLocked ? " · session locked (corrections only)" : ""}
        </p>
        <form action={markAllPresentAction.bind(null, sectionId, date)}>
          <PlainButton type="submit" variant="primary">Mark all present</PlainButton>
        </form>
      </div>

      {records.length === 0 ? (
        <EmptyState title="No students found" body="This section has no active enrolments." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead className="bg-field">
              <tr>
                <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Roll</th>
                <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Student</th>
                <th className="border-b border-border px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-field/60">
                  <td className="px-4 py-3 font-mono text-text">{r.rollNo ?? "—"}</td>
                  <td className="px-4 py-3 text-text">{[r.firstName, r.lastName].filter(Boolean).join(" ")}</td>
                  <td className="px-4 py-3 text-right">
                    <StatusSelect recordId={r.id} sectionId={sectionId} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
