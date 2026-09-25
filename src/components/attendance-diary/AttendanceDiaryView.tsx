"use client";

// Attendance Diary -- one shared screen used by every role that has it (Admin, Correspondent,
// Principal, Vice Principal, Academic Coordinator, Class Advisor / Faculty). What each role
// can see is decided by the backend from that person's own class mappings; this component
// only renders whatever it is given (e.g. it shows the Employees toggle only when the backend
// says `canViewEmployees`, and the class filter only lists the caller's own classes).

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  diaryEmployeesAction,
  diaryStudentsAction,
} from "@/lib/attendance-diary-actions";
import type {
  DiaryContext,
  DiaryEmployeeRow,
  DiaryPage,
  DiaryStudentRow,
  EmployeeSummary,
  StudentSummary,
} from "@/lib/attendance-diary-api";

type Tab = "students" | "employees";
const PAGE_SIZE = 25;

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  PRESENT: { label: "Present", bg: "var(--eos-green-bg)", fg: "var(--eos-green-text)" },
  ABSENT: { label: "Absent", bg: "var(--eos-red-bg)", fg: "var(--eos-red-text)" },
  LATE: { label: "Late", bg: "#fef3c7", fg: "#92400e" },
  ON_DUTY: { label: "On duty", bg: "var(--eos-tint)", fg: "var(--eos-primary)" },
  ON_LEAVE: { label: "On leave", bg: "#f3e8ff", fg: "#6b21a8" },
  NOT_MARKED: { label: "Not marked", bg: "var(--eos-divider)", fg: "var(--eos-body-muted)" },
};

const BAND_OPTIONS = [
  { value: "", label: "Any attendance %" },
  { value: "LT75", label: "Below 75%" },
  { value: "LT60", label: "Below 60%" },
  { value: "BETWEEN_75_90", label: "75% – 90%" },
  { value: "GTE90", label: "90% and above" },
];

