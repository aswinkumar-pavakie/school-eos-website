"use client";

// One permanent login per class section. The email never changes; the admin
// changes who holds the class (which rotates the password and signs the
// previous teacher out) and can reset the password. Students are never mapped
// by hand -- they come from each year's enrolments.
// Design: school-eos-website/rnd-class-teacher-logins-admin.md.

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  changeClassTeacherAction,
  classLoginHistoryAction,
  classLoginStudentsAction,
  revealClassLoginPasswordAction,
  rolloverApplyAction,
  revokeClassLoginLinksAction,
  rolloverPreviewAction,
  setClassLoginPasswordAction,
  vacateClassLoginAction,
} from "@/app/(dashboard)/admin/academics/class-login-actions";
import {
  SEAT_STATUS_META,
  type ClassLoginHistoryItem,
  type ClassLoginList,
  type ClassLoginSeat,
  type ClassLoginStudent,
  type RolloverPreview,
  type RolloverResult,
} from "@/lib/class-login-types";
import { formatDate } from "@/lib/format";
import { StaffPersonPicker } from "./StaffPersonPicker";
import { PanelHeader } from "./shared";

type Mode = "change" | "password" | "vacate" | "students" | "history" | "phones";

const TONE: Record<"ok" | "warn" | "bad" | "muted", string> = {
  ok: "bg-success-bg text-success-text",
  warn: "border border-border bg-field text-text",
  bad: "bg-critical-bg text-critical-text",
  muted: "bg-field text-text-muted",
};

