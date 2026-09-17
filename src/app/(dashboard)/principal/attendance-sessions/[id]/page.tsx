import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
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
interface AttendanceRecordRow {
  id: string;
  studentId: string;
  status: string;
  reason: string | null;
  firstName: string;
  lastName: string | null;
  rollNo: number | null;
}
interface AttendanceSessionDetail {
  id: string;
  sectionId: string;
  sessionDate: string;
  sessionType: string;
  isLocked: boolean;
  records: AttendanceRecordRow[];
  counts: Record<string, number>;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "PRESENT") return "success";
  if (status === "ABSENT") return "critical";
  return "pending";
}

export default async function VicePrincipalAttendanceSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/attendance-sessions/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this session</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
  const { data: session } = (await res.json()) as { data: AttendanceSessionDetail };

  const [sectionsRes, gradesRes] = await Promise.all([
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/grades"),
  ]);
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const gradeById = new Map(grades.map((g) => [g.id, g.name] as const));
  const section = sections.find((s) => s.id === session.sectionId);

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/principal/attendance-sessions" label="Back to Attendance Sessions" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">{formatDate(session.sessionDate)}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {section ? `${gradeById.get(section.gradeId) ?? "—"} · ${section.name}` : "—"} · {session.sessionType}
          </p>
        </div>
        <StatusPill tone={session.isLocked ? "success" : "pending"} label={session.isLocked ? "Locked" : "Open"} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(session.counts).map(([status, count]) => (
          <div key={status} className="rounded-[16px] border border-border bg-surface p-3.5 text-center">
            <p className="text-2xl font-bold text-text">{count}</p>
            <p className="text-xs font-semibold text-text-muted">{status.replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Roster</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="py-2.5 pr-3">Roll</th>
                <th className="py-2.5 pr-3">Student</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {session.records.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">
                    No students on this session&apos;s roster.
                  </td>
                </tr>
              )}
              {session.records.map((r) => (
                <tr key={r.id} className="card-hover">
                  <td className="py-3 pr-3 text-text-muted">{r.rollNo ?? "—"}</td>
                  <td className="py-3 pr-3 font-semibold text-text">
                    {r.firstName} {r.lastName ?? ""}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusPill tone={statusTone(r.status)} label={r.status.replace(/_/g, " ")} />
                  </td>
                  <td className="py-3 text-text-muted">{r.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