// ------------------------------------------------------------------ helpers
const parseDate = (d: string) => new Date(`${d}T00:00:00Z`);
const toIso = (dt: Date) => dt.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => toIso(new Date(parseDate(d).getTime() + n * 86400000));
const fmtLong = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(parseDate(d));
const fmtTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso)) : null;
const fullName = (f: string, l: string | null) => [f, l].filter(Boolean).join(" ");
const initials = (f: string, l: string | null) => `${f[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
const pctColor = (p: number | null) => (p === null ? "var(--eos-tertiary)" : p < 75 ? "var(--eos-red)" : p < 90 ? "#d97706" : "#16a34a");

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ------------------------------------------------------------------ small UI
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  x: "M18 6 6 18M6 6l12 12",
  chevron: "m6 9 6 6 6-6",
};

function Pill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.NOT_MARKED!;
  return (
    <span style={{ background: s.bg, color: s.fg, font: "600 12px/1 var(--eos-font-sans)", padding: "6px 10px", borderRadius: "var(--eos-radius-pill)", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: "inline-flex", position: "relative" }}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          appearance: "none",
          background: value ? "var(--eos-tint)" : "var(--eos-white)",
          color: value ? "var(--eos-primary)" : "var(--eos-body)",
          border: `1px solid ${value ? "var(--eos-primary)" : "var(--eos-border)"}`,
          borderRadius: "var(--eos-radius-input)",
          padding: "9px 32px 9px 12px",
          font: "500 13px/1.2 var(--eos-font-sans)",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--eos-body-muted)" }}>
        <Icon d={ICONS.chevron} size={14} />
      </span>
    </label>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: `1px solid ${active ? "var(--eos-primary)" : "var(--eos-border)"}`,
        background: active ? "var(--eos-primary)" : "var(--eos-white)",
        color: active ? "#fff" : "var(--eos-body)",
        borderRadius: "var(--eos-radius-pill)",
        padding: "7px 14px",
        font: "600 13px/1 var(--eos-font-sans)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ calendar popover
function CalendarPopover({ value, max, onPick, onClose }: { value: string; max: string; onPick: (d: string) => void; onClose: () => void }) {
  const start = parseDate(value);
  const [view, setView] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const offset = first.getUTCDay();
  const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: dim }, (_, i) => toIso(new Date(Date.UTC(view.y, view.m, i + 1))))];
  const shift = (n: number) => setView((v) => { const d = new Date(Date.UTC(v.y, v.m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const title = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);

  return (
    <div ref={ref} role="dialog" aria-label="Choose a date" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 30, width: 300, background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 14, boxShadow: "0 14px 40px rgba(15,23,42,.16)", padding: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" style={navBtn}><Icon d={ICONS.left} /></button>
        <strong style={{ font: "700 14px/1 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{title}</strong>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" style={navBtn}><Icon d={ICONS.right} /></button>
      </div>
      <div className="grid grid-cols-7" style={{ gap: 2, textAlign: "center" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} style={{ font: "600 11px/2 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>{d}</span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`b${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              disabled={d > max}
              onClick={() => onPick(d)}
              aria-label={fmtLong(d)}
              aria-current={d === value ? "date" : undefined}
              style={{
                height: 34,
                borderRadius: 8,
                border: d === max ? "1px solid var(--eos-primary)" : "1px solid transparent",
                background: d === value ? "var(--eos-primary)" : "transparent",
                color: d === value ? "#fff" : d > max ? "var(--eos-tertiary)" : "var(--eos-ink)",
                font: "500 13px/1 var(--eos-font-sans)",
                cursor: d > max ? "not-allowed" : "pointer",
                opacity: d > max ? 0.45 : 1,
              }}
            >
              {Number(d.slice(8))}
            </button>
          ),
        )}
      </div>
      <button type="button" onClick={() => onPick(max)} style={{ marginTop: 10, width: "100%", border: "1px solid var(--eos-border)", background: "var(--eos-panel)", borderRadius: 8, padding: "8px", font: "600 13px/1 var(--eos-font-sans)", color: "var(--eos-primary)", cursor: "pointer" }}>
        Jump to today
      </button>
    </div>
  );
}
const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: "1px solid var(--eos-border)", background: "var(--eos-white)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--eos-body)" };

