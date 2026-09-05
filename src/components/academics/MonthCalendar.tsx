"use client";

// Month-grid Academic Calendar view (per reference-img/academic-calendar layout):
// a real calendar grid on the left, prev/next month navigation, and an "Events in
// <Month>" list on the right showing every event overlapping the visible month.
// All events for the academic year are fetched once server-side; navigating months
// here is pure client-side filtering, no reload.

import { useMemo, useState } from "react";
import { DeleteCalendarEventButton } from "./DeleteCalendarEventButton";

export interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  scopeType: string;
  scopeId: string | null;
  scopeStage: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  HOLIDAY: "Holiday",
  TERM_START: "Term start",
  TERM_END: "Term end",
  EXAM_WINDOW: "Exam window",
  PTM: "PTM",
  FUNCTION: "Function",
  COMPETITION: "Competition",
  WORKING_SATURDAY: "Working Saturday",
  OTHER: "Event",
};

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateOnly(iso: string): Date {
  // Stored dates come back as UTC-midnight timestamps -- read the UTC
  // calendar fields directly so a date never shifts a day for a viewer west of
  // UTC (matches the display/storage convention used elsewhere in this build).
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function scopeLabel(
  e: CalendarEventRow,
  lookups: { campuses: { id: string; name: string }[]; grades: { id: string; name: string }[]; sections: { id: string; name: string }[] },
): string {
  if (e.scopeType === "SCHOOL") return "Whole school";
  if (e.scopeType === "STAGE") return e.scopeStage?.replace(/_/g, " ") ?? "Stage";
  if (e.scopeType === "CAMPUS") return lookups.campuses.find((c) => c.id === e.scopeId)?.name ?? "Campus";
  if (e.scopeType === "GRADE") return lookups.grades.find((g) => g.id === e.scopeId)?.name ?? "Standard";
  if (e.scopeType === "SECTION") return lookups.sections.find((s) => s.id === e.scopeId)?.name ?? "Section";
  return e.scopeType;
}

export function MonthCalendar({
  events,
  campuses,
  grades,
  sections,
}: {
  events: CalendarEventRow[];
  campuses: { id: string; name: string }[];
  grades: { id: string; name: string }[];
  sections: { id: string; name: string }[];
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const parsedEvents = useMemo(
    () => events.map((e) => ({ ...e, start: toDateOnly(e.startDate), end: toDateOnly(e.endDate) })),
    [events],
  );

  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const leadingBlanks = monthStart.getDay();

  const eventsInMonth = parsedEvents
    .filter((e) => e.start <= monthEnd && e.end >= monthStart)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const eventDaysInMonth = new Set<number>();
  for (const e of eventsInMonth) {
    const from = e.start < monthStart ? 1 : e.start.getDate();
    const to = e.end > monthEnd ? daysInMonth : e.end.getDate();
    for (let d = from; d <= to; d++) eventDaysInMonth.add(d);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
  }

  const isRealToday = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[16px] border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-border text-text-muted hover:bg-bg"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-[17px] font-bold text-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <p className="text-xs text-text-muted">{eventsInMonth.length} calendar events</p>
          </div>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-border text-text-muted hover:bg-bg"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
          {WEEKDAY_HEADERS.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvent = eventDaysInMonth.has(day);
            const isToday = isRealToday && day === today.getDate();
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`flex aspect-square flex-col items-center justify-center rounded-[11px] border-2 text-sm font-semibold transition-colors ${
                  isToday ? "border-primary" : "border-transparent"
                } ${
                  hasEvent
                    ? "bg-[#ACBFEA] text-[#16233f] hover:bg-[#9db3e3]"
                    : isSelected
                      ? "bg-field text-text"
                      : "text-text hover:bg-field"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-surface p-5">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Events in {MONTH_NAMES[viewMonth]}</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {eventsInMonth.length === 0 && <p className="text-sm text-text-muted">No events this month.</p>}
          {eventsInMonth.map((e) => (
            <li key={e.id} className="flex items-start gap-3 rounded-[11px] border border-border p-2.5">
              <div className="flex w-11 shrink-0 flex-col items-center rounded-[7px] bg-field py-1.5">
                <span className="text-base font-bold leading-none text-text">{e.start.getDate()}</span>
                <span className="text-[10px] font-bold uppercase text-text-muted">{WEEKDAY_SHORT[e.start.getDay()]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-text">{e.title}</p>
                <p className="text-xs text-text-muted">
                  {e.startDate.slice(0, 10) === e.endDate.slice(0, 10) ? "" : `through ${e.end.getDate()} · `}
                  {scopeLabel(e, { campuses, grades, sections })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={`whitespace-nowrap rounded-[7px] px-2 py-0.5 text-[11px] font-bold ${
                    e.isHoliday ? "bg-critical-bg text-critical-text" : "bg-primary/10 text-primary"
                  }`}
                >
                  {EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}
                </span>
                <DeleteCalendarEventButton id={e.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
