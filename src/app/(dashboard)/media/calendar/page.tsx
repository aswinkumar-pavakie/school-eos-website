// Academic calendar -- pixel-rebuilt from the design's own isCalendar
// screen. Real calendar_event rows (listCalendarEvents), extended to
// MEDIA_ROOM read + create for this rebuild -- see calendar-events.controller.ts's
// own comment. "+Add media event" writes a real, school-wide-visible
// calendar_event (scope_type SCHOOL is the only option the schema has --
// no per-department scope column exists), not a client-only/fake entry.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listAcademicYears, listCalendarEvents } from "@/lib/media-api";
import { AddMediaEventPanel } from "./AddMediaEventPanel";
import { EventRow } from "./EventRow";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export default async function MediaCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  try {
    const { month } = await searchParams;
    const actor = await getCurrentActor().catch(() => null);
    const years = await listAcademicYears();
    const currentYear = years.find((y) => y.isCurrent) ?? years[years.length - 1];
    if (!currentYear) return <ErrorState message="No academic year has been set up yet." />;

    const events = await listCalendarEvents(currentYear.id);

    const cursor = month ? parseMonthKey(month) : new Date();
    const currentMonthKey = monthKey(cursor);
    const prevMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    const nextMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const startDow = monthStart.getDay();

    function eventsOn(day: number) {
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
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Academic calendar</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>School events on the academic calendar · add media events and plan coverage ahead.</div>
          </div>
          <AddMediaEventPanel academicYearId={currentYear.id} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 20, marginTop: 24, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <a href={`/media/calendar?month=${prevMonthKey}`} style={{ width: 44, height: 44, borderRadius: 11, border: "1px solid var(--med-border)", background: "#fff", fontSize: 16, color: "var(--med-ink)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>‹</a>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
                <div style={{ fontSize: 13, color: "var(--med-body-muted)", marginTop: 2 }}>{monthEvents.length} calendar events</div>
              </div>
              <a href={`/media/calendar?month=${nextMonthKey}`} style={{ width: 44, height: 44, borderRadius: 11, border: "1px solid var(--med-border)", background: "#fff", fontSize: 16, color: "var(--med-ink)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginTop: 22 }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "var(--med-tertiary)" }}>{w}</div>
              ))}
              {cells.map((c, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    borderRadius: 9,
                    padding: "10px 0",
                    fontSize: 14,
                    fontWeight: c.hasEvent ? 700 : 500,
                    background: c.hasEvent ? "var(--med-tint)" : undefined,
                    color: c.hasEvent ? "var(--med-primary)" : "var(--med-ink)",
                  }}
                >
                  {c.day ?? ""}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: 26 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Events in {cursor.toLocaleDateString("en-GB", { month: "long" })}</div>
            {monthEvents.length === 0 ? (
              <div style={{ marginTop: 12 }}><EmptyPanel label="No events this month." /></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
                {monthEvents.map((e) => (
                  <EventRow key={e.id} event={e} canModify={!!actor && e.createdBy === actor.personId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the academic calendar."} />;
  }
}
