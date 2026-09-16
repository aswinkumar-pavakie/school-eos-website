"use client";

// Month-grid Academic Calendar view, pixel-matched against the literal markup
// in Principal Console.dc.html's isCalendar/isEvents/isNewEvent sections (not
// inferred from style.specs' prose -- checked every value against the actual
// inline style="..." attributes). All events for the academic year are
// fetched once server-side; navigating months here is pure client-side
// filtering, no reload.

import { useState, useTransition, type ReactNode } from "react";
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
  createdBy: string | null;
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
// Real eventType enum only (school-eos-backend's CreateCalendarEventDto) --
// the mockup's own category list (Institution/Instruction/Assessment/
// Holiday/Co-curricular) doesn't map 1:1 onto our real data model, and
// forcing an arbitrary mapping would make the stored eventType less accurate
// than just offering our real categories directly. Visual style matches the
// mockup's select exactly; the option set is real, not copied verbatim.
const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS);

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
  title,
  subtitle,
  yearFilter,
  events,
  campuses,
  grades,
  sections,
  readOnly,
  academicYearId,
  createAction,
  currentPersonId,
}: {
  // Page chrome now owned by this one shared component (all three roles'
  // page.tsx just pass their own title/subtitle string), so the "+ Add
  // event" action can sit top-right of the page header exactly like the
  // mockup's own page.actions -- not floating in its own card below, which
  // was wasting a full row of vertical space and was part of why the full
  // month grid needed scrolling to see on a normal laptop viewport.
  title: string;
  subtitle: string;
  // The Academic year <select> filter is real (multi-year data), but not in
  // the mockup at all -- folded into the same header row as the actions
  // instead of its own dedicated row below, for the same vertical-space
  // reason. Server Component pages pass their own <form>...</form> JSX in.
  yearFilter?: ReactNode;
  events: CalendarEventRow[];
  campuses: { id: string; name: string }[];
  grades: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  // Additive, defaults to false so Admin's own page (the original caller) is
  // unaffected -- Principal's page passes true to hide the Remove action it
  // has no backend authority to perform (create and delete are separate
  // permissions -- see calendar-events.controller.ts).
  readOnly?: boolean;
  // Both optional together -- when provided (Principal's/Admin's pages), a
  // real "+ Add event" flow renders per the mockup's isNewEvent panel.
  // Omitted entirely (Vice Principal -- POST /calendar-events genuinely
  // isn't granted to VICE_PRINCIPAL on the backend, a deliberate scope
  // decision this reframe doesn't touch), nothing changes from before.
  academicYearId?: string;
  createAction?: (academicYearId: string, isoDate: string, title: string, eventType: string) => Promise<{ error?: string }>;
  /** Real actor personId -- compared against each event's real createdBy to
   * show "added by you" only for events this exact person actually created,
   * never a guess. */
  currentPersonId?: string;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // No day pre-selected by default -- the right-side list starts showing
  // every event in the visible month (unfiltered), same as before. Clicking
  // a day filters the list down to just that day's events; clicking the same
  // day again clears the filter back to the whole month.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newEventType, setNewEventType] = useState(EVENT_TYPE_OPTIONS[0][0]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedEvents = events.map((e) => ({ ...e, start: toDateOnly(e.startDate), end: toDateOnly(e.endDate) }));

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

  // Real filter, not just a visual highlight: when a day is selected, only
  // events overlapping that exact calendar day show on the right.
  const visibleEvents =
    selectedDay === null
      ? eventsInMonth
      : eventsInMonth.filter((e) => {
          const selected = new Date(viewYear, viewMonth, selectedDay);
          return e.start <= selected && e.end >= selected;
        });

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

  const canAdd = newDay.trim() !== "" && Number(newDay) >= 1 && Number(newDay) <= daysInMonth && newTitle.trim() !== "";

  function submitNewEvent() {
    if (!canAdd || !academicYearId || !createAction) return;
    const day = Number(newDay);
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setCreateError(null);
    startTransition(async () => {
      const result = await createAction(academicYearId, iso, newTitle.trim(), newEventType);
      if (result.error) {
        setCreateError(result.error);
        return;
      }
      setNewDay("");
      setNewTitle("");
      setIsAdding(false);
    });
  }

  const canShowAddButton = Boolean(createAction && academicYearId) && !isAdding;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* 38px/700/-0.028em, per Principal Console.dc.html's own page.title markup. */}
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">{title}</h1>
          <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
        </div>
        {/* Header actions, right-aligned -- mirrors page.actions in the mockup's
            own calendarPage(): "+ Add event" only shows when the form isn't
            already open (this.state.calForm ? [] : [...]), same rule here. */}
        <div className="flex flex-wrap items-end gap-3">
          {yearFilter}
          {canShowAddButton && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="rounded-[10px] bg-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-deep"
            >
              + Add event
            </button>
          )}
        </div>
      </div>

      {createAction && academicYearId && isAdding && (
        <div className="rounded-[16px] border border-border bg-surface p-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">
                  New event · {MONTH_NAMES[viewMonth]} {viewYear}
                </p>
                <p className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                  Added by the principal&apos;s office · shown alongside the published calendar
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setCreateError(null);
                }}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-text-muted hover:bg-bg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <label className="flex w-[120px] shrink-0 flex-col gap-2">
                <span className="text-[13px] font-semibold text-primary-deep">Day</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="14"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
                />
              </label>
              <label className="flex min-w-[260px] flex-1 flex-col gap-2">
                <span className="text-[13px] font-semibold text-primary-deep">Event</span>
                <input
                  type="text"
                  placeholder="e.g. Alumni interaction · Class 12"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
                />
              </label>
              <label className="flex w-[220px] shrink-0 flex-col gap-2">
                <span className="text-[13px] font-semibold text-primary-deep">Category</span>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  className="w-full cursor-pointer rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
                >
                  {EVENT_TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {createError && <p className="text-[13px] font-semibold text-critical-text">{createError}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canAdd || isPending}
                onClick={submitNewEvent}
                className="flex min-h-[48px] items-center rounded-[10px] bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-[#9dc0f5]"
              >
                {isPending ? "Adding…" : "Add to calendar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setCreateError(null);
                }}
                className="flex min-h-[48px] items-center rounded-[10px] border border-border bg-surface px-6 text-[15px] font-semibold text-text hover:bg-bg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[16px] border border-border bg-surface p-5">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg text-[18px] text-primary-deep transition-colors hover:bg-primary/10"
            >
              ‹
            </button>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <p className="text-[27px] font-bold leading-none tracking-[-0.02em] text-text">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </p>
              <p className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                {eventsInMonth.length} calendar event{eventsInMonth.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg text-[18px] text-primary-deep transition-colors hover:bg-primary/10"
            >
              ›
            </button>
          </div>

          <div className="mt-[18px] grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-text-muted">
            {WEEKDAY_HEADERS.map((d, i) => (
              <div key={i} className="pb-0.5">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEvent = eventDaysInMonth.has(day);
              const isSelected = selectedDay === day;
              const isSunday = new Date(viewYear, viewMonth, day).getDay() === 0;
              // Colors per the mockup's own legend exactly: selected beats
              // has-events beats Sunday/holiday beats plain.
              let bg = "transparent";
              let border = "transparent";
              if (isSelected) {
                bg = "#dbe7ff";
                border = "#1f6feb";
              } else if (hasEvent) {
                bg = "#eef4ff";
                border = "#dbe7ff";
              } else if (isSunday) {
                bg = "#f6f8fb";
                border = "#f0f3f8";
              }
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  style={{ background: bg, borderColor: border }}
                  className="flex h-14 items-center justify-center rounded-[10px] border text-[16px] font-semibold text-text transition-colors"
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-[14px] flex flex-wrap items-center gap-[18px] border-t border-[#eef1f6] pt-[14px]">
            <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--color-text-secondary, var(--color-text-muted))" }}>
              <span className="h-3.5 w-3.5 rounded-[5px]" style={{ background: "#eef4ff", border: "1px solid #dbe7ff" }} />
              has events
            </span>
            <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--color-text-secondary, var(--color-text-muted))" }}>
              <span className="h-3.5 w-3.5 rounded-[5px]" style={{ background: "#dbe7ff", border: "1px solid #1f6feb" }} />
              selected day
            </span>
            <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--color-text-secondary, var(--color-text-muted))" }}>
              <span className="h-3.5 w-3.5 rounded-[5px]" style={{ background: "#f6f8fb", border: "1px solid #f0f3f8" }} />
              holiday · Sunday
            </span>
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">
              {selectedDay === null
                ? `Events in ${MONTH_NAMES[viewMonth]}`
                : `Events on ${selectedDay} ${MONTH_NAMES[viewMonth]}`}
            </h2>
            {selectedDay !== null && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="shrink-0 text-[13px] font-semibold text-primary hover:underline"
              >
                Show whole month
              </button>
            )}
          </div>
          <div className="flex flex-col">
            {visibleEvents.length === 0 && (
              <p className="py-7 text-[15px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                {selectedDay === null ? "No events recorded for this month." : "No events on this day."}
              </p>
            )}
            {visibleEvents.map((e) => {
              const mine = currentPersonId != null && e.createdBy === currentPersonId;
              return (
                <div key={e.id} className="flex items-center gap-4 border-t border-[#eef1f6] py-4 first:border-t-0">
                  <div className="flex h-[58px] w-[58px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] bg-bg">
                    <span className="text-[19px] font-bold leading-none text-text">{e.start.getDate()}</span>
                    <span className="text-[10px] font-semibold tracking-[0.1em]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                      {WEEKDAY_SHORT[e.start.getDay()]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold leading-tight tracking-[-0.01em] text-text">{e.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5">
                      <span className="text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                        {e.startDate.slice(0, 10) === e.endDate.slice(0, 10) ? "" : `through ${e.end.getDate()} · `}
                        {scopeLabel(e, { campuses, grades, sections })}
                      </span>
                      {!readOnly ? (
                        <DeleteCalendarEventButton id={e.id} />
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--color-text-faint, var(--color-text-muted))" }}>
                          {mine ? "added by you" : "published · read only"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-2 text-[12px] font-semibold text-primary-deep"
                    style={{ background: "#eef4ff" }}
                  >
                    {EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
