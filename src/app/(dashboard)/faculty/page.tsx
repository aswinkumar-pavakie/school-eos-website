// Faculty Dashboard -- pixel-rebuilt to match
// brain/SIS Class teacher/Class Teacher Portal.dc.html's "isDash" screen.
// Every figure here is a real read against the caller's own scope (advisor
// sections, teaching offerings, today's attendance roster, pending leave,
// homework, announcements, timetable, permission activities, conversations)
// -- nothing fabricated. Stat-tile labels are the design's own generic
// {label,value,strong,sub,pct,note} shape, populated with this teacher's
// real, currently-available metrics.
//
// "Today" / "This term" toggle (?view=today|term) switches the class
// advisor's attendance figure between today's own roster and a real
// term-to-date aggregate off /faculty/attendance/history -- the term's
// real start date comes from /academic-terms' isCurrent row (falling back
// to the academic year's own start date if no term rows exist yet).

import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthExpiredError, apiFetch, getCurrentActor } from "@/lib/api";
import { ClassTeacherDashboard } from "./ClassTeacherDashboard";
import {
  getAttendanceHistory,
  getAttendanceRoster,
  getClassTeacherDashboard,
  listAdvisorSections,
  listAnnouncements,
  listStudentLeaveRequests,
  listHomework,
} from "@/lib/faculty-api";
import { getFacultyCalendar, getWeeklyTimetable } from "@/lib/faculty-academics-api";
import { listAcademicTerms } from "@/lib/academic-term-api";
import { listEvents } from "@/lib/faculty-permissions-api";
import { RecentMessagesCard } from "./RecentMessagesCard";
import { isUpcoming } from "@/lib/faculty-time";
import { Card } from "@/components/faculty-ui/Card";
import { StatTile } from "@/components/faculty-ui/StatTile";
import { ErrorState } from "@/components/ui/EmptyState";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function todayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay;
}
function formatClock(hms: string): string {
  const [hStr, mStr] = hms.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}
function tabStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: 7,
    font: "600 13.5px/1 var(--fac-font-sans)",
    color: active ? "var(--fac-navy)" : "var(--fac-tertiary)",
    background: active ? "var(--fac-white)" : "transparent",
    boxShadow: active ? "0 1px 2px rgba(15,23,42,.08)" : "none",
  };
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div style={{ font: "500 12.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{label}</div>
      <div style={{ font: "700 26px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)", marginTop: 6, overflowWrap: "anywhere" }}>{value}</div>
      <div style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default async function FacultyDashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  try {
    const params = await searchParams;
    const view: "today" | "term" = params.view === "term" ? "term" : "today";

    // A Class Teacher login has no FACULTY role: its dashboard is the class
    // view, not the subject-teaching one below.
    const actor = await getCurrentActor();
    if (!actor.roles.includes("FACULTY")) return <ClassTeacherDashboard />;

    const [advisorSections, leaveRequests, homework, personRes, announcements, timetable, events, calendar, terms] =
      await Promise.all([
        listAdvisorSections().catch(() => []),
        listStudentLeaveRequests().catch(() => []),
        listHomework().catch(() => null),
        apiFetch("/auth/me"),
        listAnnouncements().catch(() => []),
        getWeeklyTimetable().catch(() => null),
        // Real: student-events.controller.ts's /faculty/events, the same
        // backend the mobile app's own "Events" feature uses successfully.
        listEvents().catch(() => []),
        getFacultyCalendar().catch(() => null),
        listAcademicTerms().catch(() => []),
      ]);
    const upcomingEvents = events.filter((e) => isUpcoming(e.endsAt));

    const person = personRes.ok ? ((await personRes.json()) as { data: { person: { id: string; firstName: string; lastName: string | null } } }).data.person : null;
    const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";
    const pendingLeave = leaveRequests.filter((r) => r.state === "PENDING").length;
    const resolvedLeave = leaveRequests.length - pendingLeave;
    const leavePct = leaveRequests.length > 0 ? Math.round((resolvedLeave / leaveRequests.length) * 100) : 100;

    const advisedSection = advisorSections[0] ?? null;
    const sectionLabel = advisedSection ? `${advisedSection.gradeName}-${advisedSection.sectionName}` : null;

    const roster = advisedSection ? await getAttendanceRoster(advisedSection.sectionId, todayIso()).catch(() => null) : null;
    const rosterTotal = roster?.records.length ?? 0;
    const presentCount = roster ? roster.records.filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)).length : 0;
    const absentees = roster ? roster.records.filter((r) => r.status === "ABSENT") : [];

    const currentTerm = terms.find((t) => t.isCurrent) ?? null;
    const termStart = currentTerm?.startDate ?? calendar?.academicYear?.startDate ?? null;
    const termHistory =
      view === "term" && advisedSection && termStart
        ? await getAttendanceHistory(advisedSection.sectionId, termStart, todayIso()).catch(() => [])
        : [];

    const classDashboard = advisedSection ? await getClassTeacherDashboard(advisedSection.sectionId).catch(() => null) : null;

    let attendancePct: number | null = null;
    let attendanceNote: string | undefined;
    if (view === "today") {
      attendancePct = rosterTotal > 0 ? Math.round((presentCount / rosterTotal) * 1000) / 10 : null;
      attendanceNote = advisedSection ? (absentees.length > 0 ? `${absentees.length} student${absentees.length === 1 ? "" : "s"} absent today` : "Full attendance today") : undefined;
    } else {
      const totalStudentDays = termHistory.reduce((s, d) => s + d.total, 0);
      const presentStudentDays = termHistory.reduce((s, d) => s + d.present, 0);
      attendancePct = totalStudentDays > 0 ? Math.round((presentStudentDays / totalStudentDays) * 1000) / 10 : null;
      attendanceNote = advisedSection ? `${termHistory.length} day${termHistory.length === 1 ? "" : "s"} recorded this term` : undefined;
    }

    const todayPeriods = timetable
      ? timetable.days
          .find((d) => d.dayOfWeek === todayDow())
          ?.slots.slice()
          .sort((a, b) => a.periodNo - b.periodNo) ?? []
      : [];
    const nowHM = new Date().toTimeString().slice(0, 8);
    const takenCount = todayPeriods.filter((p) => p.endTime <= nowHM).length;
    const remainingCount = todayPeriods.length - takenCount;
    const nextPeriod = todayPeriods.find((p) => p.endTime > nowHM) ?? null;
    const classesTodayPct = todayPeriods.length > 0 ? Math.round((takenCount / todayPeriods.length) * 100) : 0;
    const lastPeriodEnd = todayPeriods.length > 0 ? todayPeriods[todayPeriods.length - 1].endTime : null;

    const homeworkTotalSeats = homework?.items.reduce((s, i) => s + i.total, 0) ?? 0;
    const homeworkGradedSeats = homework?.items.reduce((s, i) => s + i.gradedCount, 0) ?? 0;
    const homeworkPct = homeworkTotalSeats > 0 ? Math.round((homeworkGradedSeats / homeworkTotalSeats) * 100) : 0;

    const attentionItems: { title: string; sub: string }[] = [];
    if (roster && absentees.length > 0) {
      attentionItems.push({
        title: `${absentees.length} student${absentees.length === 1 ? "" : "s"} absent today`,
        sub: absentees.map((a) => [a.firstName, a.lastName].filter(Boolean).join(" ")).join(", "),
      });
    }
    if (pendingLeave > 0) {
      attentionItems.push({
        title: `${pendingLeave} leave request${pendingLeave === 1 ? "" : "s"} waiting`,
        sub: "Raised by parents, awaiting your decision",
      });
    }
    if (homework && homework.stats.ungraded > 0) {
      attentionItems.push({
        title: `${homework.stats.ungraded} homework submission${homework.stats.ungraded === 1 ? "" : "s"} ungraded`,
        sub: "Parents have marked these complete",
      });
    }

    return (
      <div>
        <div>
          <h1 style={{ font: "700 38px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-ink)" }}>
            {greeting()}{personName ? `, ${personName}` : ""}
          </h1>
          <p style={{ font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", margin: "9px 0 0" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {` · ${todayPeriods.length} class${todayPeriods.length === 1 ? "" : "es"} today`}
            {lastPeriodEnd ? ` · attendance window closes at ${formatClock(lastPeriodEnd)}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2.5" style={{ marginTop: 18 }}>
            <div style={{ display: "flex", background: "var(--fac-tint)", borderRadius: 9, padding: 3, gap: 2 }}>
              <Link href="/faculty" style={tabStyle(view === "today")}>Today</Link>
              <Link href="/faculty?view=term" style={tabStyle(view === "term")}>This term</Link>
            </div>
            <Link
              href="/faculty/attendance"
              className="fac-hover-lift"
              style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
            >
              Mark attendance
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 26 }}>
          <StatTile
            label="Classes today"
            value={String(todayPeriods.length)}
            sub={todayPeriods.length > 0 ? `${takenCount} taken · ${remainingCount} remaining` : "No classes scheduled today"}
            pct={`${classesTodayPct}%`}
            note={
              todayPeriods.length === 0
                ? undefined
                : remainingCount === 0
                  ? "No more classes today"
                  : nextPeriod
                    ? `Next: ${nextPeriod.subjectName} at ${formatClock(nextPeriod.startTime)}`
                    : undefined
            }
          />
          <Link href="/faculty/attendance">
            <StatTile
              label="My class attendance"
              value={attendancePct !== null ? `${attendancePct}%` : "—"}
              sub={advisedSection ? `${sectionLabel} · ${classDashboard?.stats.strength ?? rosterTotal} students · ${view === "today" ? "today" : "this term"}` : "Not a class advisor"}
              pct={`${attendancePct ?? 0}%`}
              note={attendanceNote}
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
          <Link href="/faculty/homework">
            <StatTile
              label="Homework open"
              value={String(homework?.stats.open ?? 0)}
              sub={`${homework?.stats.dueToday ?? 0} due today · ${homework?.stats.ungraded ?? 0} to review`}
              pct={`${homeworkPct}%`}
              note={homeworkTotalSeats > 0 ? `${homeworkGradedSeats} of ${homeworkTotalSeats} submissions graded` : undefined}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.15fr_1fr_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, font: "700 19px/1.2 var(--fac-font-sans)" }}>Up next</h3>
              <Link href="/faculty/timetable" style={{ border: 0, background: "none", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                Full timetable
              </Link>
            </div>
            {todayPeriods.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>No periods scheduled today.</p>
            ) : (
              todayPeriods.map((p) => (
                <div key={p.slotId} className="fac-hover-lift flex items-center gap-3.5" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <div style={{ width: 54 }}>
                    <div className="fac-font-mono" style={{ font: "500 13px/1.2 var(--fac-font-mono)", color: "var(--fac-primary)" }}>{p.startTime.slice(0, 5)}</div>
                    <div className="fac-font-mono" style={{ font: "400 11px/1.3 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>P{p.periodNo}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{p.subjectName}</div>
                    <div style={{ font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{p.gradeName} {p.sectionName}</div>
                  </div>
                  {p.room && (
                    <div style={{ font: "500 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 6, padding: "6px 9px" }}>
                      {p.room}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0, font: "700 19px/1.2 var(--fac-font-sans)" }}>Needs attention</h3>
              <span style={{ font: "500 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "5px 10px" }}>
                {attentionItems.length} flag{attentionItems.length === 1 ? "" : "s"}
              </span>
            </div>
            {attentionItems.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>Nothing flagged today.</p>
            ) : (
              attentionItems.map((a, i) => (
                <div key={i} className="fac-hover-lift flex gap-2.5" style={{ padding: "10px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fac-primary)", marginTop: 7, flex: "0 0 7px" }} />
                  <div>
                    <div style={{ font: "600 14px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{a.title}</div>
                    <div style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 2 }}>{a.sub}</div>
                  </div>
                </div>
              ))
            )}
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
              announcements.slice(0, 4).map((n) => (
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

        {advisedSection && classDashboard && (
          <div style={{ marginTop: 18 }}>
            <Card>
              <div className="flex items-center justify-between flex-wrap gap-2.5" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 style={{ margin: 0, font: "700 19px/1.2 var(--fac-font-sans)" }}>My class · {sectionLabel}</h3>
                  <span style={{ font: "500 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)", background: "var(--fac-tint)", borderRadius: 20, padding: "5px 10px" }}>
                    Class advisor view
                  </span>
                </div>
                <Link href="/faculty/class-teacher" style={{ border: 0, background: "none", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                  Class board
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-4">
                <MiniStat label="Students" value={String(classDashboard.stats.strength)} sub={sectionLabel ?? ""} />
                <MiniStat
                  label="Mean attendance"
                  value={attendancePct !== null ? `${attendancePct}%` : "—"}
                  sub={view === "today" ? "today" : "this term"}
                />
                <MiniStat label="Pending requests" value={String(pendingLeave)} sub="leave" />
                <MiniStat label="On leave today" value={String(classDashboard.stats.onLeaveToday)} sub={sectionLabel ?? ""} />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 18 }}>
          <RecentMessagesCard personId={person?.id ?? ""} />
          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Consent requests</h3>
            {upcomingEvents.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No consent requests yet.</p>
            ) : (
              upcomingEvents.slice(0, 4).map((e) => (
                <Link
                  key={e.id}
                  href="/faculty/permissions"
                  className="fac-hover-lift flex items-center gap-3"
                  style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}
                >
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{e.name}</span>
                    <span style={{ display: "block", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 3 }}>
                      {e.monitoringTeacherName} · {new Date(e.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your dashboard. Nothing was changed -- try again." />;
  }
}
