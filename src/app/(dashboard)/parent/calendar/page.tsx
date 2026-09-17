// Academic Calendar -- pixel-rebuilt from the design's own isCalendar
// screen. Real calendar_event rows (getCalendar), scoped to the school-wide
// + this child's real stage. Month navigation via a real ?month= query
// param -- calendar events are fetched once and filtered/grouped
// server-side for whichever month is requested.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getCalendar, listChildren, resolveSelectedChild } from "@/lib/parent-api";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export default async function ParentCalendarPage({ searchParams }: { searchParams: Promise<{ studentId?: string; month?: string }> }) {
  try {
    const { studentId: requestedStudentId, month } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const events = await getCalendar(selected.studentId);
    const cursor = month ? parseMonthKey(month) : new Date();
    const currentMonthKey = monthKey(cursor);
    const prevMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    const nextMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const startDow = monthStart.getDay();

    function eventsOn(day: number): typeof events {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      return events.filter((e) => {
        const s = new Date(e.startDate);
        const en = new Date(e.endDate);
        return d >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && d <= new Date(en.getFullYear(), en.getMonth(), en.getDate());
      });
    }

    const monthEvents = events
      .filter((e) => {
        const s = new Date(e.startDate);
        return s.getFullYear() === cursor.getFullYear() && s.getMonth() === cursor.getMonth();
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const cells: { day: number | null; hasEvent: boolean }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ day: null, hasEvent: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, hasEvent: eventsOn(d).length > 0 });

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Academic Calendar</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Term dates, exams and school events</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Link href={`/parent/calendar?studentId=${selected.studentId}&month=${prevMonthKey}`}>
                <span style={{ display: "flex", width: 32, height: 32, borderRadius: 8, border: "1px solid var(--par-border)", background: "#fff", cursor: "pointer", color: "var(--par-body-muted)", alignItems: "center", justifyContent: "center" }}>‹</span>
              </Link>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-ink)" }}>{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
                <div style={{ fontSize: 12, color: "var(--par-tertiary)" }}>{monthEvents.length} event{monthEvents.length === 1 ? "" : "s"}</div>
              </div>
              <Link href={`/parent/calendar?studentId=${selected.studentId}&month=${nextMonthKey}`}>
                <span style={{ display: "flex", width: 32, height: 32, borderRadius: 8, border: "1px solid var(--par-border)", background: "#fff", cursor: "pointer", color: "var(--par-body-muted)", alignItems: "center", justifyContent: "center" }}>›</span>
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 16 }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--par-tertiary)", padding: "6px 0" }}>{w}</div>
              ))}
              {cells.map((c, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    background: c.hasEvent ? "var(--par-tint)" : undefined,
                    color: c.hasEvent ? "var(--par-primary)" : "var(--par-ink)",
                  }}
                >
                  {c.day ?? ""}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--par-ink)" }}>Events in {cursor.toLocaleDateString("en-GB", { month: "long" })}</div>
            {monthEvents.length === 0 && <div style={{ fontSize: 13.5, color: "var(--par-tertiary)" }}>No events this month.</div>}
            {monthEvents.map((e) => {
              const s = new Date(e.startDate);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--par-divider)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{s.getDate()}</div>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>{s.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>{e.description ?? ""}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: e.isHoliday ? "var(--par-red-bg)" : "var(--par-tint)", color: e.isHoliday ? "var(--par-red)" : "var(--par-primary)", padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
                    {e.isHoliday ? "Holiday" : e.eventType}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the calendar."} />;
  }
}
