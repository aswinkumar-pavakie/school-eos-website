// Limited, attendance-only profile of one student, opened from the Attendance Diary by roles that
// are not leadership (class advisor, faculty, academic coordinator). It shows attendance only --
// no fees and no guardian details -- and the backend returns 404 for any student outside the
// caller's own classes.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getDiaryStudentProfile, type DiaryStudentProfile } from "@/lib/attendance-diary-api";

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  PRESENT: { label: "Present", bg: "var(--eos-green-bg)", fg: "var(--eos-green-text)" },
  ABSENT: { label: "Absent", bg: "var(--eos-red-bg)", fg: "var(--eos-red-text)" },
  LATE: { label: "Late", bg: "#fef3c7", fg: "#92400e" },
  NOT_MARKED: { label: "Not marked", bg: "var(--eos-divider)", fg: "var(--eos-body-muted)" },
};
const pctColor = (p: number | null) => (p === null ? "var(--eos-tertiary)" : p < 75 ? "var(--eos-red)" : p < 90 ? "#d97706" : "#16a34a");
const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const fmtMonth = (m: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

function Pill({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.NOT_MARKED!;
  return (
    <span style={{ background: s.bg, color: s.fg, font: "600 12px/1 var(--eos-font-sans)", padding: "6px 10px", borderRadius: "var(--eos-radius-pill)", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function Tile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "14px 16px" }}>
      <span style={{ display: "block", font: "600 12px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{label}</span>
      <span style={{ display: "block", marginTop: 8, font: "700 28px/1 var(--eos-font-sans)", color }}>{value}</span>
    </div>
  );
}

export async function StudentAttendanceProfilePage({ studentId, date, backHref }: { studentId: string; date?: string; backHref: string }) {
  let data: DiaryStudentProfile;
  try {
    data = await getDiaryStudentProfile(studentId, date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div>
        <Link href={backHref} style={{ color: "var(--eos-primary)", font: "600 14px/1 var(--eos-font-sans)" }}>← Back to Attendance Diary</Link>
        <div style={{ marginTop: 16 }}>
          <ErrorState message={err instanceof Error ? err.message : "Couldn't load this student."} />
        </div>
      </div>
    );
  }
  const { student, summary } = data;
  const name = [student.firstName, student.lastName].filter(Boolean).join(" ");

  return (
    <div>
      <Link href={backHref} style={{ color: "var(--eos-primary)", font: "600 14px/1 var(--eos-font-sans)" }}>← Back to Attendance Diary</Link>
      <h1 style={{ margin: "16px 0 0", font: "700 34px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>{name}</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
        Class {student.gradeName}-{student.sectionName}
        {student.rollNo ? ` · Roll ${student.rollNo}` : ""} · Admission {student.admissionNo}
        {student.isHosteller ? " · Hosteller" : ""}
        {student.usesSchoolTransport ? " · School bus" : ""}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5" style={{ marginTop: 20 }}>
        <Tile label="Attendance (year to date)" value={summary.percentage === null ? "—" : `${summary.percentage}%`} color={pctColor(summary.percentage)} />
        <Tile label="Days present" value={summary.presentDays} color="var(--eos-green-text)" />
        <Tile label="Days late" value={summary.lateDays} color="#92400e" />
        <Tile label="Days absent" value={summary.absentDays} color="var(--eos-red-text)" />
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "14px 16px" }}>
          <span style={{ display: "block", font: "600 12px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{fmtDate(data.date)}</span>
          <span style={{ display: "block", marginTop: 12 }}><Pill status={data.dayStatus} /></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ marginTop: 20 }}>
        <section style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 20 }}>
          <h2 style={{ margin: "0 0 14px", font: "700 18px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Month by month</h2>
          {data.monthly.length === 0 && <p style={{ color: "var(--eos-body-muted)", font: "400 14px/1.4 var(--eos-font-sans)" }}>No attendance recorded yet.</p>}
          {data.monthly.map((m) => {
            const pct = m.total ? Math.round((1000 * (m.present + m.late)) / m.total) / 10 : 0;
            return (
              <div key={m.month} style={{ padding: "10px 0", borderTop: "1px solid var(--eos-divider)" }}>
                <div className="flex items-center justify-between">
                  <strong style={{ font: "600 14px/1 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{fmtMonth(m.month)}</strong>
                  <strong style={{ font: "700 14px/1 var(--eos-font-sans)", color: pctColor(pct) }}>{pct}%</strong>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "var(--eos-border)", margin: "8px 0", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pctColor(pct) }} />
                </div>
                <span style={{ font: "400 12px/1 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
                  {m.present} present · {m.late} late · {m.absent} absent · {m.total} days
                </span>
              </div>
            );
          })}
        </section>

        <section style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 20 }}>
          <h2 style={{ margin: "0 0 14px", font: "700 18px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Recent days</h2>
          {data.recent.length === 0 && <p style={{ color: "var(--eos-body-muted)", font: "400 14px/1.4 var(--eos-font-sans)" }}>No attendance recorded yet.</p>}
          {data.recent.map((r) => (
            <div key={r.date} className="flex items-center justify-between gap-3" style={{ padding: "10px 0", borderTop: "1px solid var(--eos-divider)" }}>
              <span style={{ font: "500 14px/1.3 var(--eos-font-sans)", color: "var(--eos-body)" }}>
                {fmtDate(r.date)}
                {r.reason && <span style={{ display: "block", font: "400 12px/1.3 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{r.reason}</span>}
              </span>
              <Pill status={r.status} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