const btn = "rounded-[11px] px-3.5 py-2 text-sm font-bold disabled:opacity-60";
const btnPrimary = `${btn} bg-primary text-white`;
const btnGhost = `${btn} border border-border text-text hover:bg-surface`;
const linkBtn = "text-[13px] font-semibold text-primary disabled:opacity-50";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ClassTeacherLoginsPanel({ data }: { data: ClassLoginList | null }) {
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState<{ id: string; mode: Mode } | null>(null);
  const [showRollover, setShowRollover] = useState(false);

  const grades = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of data?.seats ?? []) if (!seen.has(s.gradeId)) seen.set(s.gradeId, s.gradeName);
    return [...seen.entries()];
  }, [data]);

  if (!data) {
    return (
      <p className="text-sm text-text-muted">
        Couldn&apos;t load the class logins. Set a current academic year first (Academic years tab), then refresh.
      </p>
    );
  }

  const { summary } = data;
  const seats = data.seats.filter(
    (s) => (!gradeFilter || s.gradeId === gradeFilter) && (!statusFilter || s.status === statusFilter),
  );

  return (
    <div>
      <PanelHeader
        title="Class teacher logins"
        subtitle={`Each class has one permanent login. Change who holds it and the password is renewed; the students follow the class automatically. Year ${data.academicYear.name} · ${summary.total} logins`}
      />

      <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
        <Chip label="Active" value={summary.active} tone="ok" />
        <Chip label="Vacant" value={summary.vacant} tone="warn" />
        <Chip label="Needs rollover" value={summary.needsRollover} tone="bad" />
        <Chip label="Teacher inactive" value={summary.holderInactive} tone="bad" />
        <Chip label="No section this year" value={summary.noSectionThisYear} tone="muted" />
      </div>

      {(summary.needsRollover > 0 || data.sectionsWithoutLogin.length > 0) && (
        <div className="mt-4 rounded-[11px] border border-border bg-field p-3.5 text-sm text-text">
          {summary.needsRollover > 0 && (
            <p>
              <strong>{summary.needsRollover}</strong> login(s) still point at an earlier year, so they show no students.{" "}
              <button type="button" className={linkBtn} onClick={() => setShowRollover(true)}>
                Roll logins into {data.academicYear.name}
              </button>
            </p>
          )}
          {data.sectionsWithoutLogin.length > 0 && (
            <p className={summary.needsRollover > 0 ? "mt-1.5" : ""}>
              {data.sectionsWithoutLogin.length} section(s) in {data.academicYear.name} have no class login:{" "}
              <span className="text-text-muted">
                {data.sectionsWithoutLogin.map((s) => `${s.gradeName}-${s.sectionName}`).join(", ")}
              </span>
            </p>
          )}
        </div>
      )}

      {showRollover && <RolloverWizard year={data.academicYear} onClose={() => setShowRollover(false)} />}

      <div className="mb-3 mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Standard</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">All</option>
            {grades.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">All</option>
            {Object.entries(SEAT_STATUS_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-[13px] text-text-muted">
          {seats.length} of {summary.total} shown
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Class</th>
              <th className="py-2.5 pr-3">Login</th>
              <th className="py-2.5 pr-3">Class teacher</th>
              <th className="py-2.5 pr-3">Students</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {seats.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text-muted">
                  No class logins match this filter.
                </td>
              </tr>
            )}
            {seats.map((seat) => (
              <SeatRows
                key={seat.loginPersonId}
                seat={seat}
                yearId={data.academicYear.id}
                mode={open?.id === seat.loginPersonId ? open.mode : null}
                setMode={(mode) => setOpen(mode ? { id: seat.loginPersonId, mode } : null)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE }) {
  return (
    <span className={`rounded-full px-3 py-1 font-semibold ${TONE[tone]}`}>
      {label} · {value}
    </span>
  );
}

function SeatRows({
  seat,
  yearId,
  mode,
  setMode,
}: {
  seat: ClassLoginSeat;
  yearId: string;
  mode: Mode | null;
  setMode: (m: Mode | null) => void;
}) {
  const meta = SEAT_STATUS_META[seat.status];
  const [copied, setCopied] = useState(false);
  const canAct = seat.targetSectionId !== null;

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">
          {seat.gradeName}-{seat.sectionName}
        </td>
        <td className="py-3 pr-3">
          <button
            type="button"
            title="Copy email"
            onClick={async () => {
              if (await copy(seat.email)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }
            }}
            className="text-left font-mono text-[13px] text-text hover:text-primary"
          >
            {seat.email} <span className="text-[11px] text-text-muted">{copied ? "copied" : "copy"}</span>
          </button>
          <PasswordCell loginPersonId={seat.loginPersonId} hasStored={seat.hasStoredPassword} />
        </td>
        <td className="py-3 pr-3">
          {seat.holderName ? (
            <>
              <span className="text-text">{seat.holderName}</span>
              <span className="block text-[12px] text-text-muted">
                {seat.holderEmployeeNo}
                {seat.holderSince ? ` · since ${formatDate(seat.holderSince)}` : ""}
              </span>
            </>
          ) : (
            <span className="text-text-muted">Not assigned</span>
          )}
          {seat.linkedPhones > 0 && (
            <span className="block text-[12px] text-text-muted">
              {seat.linkedPhones} linked phone{seat.linkedPhones === 1 ? "" : "s"}
            </span>
          )}
        </td>
        <td className="py-3 pr-3 tabular-nums text-text">{seat.studentCount}</td>
        <td className="py-3 pr-3">
          <span
            title={meta.hint}
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE[meta.tone]}`}
          >
            {meta.label}
          </span>
        </td>
        <td className="py-3 text-right">
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            <button type="button" className={linkBtn} disabled={!canAct} onClick={() => setMode("change")}>
              {seat.holderPersonId ? "Change teacher" : "Assign teacher"}
            </button>
            <button type="button" className={linkBtn} onClick={() => setMode("password")}>
              Password
            </button>
            {seat.holderPersonId && (
              <button type="button" className={linkBtn} onClick={() => setMode("vacate")}>
                Vacate
              </button>
            )}
            {seat.linkedPhones > 0 && (
              <button type="button" className={linkBtn} onClick={() => setMode("phones")}>
                Phones ({seat.linkedPhones})
              </button>
            )}
            <button type="button" className={linkBtn} onClick={() => setMode("students")}>
              Students
            </button>
            <button type="button" className={linkBtn} onClick={() => setMode("history")}>
              History
            </button>
          </div>
        </td>
      </tr>
      {mode && (
        <tr>
          <td colSpan={6} className="pb-3">
            <div className="rounded-[11px] bg-field p-3.5">
              {mode === "change" && <ChangeTeacher seat={seat} onDone={() => setMode(null)} />}
              {mode === "password" && <ResetPassword seat={seat} onDone={() => setMode(null)} />}
              {mode === "vacate" && <Vacate seat={seat} onDone={() => setMode(null)} />}
              {mode === "phones" && <RevokePhones seat={seat} onDone={() => setMode(null)} />}
              {mode === "students" && <Students seat={seat} yearId={yearId} onDone={() => setMode(null)} />}
              {mode === "history" && <History seat={seat} onDone={() => setMode(null)} />}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Masked by default. Revealing is an audited server call and the value clears itself after 30 s. */
function PasswordCell({ loginPersonId, hasStored }: { loginPersonId: string; hasStored: boolean }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!hasStored) return <span className="block text-[12px] text-text-muted">Password not stored — reset it to set one.</span>;

  if (value === null) {
    return (
      <span className="flex items-center gap-2 text-[12px] text-text-muted">
        <span aria-label="Password hidden">Password ••••••••</span>
        <button
          type="button"
          className={linkBtn}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await revealClassLoginPasswordAction(loginPersonId);
              if (r.error) return setError(r.error);
              setError(null);
              setValue(r.password ?? null);
              setTimeout(() => setValue(null), 30_000);
            })
          }
        >
          {pending ? "…" : "Reveal"}
        </button>
        {error && <span className="text-critical-text">{error}</span>}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[12px]">
      <span className="font-mono text-[13px] text-text">{value}</span>
      <button type="button" className={linkBtn} onClick={() => copy(value)}>
        Copy
      </button>
      <button type="button" className={linkBtn} onClick={() => setValue(null)}>
        Hide
      </button>
    </span>
  );
}

function Secret({ email, password, note }: { email: string; password: string; note: string }) {
  return (
    <div className="rounded-[11px] border border-border bg-surface p-3.5">
      <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-text-muted">{note}</p>
      <p className="mt-2 font-mono text-[13px] text-text">Email: {email}</p>
      <p className="font-mono text-[13px] text-text">Password: {password}</p>
      <button type="button" className={`${linkBtn} mt-2`} onClick={() => copy(`Email: ${email}\nPassword: ${password}`)}>
        Copy both
      </button>
    </div>
  );
}

function Err({ text }: { text: string | null }) {
  return text ? <p className="mb-3 rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{text}</p> : null;
}

function ChangeTeacher({ seat, onDone }: { seat: ClassLoginSeat; onDone: () => void }) {
  const [personId, setPersonId] = useState("");
  const [rotate, setRotate] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null | undefined>(undefined);
  const [pending, start] = useTransition();

  if (issued !== undefined) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text">Class teacher changed. The previous teacher has been signed out of this login.</p>
        {issued ? (
          <Secret
            email={seat.email}
            password={issued}
            note="New password — shown once. Give it to the new class teacher."
          />
        ) : (
          <p className="text-sm text-text-muted">The password was kept the same.</p>
        )}
        <button type="button" className={btnGhost} onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      <Err text={error} />
      <p className="mb-3 text-sm text-text-muted">
        {seat.holderName ? `${seat.holderName} will lose access immediately.` : "This class has no teacher yet."} Only active
        faculty can hold a class.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px]">
          <StaffPersonPicker
            disabled={pending}
            name="personId"
            label="New class teacher"
            onSelect={(s) => setPersonId(s?.personId ?? "")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={rotate} onChange={(e) => setRotate(e.target.checked)} />
          Renew the password (recommended)
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || !personId}
            className={btnPrimary}
            onClick={() =>
              start(async () => {
                const r = await changeClassTeacherAction(seat.loginPersonId, seat.targetSectionId!, personId, rotate);
                if (r.error) return setError(r.error);
                setIssued(r.newPassword);
              })
            }
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" className={btnGhost} onClick={onDone}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPassword({ seat, onDone }: { seat: ClassLoginSeat; onDone: () => void }) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (issued) {
    return (
      <div className="space-y-3">
        <Secret email={seat.email} password={issued} note="New password — anyone signed in was signed out." />
        <button type="button" className={btnGhost} onClick={onDone}>
          Done
        </button>
      </div>
    );
  }
  return (
    <div>
      <Err text={error} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
            Password (leave empty to generate)
          </span>
          <input
            id={`pw-${seat.loginPersonId}`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            minLength={8}
            placeholder="At least 8 characters"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || (custom.length > 0 && custom.length < 8)}
            className={btnPrimary}
            onClick={() =>
              start(async () => {
                const r = await setClassLoginPasswordAction(seat.loginPersonId, custom);
                if (r.error) return setError(r.error);
                setIssued(r.newPassword ?? null);
              })
            }
          >
            {pending ? "Saving…" : "Set password"}
          </button>
          <button type="button" className={btnGhost} onClick={onDone}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RevokePhones({ seat, onDone }: { seat: ClassLoginSeat; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Err text={error} />
      <p className="mb-3 text-sm text-text">
        {seat.linkedPhones} phone{seat.linkedPhones === 1 ? " has" : "s have"} {seat.gradeName}-{seat.sectionName} added as a
        class account. Removing them signs the class account out there at once; {seat.holderName ?? "the teacher"} adds it
        again on their own phone with the class password. Use this if a phone is lost or a password may have leaked.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={`${btn} bg-critical-text text-white`}
          onClick={() =>
            start(async () => {
              const r = await revokeClassLoginLinksAction(seat.loginPersonId);
              if (r.error) return setError(r.error);
              onDone();
            })
          }
        >
          {pending ? "Removing…" : "Remove linked phones"}
        </button>
        <button type="button" className={btnGhost} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Vacate({ seat, onDone }: { seat: ClassLoginSeat; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Err text={error} />
      <p className="mb-3 text-sm text-text">
        Remove {seat.holderName} from {seat.gradeName}-{seat.sectionName}? They are signed out at once and the password is
        renewed, so nobody can use this login until you assign a new teacher.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={`${btn} bg-critical-text text-white`}
          onClick={() =>
            start(async () => {
              const r = await vacateClassLoginAction(seat.loginPersonId);
              if (r.error) return setError(r.error);
              onDone();
            })
          }
        >
          {pending ? "Removing…" : "Vacate class"}
        </button>
        <button type="button" className={btnGhost} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function useLoaded<T>(load: () => Promise<{ error?: string } & Partial<T>>) {
  const [state, setState] = useState<{ done: boolean; error?: string; value?: T }>({ done: false });
  useEffect(() => {
    let live = true;
    load().then((r) => {
      if (live) setState(r.error ? { done: true, error: r.error } : { done: true, value: r as T });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

function Students({ seat, yearId, onDone }: { seat: ClassLoginSeat; yearId: string; onDone: () => void }) {
  const s = useLoaded<{ students: ClassLoginStudent[] }>(() => classLoginStudentsAction(seat.loginPersonId, yearId));
  return (
    <div>
      <p className="mb-2 text-sm text-text-muted">
        Students come from this year&apos;s enrolments — they are never assigned to the login by hand.
      </p>
      {!s.done && <p className="text-sm text-text-muted">Loading…</p>}
      <Err text={s.error ?? null} />
      {s.value && (
        <div className="max-h-64 overflow-auto">
          {s.value.students.length === 0 ? (
            <p className="text-sm text-text-muted">No active students in this class for the current year.</p>
          ) : (
            <ol className="grid gap-x-6 text-sm text-text sm:grid-cols-2">
              {s.value.students.map((st) => (
                <li key={st.studentId} className="py-0.5">
                  <span className="tabular-nums text-text-muted">{st.rollNo ?? "–"}.</span> {st.name}
                  {st.enrolmentType && st.enrolmentType !== "REGULAR" && (
                    <span className="ml-1.5 text-[11px] text-text-muted">{st.enrolmentType.toLowerCase()}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <button type="button" className={`${btnGhost} mt-3`} onClick={onDone}>
        Close
      </button>
    </div>
  );
}

function History({ seat, onDone }: { seat: ClassLoginSeat; onDone: () => void }) {
  const h = useLoaded<{ history: ClassLoginHistoryItem[] }>(() => classLoginHistoryAction(seat.loginPersonId));
  return (
    <div>
      {!h.done && <p className="text-sm text-text-muted">Loading…</p>}
      <Err text={h.error ?? null} />
      {h.value &&
        (h.value.history.length === 0 ? (
          <p className="text-sm text-text-muted">No one has held this class yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-text">
            {h.value.history.map((a) => (
              <li key={a.id}>
                {formatDate(a.assignedOn)} → {a.unassignedOn ? formatDate(a.unassignedOn) : "now"}
                <span className="ml-2 text-[12px] text-text-muted">{a.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" className={`${btnGhost} mt-3`} onClick={onDone}>
        Close
      </button>
    </div>
  );
}

function RolloverWizard({ year, onClose }: { year: { id: string; name: string }; onClose: () => void }) {
  const [preview, setPreview] = useState<RolloverPreview | null>(null);
  const [result, setResult] = useState<RolloverResult | null>(null);
  const [rotate, setRotate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 rounded-[11px] border border-border bg-field p-3.5">
      <p className="text-sm font-bold text-text">Roll class logins into {year.name}</p>
      <p className="mt-1 text-sm text-text-muted">
        Each login keeps its email, its teacher and its password; it just moves to this year&apos;s section, so the new
        students appear. Safe to run again.
      </p>
      <div className="mt-3">
        <Err text={error} />
        {result ? (
          <p className="text-sm text-text">
            Done — {result.moved} moved, {result.alreadyAligned} already up to date, {result.staysVacant} left vacant,{" "}
            {result.noSectionThisYear} skipped (no section this year).
          </p>
        ) : !preview ? (
          <button
            type="button"
            disabled={pending}
            className={btnPrimary}
            onClick={() =>
              start(async () => {
                const r = await rolloverPreviewAction(year.id);
                if (r.error) return setError(r.error);
                setError(null);
                setPreview(r.preview ?? null);
              })
            }
          >
            {pending ? "Checking…" : "Preview changes"}
          </button>
        ) : (
          <div className="space-y-3">
            <ul className="text-sm text-text">
              <li>{preview.summary.toMove} login(s) will move to {year.name}</li>
              <li>{preview.summary.alreadyAligned} already up to date</li>
              <li>{preview.summary.staysVacant} will stay vacant (no teacher to carry over)</li>
              <li>{preview.summary.noSectionThisYear} skipped — the class has no section this year</li>
              {preview.summary.sectionsWithoutLogin > 0 && (
                <li>{preview.summary.sectionsWithoutLogin} section(s) this year have no login at all</li>
              )}
            </ul>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={rotate} onChange={(e) => setRotate(e.target.checked)} />
              Also renew every moved login&apos;s password (each new one is then shown with Reveal in the table)
            </label>
            <button
              type="button"
              disabled={pending || preview.summary.toMove === 0}
              className={btnPrimary}
              onClick={() =>
                start(async () => {
                  const r = await rolloverApplyAction(year.id, rotate);
                  if (r.error) return setError(r.error);
                  setError(null);
                  setResult(r.result ?? null);
                })
              }
            >
              {pending ? "Applying…" : `Move ${preview.summary.toMove} login(s)`}
            </button>
          </div>
        )}
        <button type="button" className={`${btnGhost} ml-2`} onClick={onClose}>
          {result ? "Close" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