// ------------------------------------------------------------------ class picker (grades -> sections)
function ClassPicker({ ctx, gradeIds, sectionIds, onChange }: { ctx: DiaryContext; gradeIds: string[]; sectionIds: string[]; onChange: (g: string[], s: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const count = gradeIds.length + sectionIds.length;
  const label = count === 0 ? "All classes" : `${count} selected`;
  const grades = [...ctx.grades].sort((a, b) => a.levelNo - b.levelNo);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: count ? "var(--eos-tint)" : "var(--eos-white)", color: count ? "var(--eos-primary)" : "var(--eos-body)", border: `1px solid ${count ? "var(--eos-primary)" : "var(--eos-border)"}`, borderRadius: "var(--eos-radius-input)", padding: "9px 12px", font: "500 13px/1.2 var(--eos-font-sans)", cursor: "pointer" }}>
        Class: {label} <Icon d={ICONS.chevron} size={14} />
      </button>
      {open && (
        <div role="dialog" aria-label="Choose classes" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, width: 320, maxHeight: 380, overflow: "auto", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 14, boxShadow: "0 14px 40px rgba(15,23,42,.16)", padding: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <strong style={{ font: "700 13px/1 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Standards & sections</strong>
            {count > 0 && <button type="button" onClick={() => onChange([], [])} style={{ border: 0, background: "none", color: "var(--eos-primary)", font: "600 12px/1 var(--eos-font-sans)", cursor: "pointer" }}>Clear</button>}
          </div>
          {grades.length === 0 && <p style={{ font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>No classes are mapped to your account yet.</p>}
          {grades.map((g) => {
            const secs = ctx.sections.filter((s) => s.gradeId === g.id);
            return (
              <div key={g.id} style={{ padding: "8px 0", borderTop: "1px solid var(--eos-divider)" }}>
                <label className="flex items-center gap-2" style={{ font: "600 13px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)", cursor: "pointer" }}>
                  <input type="checkbox" checked={gradeIds.includes(g.id)} onChange={() => onChange(toggle(gradeIds, g.id), sectionIds)} />
                  Standard {g.name}
                </label>
                <div className="flex flex-wrap gap-2" style={{ marginTop: 6, paddingLeft: 22 }}>
                  {secs.map((s) => (
                    <label key={s.id} className="flex items-center gap-1" style={{ font: "500 12px/1 var(--eos-font-sans)", color: "var(--eos-body)", cursor: "pointer", border: "1px solid var(--eos-border)", borderRadius: 8, padding: "5px 8px", background: sectionIds.includes(s.id) ? "var(--eos-tint)" : "var(--eos-white)" }}>
                      <input type="checkbox" checked={sectionIds.includes(s.id)} onChange={() => onChange(gradeIds, toggle(sectionIds, s.id))} />
                      {g.name}-{s.name}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ main
export function AttendanceDiaryView({
  initialContext,
  studentBase,
  attendanceProfileBase,
  employeeBase,
  title = "Attendance Diary",
}: {
  initialContext: DiaryContext;
  /** Where clicking a student goes: `${studentBase}/${studentId}` (that role's own existing
   * student profile). A plain string, not a function, so a Server Component can pass it. */
  studentBase?: string;
  /** Limited attendance-only profile, used by every role that is not leadership. */
  attendanceProfileBase?: string;
  employeeBase?: string;
  title?: string;
}) {
  const router = useRouter();
  const ctx = initialContext;
  const canEmployees = ctx.access.canViewEmployees;

  const [tab, setTab] = useState<Tab>("students");
  const [date, setDate] = useState(ctx.date);
  const [calOpen, setCalOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);
  const [pageState, setPageState] = useState<{ key: string; page: number }>({ key: "", page: 1 });

  // student filters
  const [gradeIds, setGradeIds] = useState<string[]>([]);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [dayStatus, setDayStatus] = useState("");
  const [percentBand, setPercentBand] = useState("");
  const [residence, setResidence] = useState("");
  const [transport, setTransport] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState("CLASS");
  // employee filters
  const [group, setGroup] = useState("");
  const [department, setDepartment] = useState("");
  const [eSort, setESort] = useState("NAME");

  const [students, setStudents] = useState<DiaryPage<DiaryStudentRow, StudentSummary> | null>(null);
  const [employees, setEmployees] = useState<DiaryPage<DiaryEmployeeRow, EmployeeSummary> | null>(null);
  const [outcome, setOutcome] = useState<{ key: string; error: string | null }>({ key: "", error: null });
  const [nonce, setNonce] = useState(0);

  // Everything that defines "which page of which list": when it changes we are on page 1 again.
  const filterKey = JSON.stringify([tab, date, dq, gradeIds, sectionIds, dayStatus, percentBand, residence, transport, gender, sort, group, department, eSort]);
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (fn: (p: number) => number) => setPageState({ key: filterKey, page: fn(page) });

  const params = useMemo(
    () =>
      tab === "students"
        ? { date, q: dq, gradeIds, sectionIds, dayStatus: dayStatus || undefined, percentBand: percentBand || undefined, residence: residence || undefined, transport: transport || undefined, gender: gender || undefined, sort: sort || undefined, page, pageSize: PAGE_SIZE }
        : { date, q: dq, group: group || undefined, dayStatus: dayStatus || undefined, percentBand: percentBand || undefined, departmentId: department || undefined, sort: eSort, page, pageSize: PAGE_SIZE },
    [tab, date, dq, gradeIds, sectionIds, dayStatus, percentBand, residence, transport, gender, sort, group, department, eSort, page],
  );
  const requestKey = `${tab}|${nonce}|${JSON.stringify(params)}`;
  const loading = outcome.key !== requestKey;
  const error = outcome.key === requestKey ? outcome.error : null;

  useEffect(() => {
    let cancelled = false; // a newer request supersedes this one
    const run = tab === "students" ? diaryStudentsAction(params as Parameters<typeof diaryStudentsAction>[0]) : diaryEmployeesAction(params as Parameters<typeof diaryEmployeesAction>[0]);
    void run.then((res) => {
      if (cancelled) return;
      if (!res.ok) { setOutcome({ key: requestKey, error: res.error }); return; }
      if (tab === "students") setStudents(res.data as DiaryPage<DiaryStudentRow, StudentSummary>);
      else setEmployees(res.data as DiaryPage<DiaryEmployeeRow, EmployeeSummary>);
      setOutcome({ key: requestKey, error: null });
    });
    return () => { cancelled = true; };
  }, [tab, params, requestKey]);

  const changeTab = (t: Tab) => {
    // status vocabulary and sort keys differ between the two lists, so never carry them over
    setTab(t);
    setDayStatus("");
    setSort(t === "students" ? "CLASS" : "NAME");
  };

  const data = tab === "students" ? students : employees;
  const summary = data?.summary as (StudentSummary & EmployeeSummary) | undefined;
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilters = useMemo(
    () => (tab === "students" ? [gradeIds.length + sectionIds.length > 0, !!dayStatus, !!percentBand, !!residence, !!transport, !!gender] : [!!group, !!dayStatus, !!percentBand, !!department]).filter(Boolean).length,
    [tab, gradeIds, sectionIds, dayStatus, percentBand, residence, transport, gender, group, department],
  );
  const clearAll = () => { setGradeIds([]); setSectionIds([]); setDayStatus(""); setPercentBand(""); setResidence(""); setTransport(""); setGender(""); setGroup(""); setDepartment(""); setQ(""); };

  const dayStatusOptions = tab === "students"
    ? [{ value: "", label: "Any status" }, { value: "PRESENT", label: "Present" }, { value: "ABSENT", label: "Absent" }, { value: "LATE", label: "Late" }, { value: "NOT_MARKED", label: "Not marked" }]
    : [{ value: "", label: "Any status" }, { value: "PRESENT", label: "Present" }, { value: "ABSENT", label: "Absent" }, { value: "ON_DUTY", label: "On duty" }, { value: "ON_LEAVE", label: "On leave" }, { value: "NOT_MARKED", label: "Not marked" }];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 style={{ margin: 0, font: "700 34px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>{title}</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
            {ctx.access.roleLabel} view · {ctx.access.kind === "FULL" ? "whole school" : `${ctx.access.classCount} class${ctx.access.classCount === 1 ? "" : "es"} in your scope`} · {ctx.academicYear?.name ?? ""}
          </p>
        </div>

        {canEmployees && (
          <div role="tablist" aria-label="Diary type" style={{ display: "inline-flex", background: "var(--eos-divider)", borderRadius: 12, padding: 4 }}>
            {(["students", "employees"] as Tab[]).map((t) => (
              <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => changeTab(t)}
                style={{ border: 0, cursor: "pointer", borderRadius: 9, padding: "9px 22px", font: "700 14px/1 var(--eos-font-sans)", background: tab === t ? "var(--eos-white)" : "transparent", color: tab === t ? "var(--eos-primary)" : "var(--eos-body-muted)", boxShadow: tab === t ? "0 1px 3px rgba(15,23,42,.12)" : "none" }}>
                {t === "students" ? "Students" : "Employees"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* search + date */}
      <div className="flex flex-wrap items-center gap-3" style={{ marginTop: 22 }}>
        <label style={{ position: "relative", flex: "1 1 280px", minWidth: 220 }}>
          <span className="sr-only">Search</span>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--eos-tertiary)" }}><Icon d={ICONS.search} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} placeholder={tab === "students" ? "Search by student name or admission no." : "Search by employee name or employee no."}
            style={{ width: "100%", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-input)", padding: "11px 36px 11px 38px", font: "400 14px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }} />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", cursor: "pointer", color: "var(--eos-tertiary)" }}><Icon d={ICONS.x} size={16} /></button>}
        </label>

        <div className="flex items-center gap-2" style={{ position: "relative" }}>
          <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day" style={navBtn}><Icon d={ICONS.left} /></button>
          <button type="button" onClick={() => setCalOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={calOpen}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-input)", padding: "9px 14px", font: "600 14px/1 var(--eos-font-sans)", color: "var(--eos-ink)", cursor: "pointer" }}>
            <Icon d={ICONS.calendar} /> {fmtLong(date)} {date === ctx.today && <span style={{ color: "var(--eos-primary)", font: "700 11px/1 var(--eos-font-sans)" }}>TODAY</span>}
          </button>
          <button type="button" onClick={() => setDate(addDays(date, 1))} disabled={date >= ctx.today} aria-label="Next day" style={{ ...navBtn, opacity: date >= ctx.today ? 0.4 : 1, cursor: date >= ctx.today ? "not-allowed" : "pointer" }}><Icon d={ICONS.right} /></button>
          {calOpen && <CalendarPopover value={date} max={ctx.today} onPick={(d) => { setDate(d); setCalOpen(false); }} onClose={() => setCalOpen(false)} />}
        </div>
      </div>

      {/* quick chips */}
      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 14 }} role="group" aria-label="Quick filters">
        <Chip active={activeFilters === 0 && !q} onClick={clearAll}>All</Chip>
        {tab === "students" ? (
          <>
            <Chip active={percentBand === "LT75"} onClick={() => setPercentBand(percentBand === "LT75" ? "" : "LT75")}>Attendance &lt; 75%</Chip>
            <Chip active={dayStatus === "ABSENT"} onClick={() => setDayStatus(dayStatus === "ABSENT" ? "" : "ABSENT")}>Absent</Chip>
            <Chip active={dayStatus === "LATE"} onClick={() => setDayStatus(dayStatus === "LATE" ? "" : "LATE")}>Late</Chip>
            <Chip active={dayStatus === "NOT_MARKED"} onClick={() => setDayStatus(dayStatus === "NOT_MARKED" ? "" : "NOT_MARKED")}>Not marked</Chip>
            <Chip active={residence === "HOSTEL"} onClick={() => setResidence(residence === "HOSTEL" ? "" : "HOSTEL")}>Hostellers</Chip>
          </>
        ) : (
          <>
            <Chip active={dayStatus === "ABSENT"} onClick={() => setDayStatus(dayStatus === "ABSENT" ? "" : "ABSENT")}>Absent</Chip>
            <Chip active={dayStatus === "ON_LEAVE"} onClick={() => setDayStatus(dayStatus === "ON_LEAVE" ? "" : "ON_LEAVE")}>On leave</Chip>
            <Chip active={dayStatus === "NOT_MARKED"} onClick={() => setDayStatus(dayStatus === "NOT_MARKED" ? "" : "NOT_MARKED")}>Not marked</Chip>
            <Chip active={percentBand === "LT75"} onClick={() => setPercentBand(percentBand === "LT75" ? "" : "LT75")}>Attendance &lt; 75%</Chip>
          </>
        )}
      </div>

      {/* detailed filters */}
      <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 12 }} role="group" aria-label="Filters">
        {tab === "students" ? (
          <>
            <ClassPicker ctx={ctx} gradeIds={gradeIds} sectionIds={sectionIds} onChange={(g, s) => { setGradeIds(g); setSectionIds(s); }} />
            <Select label="Day status" value={dayStatus} onChange={setDayStatus} options={dayStatusOptions} />
            <Select label="Attendance percentage" value={percentBand} onChange={setPercentBand} options={BAND_OPTIONS} />
            <Select label="Residence" value={residence} onChange={setResidence} options={[{ value: "", label: "Hostel & day" }, { value: "HOSTEL", label: "Hostellers" }, { value: "DAY_SCHOLAR", label: "Day scholars" }]} />
            <Select label="Transport" value={transport} onChange={setTransport} options={[{ value: "", label: "Any transport" }, { value: "BUS", label: "School bus" }, { value: "NO_BUS", label: "No bus" }]} />
            <Select label="Gender" value={gender} onChange={setGender} options={[{ value: "", label: "Any gender" }, { value: "MALE", label: "Boys" }, { value: "FEMALE", label: "Girls" }]} />
            <Select label="Sort" value={sort} onChange={setSort} options={[{ value: "CLASS", label: "Sort: Class & roll" }, { value: "NAME", label: "Sort: Name" }, { value: "PERCENT_ASC", label: "Sort: Lowest attendance" }, { value: "PERCENT_DESC", label: "Sort: Highest attendance" }]} />
          </>
        ) : (
          <>
            <Select label="Employee group" value={group} onChange={setGroup} options={[{ value: "", label: "All employees" }, { value: "PRINCIPAL", label: "Principal" }, { value: "VICE_PRINCIPAL", label: "Vice principal" }, { value: "FACULTY", label: "Faculty" }]} />
            <Select label="Day status" value={dayStatus} onChange={setDayStatus} options={dayStatusOptions} />
            <Select label="Attendance percentage" value={percentBand} onChange={setPercentBand} options={BAND_OPTIONS} />
            {ctx.departments.length > 0 && (
              <Select label="Department" value={department} onChange={setDepartment} options={[{ value: "", label: "All departments" }, ...ctx.departments.map((d) => ({ value: d.id, label: d.name }))]} />
            )}
            <Select label="Sort" value={eSort} onChange={setESort} options={[{ value: "NAME", label: "Sort: Name" }, { value: "PERCENT_ASC", label: "Sort: Lowest attendance" }, { value: "PERCENT_DESC", label: "Sort: Highest attendance" }]} />
          </>
        )}
        {activeFilters > 0 && (
          <button type="button" onClick={clearAll} style={{ border: 0, background: "none", color: "var(--eos-primary)", font: "600 13px/1 var(--eos-font-sans)", cursor: "pointer", padding: "8px 4px" }}>
            Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" style={{ marginTop: 18 }} aria-live="polite">
        {(tab === "students"
          ? [
              { k: "", label: "Students", value: summary?.total, color: "var(--eos-ink)" },
              { k: "PRESENT", label: "Present", value: summary?.present, color: "var(--eos-green-text)" },
              { k: "ABSENT", label: "Absent", value: summary?.absent, color: "var(--eos-red-text)" },
              { k: "LATE", label: "Late", value: summary?.late, color: "#92400e" },
              { k: "NOT_MARKED", label: "Not marked", value: summary?.notMarked, color: "var(--eos-body-muted)" },
              { k: "AVG", label: "Avg. attendance", value: summary?.averagePercentage != null ? `${summary.averagePercentage}%` : "—", color: "var(--eos-primary)" },
            ]
          : [
              { k: "", label: "Employees", value: summary?.total, color: "var(--eos-ink)" },
              { k: "PRESENT", label: "Present", value: summary?.present, color: "var(--eos-green-text)" },
              { k: "ABSENT", label: "Absent", value: summary?.absent, color: "var(--eos-red-text)" },
              { k: "ON_DUTY", label: "On duty", value: summary?.onDuty, color: "var(--eos-primary)" },
              { k: "ON_LEAVE", label: "On leave", value: summary?.onLeave, color: "#6b21a8" },
              { k: "AVG", label: "Avg. attendance", value: summary?.averagePercentage != null ? `${summary.averagePercentage}%` : "—", color: "var(--eos-primary)" },
            ]
        ).map((t) => {
          const clickable = t.k && t.k !== "AVG";
          const Root = clickable ? "button" : "div";
          return (
            <Root key={t.label} type={clickable ? "button" : undefined} onClick={clickable ? () => setDayStatus(dayStatus === t.k ? "" : t.k) : undefined}
              style={{ textAlign: "left", background: "var(--eos-white)", border: `1px solid ${dayStatus === t.k && clickable ? "var(--eos-primary)" : "var(--eos-border)"}`, borderRadius: "var(--eos-radius-card)", padding: "14px 16px", cursor: clickable ? "pointer" : "default" }}>
              <span style={{ display: "block", font: "600 12px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{t.label}</span>
              <span style={{ display: "block", marginTop: 8, font: "700 28px/1 var(--eos-font-sans)", color: t.color }}>{loading && !data ? "…" : (t.value ?? 0)}</span>
            </Root>
          );
        })}
      </div>

      {/* list */}
      <div style={{ marginTop: 18, background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", overflow: "hidden", opacity: loading && data ? 0.6 : 1, transition: "opacity .15s" }}>
        <div className="hidden md:grid" style={{ gridTemplateColumns: "minmax(0,2.4fr) minmax(0,1.2fr) minmax(0,1.6fr) minmax(0,1.3fr)", padding: "12px 20px", background: "var(--eos-panel)", borderBottom: "1px solid var(--eos-border)", font: "700 11px/1 var(--eos-font-sans)", letterSpacing: ".06em", color: "var(--eos-body-muted)", textTransform: "uppercase" }}>
          <span>{tab === "students" ? "Student" : "Employee"}</span>
          <span>{tab === "students" ? "Class" : "Designation"}</span>
          <span>Attendance (year to date)</span>
          <span>{fmtLong(date)}</span>
        </div>

        {error && (
          <div role="alert" style={{ padding: 28, textAlign: "center", color: "var(--eos-red-text)", font: "500 14px/1.5 var(--eos-font-sans)" }}>
            {error} <button type="button" onClick={() => setNonce((n) => n + 1)} style={{ marginLeft: 8, border: 0, background: "none", color: "var(--eos-primary)", font: "700 14px/1 var(--eos-font-sans)", cursor: "pointer" }}>Retry</button>
          </div>
        )}
        {!error && loading && !data && <div style={{ padding: 36, textAlign: "center", color: "var(--eos-body-muted)", font: "500 14px/1 var(--eos-font-sans)" }}>Loading attendance…</div>}
        {!error && data && total === 0 && !loading && (
          <div style={{ padding: 36, textAlign: "center", color: "var(--eos-body-muted)", font: "500 14px/1.5 var(--eos-font-sans)" }}>
            {ctx.access.kind === "SCOPED" && ctx.access.classCount === 0 ? "No classes are mapped to your account yet." : `No ${tab} match these filters.`}
            {activeFilters > 0 && <button type="button" onClick={clearAll} style={{ marginLeft: 8, border: 0, background: "none", color: "var(--eos-primary)", font: "700 14px/1 var(--eos-font-sans)", cursor: "pointer" }}>Clear filters</button>}
          </div>
        )}

        <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {tab === "students" && students?.items.map((s) => {
            const profileBase = ctx.access.profileMode === "FULL" ? studentBase : attendanceProfileBase;
            const href = profileBase ? `${profileBase}/${s.studentId}` : null;
            return (
              <li key={s.studentId} style={{ borderBottom: "1px solid var(--eos-divider)" }}>
                <Row onClick={href ? () => router.push(href) : undefined} label={`Open ${fullName(s.firstName, s.lastName)}'s profile`}>
                  <Person initials={initials(s.firstName, s.lastName)} name={fullName(s.firstName, s.lastName)} sub={`Adm. ${s.admissionNo}${s.rollNo ? ` · Roll ${s.rollNo}` : ""}`} />
                  <span style={cellText}>{s.gradeName}-{s.sectionName}{s.isHosteller ? " · Hostel" : ""}</span>
                  <Percent value={s.percentage} present={s.presentDays} total={s.totalDays} />
                  <span className="flex flex-col items-start gap-1">
                    <Pill status={s.dayStatus} />
                    {s.dayStatus === "ABSENT" && s.reason && <span style={smallText}>{s.reason}</span>}
                    {s.dayStatus === "LATE" && s.markedAt && <span style={smallText}>Marked {fmtTime(s.markedAt)}</span>}
                  </span>
                </Row>
              </li>
            );
          })}
          {tab === "employees" && employees?.items.map((e) => {
            const href = employeeBase ? `${employeeBase}/${e.staffId}` : null;
            return (
              <li key={e.staffId} style={{ borderBottom: "1px solid var(--eos-divider)" }}>
                <Row onClick={href ? () => router.push(href) : undefined} label={`Open ${fullName(e.firstName, e.lastName)}'s profile`}>
                  <Person initials={initials(e.firstName, e.lastName)} name={fullName(e.firstName, e.lastName)} sub={`Emp. ${e.employeeNo}`} />
                  <span style={cellText}>{e.group === "PRINCIPAL" ? "Principal" : e.group === "VICE_PRINCIPAL" ? "Vice Principal" : e.designation ?? "Faculty"}{e.departmentName ? ` · ${e.departmentName}` : ""}</span>
                  <Percent value={e.percentage} present={e.presentDays} total={e.totalDays} />
                  <span className="flex flex-col items-start gap-1">
                    <Pill status={e.dayStatus} />
                    {e.dayStatus === "PRESENT" && e.eventAt && <span style={smallText}>In {fmtTime(e.eventAt)}</span>}
                    {(e.dayStatus === "ABSENT" || e.dayStatus === "ON_DUTY") && e.reason && <span style={smallText}>{e.reason}</span>}
                  </span>
                </Row>
              </li>
            );
          })}
        </ul>

        {data && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2" style={{ padding: "12px 20px", background: "var(--eos-panel)", font: "500 13px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <span className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ ...pagerBtn, opacity: page <= 1 ? 0.4 : 1 }}>Previous</button>
              <span>Page {page} of {lastPage}</span>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} style={{ ...pagerBtn, opacity: page >= lastPage ? 0.4 : 1 }}>Next</button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const cellText: React.CSSProperties = { font: "500 14px/1.3 var(--eos-font-sans)", color: "var(--eos-body)" };
const smallText: React.CSSProperties = { font: "400 12px/1.3 var(--eos-font-sans)", color: "var(--eos-body-muted)" };
const pagerBtn: React.CSSProperties = { border: "1px solid var(--eos-border)", background: "var(--eos-white)", borderRadius: 8, padding: "8px 14px", font: "600 13px/1 var(--eos-font-sans)", color: "var(--eos-ink)", cursor: "pointer" };

function Row({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  const style: React.CSSProperties = { display: "grid", gap: 12, alignItems: "center", padding: "14px 20px", width: "100%", textAlign: "left", background: "transparent", border: 0, color: "inherit" };
  const cls = "grid grid-cols-1 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1.3fr)]";
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} className={`${cls} hover:bg-[var(--eos-panel)]`} style={{ ...style, cursor: "pointer" }}>{children}</button>
  ) : (
    <div className={cls} style={style}>{children}</div>
  );
}

function Person({ initials: ini, name, sub }: { initials: string; name: string; sub: string }) {
  return (
    <span className="flex items-center gap-3" style={{ minWidth: 0 }}>
      <span aria-hidden="true" style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", background: "var(--eos-tint)", color: "var(--eos-primary)", display: "grid", placeItems: "center", font: "700 13px/1 var(--eos-font-sans)" }}>{ini}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", font: "600 15px/1.25 var(--eos-font-sans)", color: "var(--eos-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={smallText}>{sub}</span>
      </span>
    </span>
  );
}

function Percent({ value, present, total }: { value: number | null; present: number; total: number }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span className="flex items-center gap-2">
        <strong style={{ font: "700 15px/1 var(--eos-font-sans)", color: pctColor(value), minWidth: 46 }}>{value === null ? "—" : `${value}%`}</strong>
        <span style={{ flex: 1, height: 6, borderRadius: 4, background: "var(--eos-border)", overflow: "hidden", maxWidth: 140 }}>
          <span style={{ display: "block", height: "100%", width: `${value ?? 0}%`, background: pctColor(value) }} />
        </span>
      </span>
      <span style={smallText}>{total > 0 ? `${present} of ${total} days` : "No records yet"}</span>
    </span>
  );
}
