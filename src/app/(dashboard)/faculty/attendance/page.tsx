// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isAttendance"
// screen. Reuses the EXISTING, already-working server actions
// (markAllPresentAction, markRecordAction in ./actions.ts) unchanged --
// only the presentation layer is rebuilt.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getAttendanceRoster, listAdvisorSections } from "@/lib/faculty-api";
import { markAllPresentAction, publishAttendanceAction } from "./actions";
import { PresentAbsentToggle } from "./PresentAbsentToggle";
import { DateSwitcher } from "./DateSwitcher";
import { Card } from "@/components/faculty-ui/Card";
import { Avatar } from "@/components/faculty-ui/Avatar";
import { StatusPill } from "@/components/faculty-ui/StatusPill";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function initialsOf(first: string, last: string | null): string {
  return [first, last].filter(Boolean).map((p) => p![0]?.toUpperCase()).join("") || "?";
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string; filter?: string }>;
}) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;
    const date = params.date || todayIso();
    const filter = params.filter ?? "all";
    const isToday = date === todayIso();

    if (sections.length === 0 || !sectionId) {
      return (
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Attendance</h1>
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not a class advisor -- attendance can only be marked by the section's own class advisor." />
          </div>
        </div>
      );
    }

    const section = sections.find((s) => s.sectionId === sectionId) ?? sections[0];
    const { session, records } = await getAttendanceRoster(sectionId, date);
    const editable = !session.isLocked;

    const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY");
    const absent = records.filter((r) => r.status === "ABSENT");
    const unmarked = records.filter((r) => !r.status);

    const filtered =
      filter === "present" ? present : filter === "absent" ? absent : filter === "unmarked" ? unmarked : records;

    const dateLabel = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Attendance</h1>
              <StatusPill tone={session.isLocked ? "blue" : "gray"}>{session.isLocked ? "Published" : "Draft"}</StatusPill>
            </div>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Class {section.gradeName}-{section.sectionName} · {records.length} students ·{" "}
              {session.isLocked
                ? "published -- further changes are tracked as corrections"
                : "draft -- each mark is saved as you go, publish when you're done"}
            </p>
          </div>
          <DateSwitcher sectionId={sectionId} date={date} />
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px]" style={{ marginTop: 22, alignItems: "start" }}>
          <div>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div style={{ font: "700 21px/1.2 var(--fac-font-sans)", color: "var(--fac-primary)" }}>
                    {dateLabel} · {records.length} students
                  </div>
                  <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>
                    {session.isLocked ? "Session locked -- corrections only" : `${present.length} marked present so far`}
                  </div>
                </div>
                <div className="flex gap-2.5">
                  {editable && (
                    <>
                      <form action={markAllPresentAction.bind(null, sectionId, date)}>
                        <button
                          type="submit"
                          style={{ border: "1px solid var(--fac-border-focus)", background: "var(--fac-tint)", color: "var(--fac-primary)", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}
                        >
                          Mark all present
                        </button>
                      </form>
                      <form action={publishAttendanceAction.bind(null, sectionId, date)}>
                        <button
                          type="submit"
                          style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}
                        >
                          Publish attendance
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3" style={{ marginTop: 18 }}>
                {([
                  { key: "present", value: present.length, label: "PRESENT" },
                  { key: "absent", value: absent.length, label: "ABSENT" },
                  { key: "unmarked", value: unmarked.length, label: "NOT MARKED" },
                ] as const).map((s) => {
                  const active = filter === s.key;
                  return (
                    <a
                      key={s.key}
                      href={`?sectionId=${sectionId}&date=${date}&filter=${active ? "all" : s.key}`}
                      className="fac-hover-lift block"
                      style={{
                        border: `1px solid ${active ? "var(--fac-outline-hover)" : "var(--fac-border)"}`,
                        borderRadius: 10,
                        padding: 14,
                        textAlign: "center",
                        background: active ? "var(--fac-tint)" : "var(--fac-white)",
                      }}
                    >
                      <span style={{ display: "block", font: "700 26px/1 var(--fac-font-sans)", color: s.key === "absent" ? "var(--fac-red-text)" : "var(--fac-ink)" }}>
                        {s.value}
                      </span>
                      <span style={{ display: "block", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", marginTop: 7 }}>
                        {s.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </Card>

            <div style={{ marginTop: 16 }}>
              <Card padding="0">
                <div className="fac-hover-lift flex items-center gap-3" style={{ padding: "16px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                  <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", flex: 1 }}>
                    {filter === "all" ? `ALL ${records.length} STUDENTS` : `${filtered.length} ${filter.toUpperCase()}`}
                  </span>
                  {filter !== "all" && (
                    <a
                      href={`?sectionId=${sectionId}&date=${date}&filter=all`}
                      style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 20, padding: "8px 14px", font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}
                    >
                      Show all {records.length}
                    </a>
                  )}
                </div>
                {filtered.map((r) => (
                  <div key={r.id} className="fac-hover-lift flex items-center gap-3.5" style={{ padding: "12px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                    <Avatar initials={initialsOf(r.firstName, r.lastName)} size="xs" />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", font: "600 15px/1.3 var(--fac-font-sans)" }}>{[r.firstName, r.lastName].filter(Boolean).join(" ")}</span>
                      <span style={{ display: "block", font: "400 13px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Roll {r.rollNo ?? "--"}</span>
                    </span>
                    {editable ? (
                      <PresentAbsentToggle recordId={r.id} sectionId={sectionId} status={r.status} />
                    ) : (
                      <span
                        style={{
                          font: "600 13px/1 var(--fac-font-sans)",
                          borderRadius: 20,
                          padding: "8px 14px",
                          background: r.status === "ABSENT" ? "var(--fac-red-bg)" : "var(--fac-tint)",
                          color: r.status === "ABSENT" ? "var(--fac-red-text)" : "var(--fac-primary)",
                        }}
                      >
                        {r.status || "Not marked"}
                      </span>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {!isToday && (
            <Card>
              <p style={{ font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", textAlign: "center" }}>
                Viewing {dateLabel} -- <a href={`?sectionId=${sectionId}&date=${todayIso()}`} style={{ color: "var(--fac-primary)" }}>back to today</a>
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load attendance. Nothing was changed -- try again." />;
  }
}
