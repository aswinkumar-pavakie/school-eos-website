"use client";

// Shared "Academic Calendar" feature screen -- the canonical pixel design
// ported from Faculty's own calendar/CalendarMonthView.tsx (Faculty's screen
// is the source of truth here), restyled to the site-wide --eos-* tokens
// (globals.css) so every role with a personal academic-calendar feature
// renders byte-for-byte the same screen, not a per-role reskin. Faculty's
// own page now renders this exact component too (see faculty/calendar/
// page.tsx) -- there is no second copy of this UI anywhere to drift out of
// sync with.
//
// Personal events have no backend support anywhere (confirmed absent in
// both school-eos-backend's calendar_event table and the mobile app's own
// faculty-calendar-api.ts) -- they're real, working, per-person browser
// localStorage, same honest trade-off Faculty's original screen already
// disclosed in its own copy ("visible only to you, on this device").

import { useState, useSyncExternalStore } from "react";
import { MonthGrid } from "./MonthGrid";

export interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
}

interface PersonalEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  category: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CATEGORIES = ["Personal", "Reminder", "Class task", "Meeting"];

function toDateOnly(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Namespaced by BOTH the signed-in person's id AND a caller-supplied scope
// key (defaults to "default") -- a person can hold more than one role login
// but this app treats each role's calendar as its own personal space, same
// as it always has for Faculty; the scope key just keeps that true now that
// this same component/storage key pattern is reused by more than one route.
function storageKey(personId: string, scope: string): string {
  return `academic-calendar-personal-events:${scope}:${personId}`;
}

const listeners = new Map<string, Set<() => void>>();
function subscribe(key: string, callback: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => set!.delete(callback);
}
function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}
function getSnapshot(key: string): string {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}
function getServerSnapshot(): string {
  return "[]";
}
function writePersonalEvents(key: string, events: PersonalEvent[]) {
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    /* private-mode/storage-blocked browsers just won't persist across reloads -- still works this session via the in-memory notify() below */
  }
  notify(key);
}
function parsePersonalEvents(raw: string): PersonalEvent[] {
  try {
    return JSON.parse(raw) as PersonalEvent[];
  } catch {
    return [];
  }
}

