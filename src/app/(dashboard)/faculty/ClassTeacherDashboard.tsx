// Dashboard for a Class Teacher login (a per-section login carrying only
// CLASS_ADVISOR -- see faculty/layout.tsx). Mirrors the mobile Class Teacher
// Home: the class at a glance, today's attendance, pending leave, the notice
// feed, and shortcuts into the class screens. Deliberately has none of the
// Faculty dashboard's subject-teaching tiles (classes today, homework) --
// those need the FACULTY role and would only ever be empty here.

import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  getAttendanceRoster,
  getClassTeacherDashboard,
  listAdvisorSections,
  listAnnouncements,
  listStudentLeaveRequests,
} from "@/lib/faculty-api";
import { listMediaPosts } from "@/lib/media-api";
import { Card } from "@/components/faculty-ui/Card";
import { StatTile } from "@/components/faculty-ui/StatTile";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const SHORTCUTS: { href: string; label: string; sub: string }[] = [
  { href: "/faculty/students", label: "Student data", sub: "Roster and student profiles" },
  { href: "/faculty/attendance", label: "Attendance", sub: "Mark and review today" },
  { href: "/faculty/class-exams", label: "Exams", sub: "Upcoming, finished and marks" },
  { href: "/faculty/fees", label: "Fees", sub: "Class fee status" },
  { href: "/faculty/student-leave", label: "Approve leave", sub: "Requests from parents" },
  { href: "/faculty/parent-meetings", label: "Parent meetings", sub: "Slots and bookings" },
];

export async function ClassTeacherDashboard() {
  const [sections, leaveRequests, announcements, mediaPosts, personRes] = await Promise.all([
    listAdvisorSections().catch(() => []),
    listStudentLeaveRequests().catch(() => []),
    listAnnouncements().catch(() => []),
    // Only ever live posts on a Home feed -- never drafts/scheduled ones.
    listMediaPosts({ state: "PUBLISHED" }).catch(() => []),
    apiFetch("/auth/me"),
  ]);

  const person = personRes.ok
    ? ((await personRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }).data.person
    : null;
  const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";

  const section = sections[0] ?? null;
  const sectionLabel = section ? `${section.gradeName}-${section.sectionName}` : null;

  const [roster, classDashboard] = section
    ? await Promise.all([
        getAttendanceRoster(section.sectionId, todayIso()).catch(() => null),
        getClassTeacherDashboard(section.sectionId).catch(() => null),
      ])
    : [null, null];

  const rosterTotal = roster?.records.length ?? 0;
  const presentCount = roster ? roster.records.filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)).length : 0;
  const absentees = roster ? roster.records.filter((r) => r.status === "ABSENT") : [];
  const attendancePct = rosterTotal > 0 ? Math.round((presentCount / rosterTotal) * 1000) / 10 : null;

  const pendingLeave = leaveRequests.filter((r) => r.state === "PENDING").length;
  const resolvedLeave = leaveRequests.length - pendingLeave;
  const leavePct = leaveRequests.length > 0 ? Math.round((resolvedLeave / leaveRequests.length) * 100) : 100;

  return (
    <div>
      <div>
        <h1 style={{ font: "700 38px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-ink)" }}>
          {greeting()}{personName ? `, ${personName}` : ""}
        </h1>
        <p style={{ font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", margin: "9px 0 0" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {sectionLabel ? ` · Class teacher of ${sectionLabel}` : ""}
        </p>
      </div>

      {!section ? (
        <div style={{ marginTop: 26 }}>
          <FacultyEmptyState message="No class is assigned to this login yet. Ask the administrator to link a class." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 26 }}>
            <Link href="/faculty/students">
              <StatTile
                label="Students"
                value={String(classDashboard?.stats.strength ?? rosterTotal)}
                sub={sectionLabel ?? ""}
                pct="100%"
                note={classDashboard ? `${classDashboard.stats.onLeaveToday} on leave today` : undefined}
              />
            </Link>
            <Link href="/faculty/attendance">
              <StatTile
                label="Attendance today"
                value={attendancePct !== null ? `${attendancePct}%` : "—"}
                sub={`${sectionLabel} · ${rosterTotal} students`}
                pct={`${attendancePct ?? 0}%`}
                note={absentees.length > 0 ? `${absentees.length} absent today` : rosterTotal > 0 ? "Full attendance today" : undefined}
              />
            </Link>
            <Link href="/faculty/student-leave">
              <StatTile
                label="Leave requests pending"
                value={String(pendingLeave)}
                sub={pendingLeave > 0 ? "waiting for your decision" : "all caught up"}
                pct={`${leavePct}%`}
                note={leaveRequests.length > 0 ? `${resolvedLeave} of ${leaveRequests.length} resolved` : undefined}
              />
            </Link>
            <Link href="/faculty/class-teacher">
              <StatTile
                label="On leave today"
                value={String(classDashboard?.stats.onLeaveToday ?? 0)}
                sub={sectionLabel ?? ""}
                pct="0%"
                note="Open the class board"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 18, alignItems: "start" }}>
            <Card>
              <h3 style={{ margin: "0 0 10px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Class shortcuts</h3>
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="fac-hover-lift block"
                  style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}
                >
                  <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{s.label}</div>
                  <div style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 2 }}>{s.sub}</div>
                </Link>
              ))}
            </Card>

            <Card>
              <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, font: "700 19px/1.2 var(--fac-font-sans)" }}>Notices</h3>
                <Link href="/faculty/announcements" style={{ border: 0, background: "none", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                  View all
                </Link>
              </div>
              {announcements.length === 0 ? (
                <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>No notices yet.</p>
              ) : (
                announcements.slice(0, 5).map((n) => (
                  <Link key={n.id} href="/faculty/announcements" className="fac-hover-lift block" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                    <div className="flex items-center gap-2.5">
                      <span style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 5, padding: "4px 7px" }}>
                        {n.category ?? "NOTICE"}
                      </span>
                      <span style={{ font: "400 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                        {n.publishAt ? new Date(n.publishAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                    <div style={{ font: "600 14px/1.35 var(--fac-font-sans)", marginTop: 7, color: "var(--fac-ink)" }}>{n.title}</div>
                  </Link>
                ))
              )}
            </Card>
          </div>

          <div style={{ marginTop: 18 }}>
            <Card>
              <h3 style={{ margin: "0 0 10px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Media Room</h3>
              {mediaPosts.length === 0 ? (
                <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>No posts yet.</p>
              ) : (
                mediaPosts.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                    <div className="flex items-center gap-2.5">
                      <span style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 5, padding: "4px 7px" }}>
                        {p.category}
                      </span>
                      <span style={{ font: "400 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                    <div style={{ font: "500 14px/1.45 var(--fac-font-sans)", marginTop: 7, color: "var(--fac-ink)" }}>{p.caption}</div>
                  </div>
                ))
              )}
            </Card>
          </div>

          {absentees.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <Card>
                <h3 style={{ margin: "0 0 10px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Absent today</h3>
                <p style={{ margin: 0, font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
                  {absentees.map((a) => [a.firstName, a.lastName].filter(Boolean).join(" ")).join(", ")}
                </p>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
