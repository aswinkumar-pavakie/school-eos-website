// Faculty Dashboard -- pixel-rebuilt to match
// brain/SIS Class teacher/Class Teacher Portal.dc.html's "isDash" screen.
// Every figure here is a real read against the caller's own scope (advisor
// sections, teaching offerings, today's attendance roster, pending leave,
// homework, announcements, timetable, permission activities, conversations)
// -- nothing fabricated. Stat-tile labels are the design's own generic
// {label,value,strong,sub,pct,note} shape, populated with this teacher's
// real, currently-available metrics (the design's own sample data used
// student-roster stats that would require net-new backend aggregation this
// phase doesn't add).

import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import {
  getAttendanceRoster,
  listAdvisorSections,
  listAnnouncements,
  listStudentLeaveRequests,
  listTeachingOfferings,
  listHomework,
} from "@/lib/faculty-api";
import { getWeeklyTimetable } from "@/lib/faculty-academics-api";
import { listEvents } from "@/lib/faculty-permissions-api";
import { isUpcoming } from "@/lib/faculty-time";
import { listConversations } from "@/lib/faculty-messages-api";
import { Card } from "@/components/faculty-ui/Card";
import { StatTile } from "@/components/faculty-ui/StatTile";
import { Avatar } from "@/components/faculty-ui/Avatar";
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
function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default async function FacultyDashboardPage() {
  try {
    const [advisorSections, teachingOfferings, leaveRequests, homework, personRes, announcements, timetable, events, conversations] =
      await Promise.all([
        listAdvisorSections().catch(() => []),
        listTeachingOfferings().catch(() => []),
        listStudentLeaveRequests().catch(() => []),
        listHomework().catch(() => null),
        apiFetch("/auth/me"),
        listAnnouncements().catch(() => []),
        getWeeklyTimetable().catch(() => null),
        // Real: student-events.controller.ts's /faculty/events, the same
        // backend the mobile app's own "Events" feature uses successfully.
        listEvents().catch(() => []),
        listConversations().catch(() => []),
      ]);
    const upcomingEvents = events.filter((e) => isUpcoming(e.endsAt));

    const person = personRes.ok ? ((await personRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }).data.person : null;
    const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";
    const pendingLeave = leaveRequests.filter((r) => r.state === "PENDING").length;
    const subjectCount = new Set(teachingOfferings.map((o) => o.subjectId)).size;

    const advisedSection = advisorSections[0] ?? null;
    const sectionLabel = advisedSection ? `${advisedSection.gradeName}-${advisedSection.sectionName}` : null;

    const roster = advisedSection ? await getAttendanceRoster(advisedSection.sectionId, todayIso()).catch(() => null) : null;
    const rosterTotal = roster?.records.length ?? 0;
    const presentCount = roster ? roster.records.filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)).length : 0;
    const absentees = roster ? roster.records.filter((r) => r.status === "ABSENT") : [];

    const todayPeriods = timetable
      ? timetable.days
          .find((d) => d.dayOfWeek === todayDow())
          ?.slots.slice()
          .sort((a, b) => a.periodNo - b.periodNo) ?? []
      : [];

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
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 style={{ font: "700 38px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-ink)" }}>
              {greeting()}{personName ? `, ${personName}` : ""}
            </h1>
            <p style={{ font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", margin: "9px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {sectionLabel ? ` · Class ${sectionLabel}` : ""}
              {rosterTotal > 0 ? ` · ${rosterTotal} students on roll` : ""}
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/faculty/attendance"
              className="fac-hover-lift"
              style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", font: "600 14px/1 var(--fac-font-sans)", color: "var(--fac-navy)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
            >
              Mark attendance
            </Link>
            <Link
              href="/faculty/message"
              style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
            >
              Message parents
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 26 }}>
          <Link href="/faculty/class-teacher">
            <StatTile label="Classes I advise" value={String(advisorSections.length)} sub={advisorSections.length > 0 ? advisorSections.map((s) => `${s.gradeName}-${s.sectionName}`).join(", ") : "Not a class advisor"} />
          </Link>
          <Link href="/faculty/subject-records">
            <StatTile label="Subjects I teach" value={String(subjectCount)} sub={`across ${teachingOfferings.length} class${teachingOfferings.length === 1 ? "" : "es"}`} />
          </Link>
          <Link href="/faculty/student-leave">
            <StatTile label="Leave requests pending" value={String(pendingLeave)} sub={pendingLeave > 0 ? "waiting for your decision" : "all caught up"} />
          </Link>
          <Link href="/faculty/homework">
            <StatTile label="Homework open" value={String(homework?.stats.open ?? 0)} sub={`${homework?.stats.dueToday ?? 0} due today · ${homework?.stats.ungraded ?? 0} to review`} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.15fr_1fr_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <h3 style={{ margin: 0, font: "700 19px/1.2 var(--fac-font-sans)" }}>Today&rsquo;s timetable</h3>
              <Link href="/faculty/timetable" style={{ border: 0, background: "none", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                Full week
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
              <Link href="/faculty/announcements" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", font: "600 12.5px/1 var(--fac-font-sans)", borderRadius: 7, padding: "8px 12px" }}>
                Post
              </Link>
            </div>
            {announcements.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", padding: "14px 0" }}>No notices yet.</p>
            ) : (
              announcements.slice(0, 4).map((n) => (
                <div key={n.id} className="fac-hover-lift" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <div className="flex items-center gap-2.5">
                    <span style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 5, padding: "4px 7px" }}>
                      {n.category ?? "NOTICE"}
                    </span>
                    <span style={{ font: "400 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                      {n.publishAt ? new Date(n.publishAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                  <div style={{ font: "600 14px/1.35 var(--fac-font-sans)", marginTop: 7, color: "var(--fac-ink)" }}>{n.title}</div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 18 }}>
          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Recent parent messages</h3>
            {conversations.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No conversations yet.</p>
            ) : (
              conversations.slice(0, 3).map((c) => {
                const name = c.student?.name ?? c.directParticipant?.name ?? "Conversation";
                return (
                  <Link
                    key={c.id}
                    href="/faculty/message"
                    className="fac-hover-lift flex gap-3"
                    style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}
                  >
                    <Avatar initials={initialsOf(name)} size="sm" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="flex items-center justify-between gap-2.5">
                        <span style={{ font: "600 14px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{name}</span>
                        <span style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                        </span>
                      </span>
                      <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.lastMessage?.body ?? "No messages yet"}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </Card>
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
