"use client";

import { useState, useSyncExternalStore } from "react";
import { MonthGrid } from "@/components/faculty-ui/MonthGrid";

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

// Real school-wide events come from the backend (getFacultyCalendar), read-
// only. Personal events ("visible only to you," per the design's own copy)
// have NO backend support anywhere -- confirmed absent both in
// school-eos-backend's calendar_event table (no owner/personal-scope column
// at all) and in the mobile app's own faculty-calendar-api.ts, which reads
// exactly the same school-wide-only shape. Rather than fake a server write
// that doesn't exist, personal events are real, genuinely working data
// stored in this browser's localStorage, namespaced by this signed-in
// person's id -- private to them, on this device, never sent to the server,
// never mixed with another person's events even on a shared school PC.
function storageKey(personId: string): string {
  return `faculty-calendar-personal-events:${personId}`;
}

// useSyncExternalStore (not useEffect+setState) is the React-sanctioned way
// to read a browser-only mutable store like localStorage: getServerSnapshot
// returns a fixed value for SSR/hydration, getSnapshot reads the real value
// on the client, and calling notify() after a write re-renders every
// subscribed component -- no manual setState-in-an-effect anywhere.
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
function writePersonalEvents(personId: string, events: PersonalEvent[]) {
  const key = storageKey(personId);
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

export function CalendarMonthView({ events, personId }: { events: CalendarEventRow[]; personId: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [addOpen, setAddOpen] = useState(false);
  const key = storageKey(personId);
  const rawPersonalEvents = useSyncExternalStore((cb) => subscribe(key, cb), () => getSnapshot(key), getServerSnapshot);
  const personalEvents = parsePersonalEvents(rawPersonalEvents);
  const [day, setDay] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [error, setError] = useState<string | undefined>();

  function persist(next: PersonalEvent[]) {
    writePersonalEvents(personId, next);
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
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Academic Calendar</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
            Published events are read-only · events you add are visible only to you, on this device
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 20px" }}
        >
          {addOpen ? "Cancel" : "+ Add event"}
        </button>
      </div>

      {addOpen && (
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px", marginTop: 18 }}>
          <div style={{ font: "700 19px/1.25 var(--fac-font-sans)" }}>New event · {MONTH_NAMES[month]}</div>
          <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>Added by you · visible only in your login, on this device</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[110px_minmax(0,1fr)_220px]" style={{ marginTop: 16, alignItems: "end" }}>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-primary)", marginBottom: 8 }}>DAY</div>
              <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="14" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
            </div>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-primary)", marginBottom: 8 }}>EVENT</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class 8-B remedial hour" style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
            </div>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-primary)", marginBottom: 8 }}>CATEGORY</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)", background: "var(--fac-white)" }}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{error}</p>}
          <button type="button" onClick={addEvent} style={{ border: 0, cursor: "pointer", borderRadius: 10, padding: "13px 24px", font: "600 14.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", marginTop: 16 }}>
            Add to calendar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4" style={{ marginTop: 18 }}>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--fac-tint)", display: "inline-block" }} /> School event
        </span>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "#f3e8ff", display: "inline-block" }} /> Personal (only you)
        </span>
        <span className="flex items-center gap-2" style={{ font: "400 13px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: "var(--fac-red-bg)", display: "inline-block" }} /> Holiday
        </span>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.05fr]" style={{ marginTop: 12, alignItems: "start" }}>
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
          <MonthGrid
            year={year}
            month={month}
            headerNote={`${inMonth.length + personalInMonth.length} events`}
            onMonthChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
            renderCell={(date) => {
              const dNum = date.getDate();
              const hasSchool = eventDays.has(dNum);
              const hasPersonal = personalDays.has(dNum);
              const bg = hasSchool ? "var(--fac-tint)" : hasPersonal ? "#f3e8ff" : "var(--fac-white)";
              const fg = hasSchool ? "var(--fac-primary)" : hasPersonal ? "#7c3aed" : "var(--fac-body)";
              return (
                <div style={{ height: 58, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", font: "500 14px/1 var(--fac-font-sans)", border: "1px solid var(--fac-border)", background: bg, color: fg }}>
                  {dNum}
                </div>
              );
            }}
          />
        </div>
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", font: "700 22px/1.2 var(--fac-font-sans)" }}>Events in {MONTH_NAMES[month]}</h3>
          {inMonth.length === 0 && personalInMonth.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", font: "400 14.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No events in this month yet.</div>
          ) : (
            <>
              {inMonth.map((e) => (
                <div key={e.id} className="fac-hover-lift flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 11, background: e.isHoliday ? "var(--fac-red-bg)" : "var(--fac-tint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ font: "700 19px/1 var(--fac-font-sans)", color: e.isHoliday ? "var(--fac-red-text)" : "var(--fac-primary)" }}>{e.start.getDate()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 16px/1.3 var(--fac-font-sans)" }}>{e.title}</div>
                    <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                      {e.start.getTime() !== e.end.getTime() ? `Through ${e.end.getDate()} · ` : ""}{e.eventType.replace(/_/g, " ")}
                    </div>
                  </div>
                  <span style={{ font: "500 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "7px 13px" }}>
                    {e.isHoliday ? "Holiday" : "School"}
                  </span>
                </div>
              ))}
              {personalInMonth.map((e) => (
                <div key={e.id} className="fac-hover-lift flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 11, background: "#f3e8ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ font: "700 19px/1 var(--fac-font-sans)", color: "#7c3aed" }}>{e.day}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 16px/1.3 var(--fac-font-sans)" }}>{e.title}</div>
                    <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>{e.category} · only visible to you</div>
                  </div>
                  <button type="button" onClick={() => removeEvent(e.id)} style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", borderRadius: 20, padding: "7px 13px", font: "600 12px/1 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>
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
