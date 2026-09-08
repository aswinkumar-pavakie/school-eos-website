// Faculty Dashboard -- same "answer what needs me today in five seconds"
// brief Admin's own dashboard follows. Every figure here is a real read
// against the caller's own scope (advisor sections, teaching offerings,
// pending student-leave decisions, open homework) -- nothing fabricated.

import Link from "next/link";
import {
  AcademicsIcon,
  AttendanceIcon,
  HostelIcon,
  RequestsIcon,
} from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { apiFetch } from "@/lib/api";
import { listAdvisorSections, listStudentLeaveRequests, listTeachingOfferings } from "@/lib/faculty-api";
import { listHomework } from "@/lib/faculty-api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function FacultyDashboardPage() {
  const [advisorSections, teachingOfferings, leaveRequests, homework, personRes] = await Promise.all([
    listAdvisorSections().catch(() => []),
    listTeachingOfferings().catch(() => []),
    listStudentLeaveRequests().catch(() => []),
    listHomework().catch(() => null),
    apiFetch("/auth/me"),
  ]);

  const person = personRes.ok ? ((await personRes.json()) as { data: { person: { firstName: string } } }).data.person : null;
  const pendingLeave = leaveRequests.filter((r) => r.state === "PENDING").length;
  const subjectCount = new Set(teachingOfferings.map((o) => o.subjectId)).size;

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {greeting()}
            {person ? `, ${person.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Your classes, your students, your day.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Classes I advise"
          value={String(advisorSections.length)}
          detail={advisorSections.length > 0 ? advisorSections.map((s) => `${s.gradeName} ${s.sectionName}`).join(", ") : "Not a class advisor"}
          icon={<HostelIcon className="h-5 w-5" />}
          href="/faculty/class-teacher"
        />
        <KpiCard
          eyebrow="Subjects I teach"
          value={String(subjectCount)}
          detail={`Across ${teachingOfferings.length} class${teachingOfferings.length === 1 ? "" : "es"}`}
          icon={<AcademicsIcon className="h-5 w-5" />}
          href="/faculty/subject-records"
        />
        <KpiCard
          eyebrow="Leave requests pending"
          value={String(pendingLeave)}
          detail={pendingLeave > 0 ? "Waiting for your decision" : "All caught up"}
          icon={<RequestsIcon className="h-5 w-5" />}
          href="/faculty/student-leave"
        />
        <KpiCard
          eyebrow="Homework open"
          value={String(homework?.stats.open ?? 0)}
          detail={`${homework?.stats.dueToday ?? 0} due today · ${homework?.stats.ungraded ?? 0} ungraded`}
          icon={<AttendanceIcon className="h-5 w-5" />}
          href="/faculty/homework"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-surface p-[18px] lg:col-span-2">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">My classes</h2>
          {advisorSections.length === 0 && teachingOfferings.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">You are not currently scoped to any class.</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {advisorSections.map((s) => (
                <li key={s.sectionId} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-text">{s.gradeName} {s.sectionName}</p>
                    <p className="text-xs text-text-muted">Class advisor</p>
                  </div>
                  <Link href="/faculty/attendance" className="shrink-0 text-[13px] font-semibold text-primary hover:underline">
                    Take attendance
                  </Link>
                </li>
              ))}
              {[...new Map(teachingOfferings.map((o) => [`${o.sectionId}-${o.subjectId}`, o])).values()].map((o) => (
                <li key={`${o.subjectOfferingId}`} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-text">{o.subjectName} · {o.gradeName} {o.sectionName}</p>
                    <p className="text-xs text-text-muted">Subject teacher</p>
                  </div>
                  <Link href="/faculty/marks-entry" className="shrink-0 text-[13px] font-semibold text-primary hover:underline">
                    Marks entry
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Shortcuts</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {[
              { label: "Current Term (LMS)", href: "/faculty/lms" },
              { label: "Timetable", href: "/faculty/timetable" },
              { label: "Academic Calendar", href: "/faculty/calendar" },
              { label: "My Bus", href: "/faculty/bus" },
              { label: "Library", href: "/faculty/library" },
              { label: "Payslip", href: "/faculty/payslip" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center justify-between gap-3 text-[13px] text-text transition-colors hover:text-primary">
                  <span>{item.label}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