export function AcademicCalendarView({
  events,
  personId,
  scope = "default",
  storageKeyOverride,
  academicYearLabel,
}: {
  events: CalendarEventRow[];
  personId: string;
  /** Distinguishes this role's own personal-events storage from another
   * role's, for an account holding more than one login (rare, but matches
   * this app's existing per-role data separation elsewhere). */
  scope?: string;
  /** Uses this exact string as the localStorage key instead of the scoped
   * default -- Faculty's own page passes its original, pre-unification key
   * (`faculty-calendar-personal-events:${personId}`) here so real users'
   * already-saved personal events keep working unchanged after this screen
   * became the shared component; a brand-new adopter (nothing to migrate)
   * just uses `scope` instead. */
  storageKeyOverride?: string;
  /** e.g. "Academic year 2026-27" -- shown in the subtitle when given;
   * omitted entirely renders Faculty's original subtitle text unchanged. */
  academicYearLabel?: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [addOpen, setAddOpen] = useState(false);
  const key = storageKeyOverride ?? storageKey(personId, scope);
  const rawPersonalEvents = useSyncExternalStore((cb) => subscribe(key, cb), () => getSnapshot(key), getServerSnapshot);
  const personalEvents = parsePersonalEvents(rawPersonalEvents);
  const [day, setDay] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState<string | undefined>();

  function persist(next: PersonalEvent[]) {
    writePersonalEvents(key, next);
  }

  function addEvent() {
    const dayNum = Number(day);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (!title.trim() || !Number.isInteger(dayNum) || dayNum < 1 || dayNum > daysInMonth) {
      setError("Enter a day in this month and an event name.");
      return;
    }
    setError(undefined);
    persist([...personalEvents, { id: crypto.randomUUID(), day: dayNum, month, year, title: title.trim(), category }]);
    setDay("");
    setTitle("");
    setAddOpen(false);
  }

  function removeEvent(id: string) {
    persist(personalEvents.filter((e) => e.id !== id));
  }

  const parsed = events.map((e) => ({ ...e, start: toDateOnly(e.startDate), end: toDateOnly(e.endDate) }));
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const inMonth = parsed.filter((e) => e.start <= monthEnd && e.end >= monthStart).sort((a, b) => a.start.getTime() - b.start.getTime());
  const personalInMonth = personalEvents.filter((e) => e.year === year && e.month === month).sort((a, b) => a.day - b.day);

  const eventDays = new Set<number>();
  for (const e of inMonth) {
    const from = e.start < monthStart ? 1 : e.start.getDate();
    const to = e.end > monthEnd ? monthEnd.getDate() : e.end.getDate();
    for (let d = from; d <= to; d++) eventDays.add(d);
  }
  const personalDays = new Set(personalInMonth.map((e) => e.day));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>Academic Calendar</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
            {academicYearLabel ? `${academicYearLabel} · ` : ""}published events are read-only · events you add are visible only to you
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          style={{ border: 0, background: "var(--eos-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--eos-font-sans)", borderRadius: 9, padding: "13px 20px" }}
        >
          {addOpen ? "Cancel" : "+ Add event"}
        </button>
      </div>

      {addOpen && (
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "20px 22px", marginTop: 18 }}>
          <div style={{ font: "700 19px/1.25 var(--eos-font-sans)", color: "var(--eos-ink)" }}>New event · {MONTH_NAMES[month]}</div>
          <div style={{ font: "400 13.5px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 3 }}>Added by you · visible only in your login</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[110px_minmax(0,1fr)_220px]" style={{ marginTop: 16, alignItems: "end" }}>
            <div>
              <div style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-primary)", marginBottom: 8 }}>DAY</div>
              <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="14" style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)" }} />
            </div>
            <div>
              <div style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-primary)", marginBottom: 8 }}>EVENT</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class 8-B remedial hour" style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)" }} />
            </div>
            <div>
              <div style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-primary)", marginBottom: 8 }}>CATEGORY</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)", background: "var(--eos-white)" }}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={{ font: "400 12.5px/1.4 var(--eos-font-sans)", color: "var(--eos-red-text)", marginTop: 10 }}>{error}</p>}
          <button type="button" onClick={addEvent} style={{ border: 0, cursor: "pointer", borderRadius: 10, padding: "13px 24px", font: "600 14.5px/1 var(--eos-font-sans)", color: "#fff", background: "var(--eos-primary)", marginTop: 16 }}>
            Add to calendar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4" style={{ marginTop: 18 }}>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--eos-tint)", display: "inline-block" }} /> School event
        </span>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "#f3e8ff", display: "inline-block" }} /> Personal (only you)
        </span>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--eos-red-bg)", display: "inline-block" }} /> Holiday
        </span>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.05fr]" style={{ marginTop: 12, alignItems: "start" }}>
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 22 }}>
          <MonthGrid
            year={year}
            month={month}
            headerNote={`${inMonth.length + personalInMonth.length} calendar events`}
            onMonthChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
            renderCell={(date) => {
              const dNum = date.getDate();
              const hasSchool = eventDays.has(dNum);
              const hasPersonal = personalDays.has(dNum);
              const bg = hasSchool ? "var(--eos-tint)" : hasPersonal ? "#f3e8ff" : "var(--eos-white)";
              const fg = hasSchool ? "var(--eos-primary)" : hasPersonal ? "#7c3aed" : "var(--eos-body)";
              return (
                <div style={{ height: 58, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", font: "500 14px/1 var(--eos-font-sans)", border: "1px solid var(--eos-border)", background: bg, color: fg }}>
                  {dNum}
                </div>
              );
            }}
          />
        </div>
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", font: "700 22px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Events in {MONTH_NAMES[month]}</h3>
          {inMonth.length === 0 && personalInMonth.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>No events in this month yet.</div>
          ) : (
            <>
              {inMonth.map((e) => (
                <div key={e.id} className="flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--eos-divider)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 11, background: e.isHoliday ? "var(--eos-red-bg)" : "var(--eos-tint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ font: "700 19px/1 var(--eos-font-sans)", color: e.isHoliday ? "var(--eos-red-text)" : "var(--eos-primary)" }}>{e.start.getDate()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 16px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{e.title}</div>
                    <div style={{ font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 3 }}>
                      {e.start.getTime() !== e.end.getTime() ? `Through ${e.end.getDate()} · ` : ""}{titleCase(e.eventType)}
                    </div>
                  </div>
                  <span style={{ font: "500 12.5px/1 var(--eos-font-sans)", color: e.isHoliday ? "var(--eos-red-text)" : "var(--eos-primary)", background: e.isHoliday ? "var(--eos-red-bg)" : "var(--eos-tint)", borderRadius: 20, padding: "7px 13px" }}>
                    {e.isHoliday ? "Holiday" : titleCase(e.eventType)}
                  </span>
                </div>
              ))}
              {personalInMonth.map((e) => (
                <div key={e.id} className="flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--eos-divider)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 11, background: "#f3e8ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ font: "700 19px/1 var(--eos-font-sans)", color: "#7c3aed" }}>{e.day}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 16px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{e.title}</div>
                    <div style={{ font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 3 }}>{e.category} · only visible to you</div>
                  </div>
                  <button type="button" onClick={() => removeEvent(e.id)} style={{ border: "1px solid var(--eos-border)", background: "var(--eos-white)", cursor: "pointer", borderRadius: 20, padding: "7px 13px", font: "600 12px/1 var(--eos-font-sans)", color: "var(--eos-red-text)" }}>
                    Remove
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
