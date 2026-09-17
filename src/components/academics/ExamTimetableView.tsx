// Shared "Exam timetable" view for Principal/Vice Principal/Admin -- pixel
// matches the SIS mockup's own screen (nav item "Exam timetable", Principal
// Console.dc.html: title "Exam timetable", subtitle "Every examination
// posted by the academic co-ordinators for 2026-27"): 4 KPI tiles, a
// Standard/Section/Examination filter bar of bordered selects (same pattern
// as ClassTimetableView.tsx's filter bar) plus a real "Download PDF" link
// (same window.print()-backed /print/examinations/timetable route every
// other "Download PDF" in this app uses), and a result card -- exam name +
// class/section heading, a real "CLASSES x-y - published by <name>, academic
// co-ordinator" meta line, a status pill ("Published - N papers"), and the
// real per-subject schedule table.
//
// Real data throughout: exam.state/exam_subject schedule (exams.controller.ts,
// granted to ADMIN/PRINCIPAL/VICE_PRINCIPAL) and marksEnteredCount (a real
// count of `mark` rows per paper, added to the same schedules endpoint -- see
// exam.repository.ts's own comment). No create/edit/publish/lock controls
// here: all writes stay Admin-only, on the separate Examinations module.
//
// The mockup's own KPI tiles assume a per-unit-test "hall tickets issued"
// concept that doesn't exist in the real schema (the real
// `board_exam_registration.hall_ticket_key` is a different, much smaller
// concept -- board exam registration for ~160 students, not every unit
// test) -- substituted with "Sections covered" and "Marks entry" tiles,
// both backed by this same real schedule data, keeping the 4-tile layout
// without fabricating a number.

import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate, formatPercentOf, statusLabel, statusTone } from "@/lib/format";

export interface ExamRow {
  id: string;
  name: string;
  examType: string;
  term: string | null;
  academicYearName: string;
  state: string;
}

export interface ExamScheduleRow {
  id: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  examDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  room: string | null;
  maxMarks: string;
  passMarks: string | null;
  marksEnteredCount: number;
}

const PUBLISHED_STATES = new Set(["PUBLISHED", "LOCKED"]);
const IN_PROGRESS_STATES = new Set(["SCHEDULED", "CONDUCTED", "MARKS_ENTRY", "VERIFIED"]);

function endTime(startTime: string | null, durationMinutes: number | null): string | null {
  if (!startTime || !durationMinutes) return null;
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function dayName(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { weekday: "short" });
}

function session(startTime: string | null): string {
  if (!startTime) return "—";
  const hour = Number(startTime.split(":")[0]);
  return hour < 12 ? "Forenoon" : "Afternoon";
}

export function ExamTimetableView({
  formAction,
  printBasePath,
  exams,
  selectedExam,
  allSchedules,
  allSchedulesByExam,
  selectedSchedules,
  selectedGrade,
  selectedSection,
  gradeOrder,
  sectionOrder,
  room,
}: {
  formAction: string;
  printBasePath: string;
  exams: ExamRow[];
  selectedExam: ExamRow | null;
  allSchedules: ExamScheduleRow[];
  allSchedulesByExam: { examId: string; rows: ExamScheduleRow[] }[];
  selectedSchedules: ExamScheduleRow[];
  selectedGrade: string | undefined;
  selectedSection: string | undefined;
  gradeOrder: string[];
  sectionOrder: string[];
  /** Whether to show the Room column in the papers table -- real data when
   * present, omitted entirely (not padded with "-") when no schedule row on
   * this page ever populates it. */
  room?: boolean;
}) {
  const tableSchedules = selectedSchedules
    .filter((s) => s.gradeName === selectedGrade && s.sectionName === selectedSection)
    .sort((a, b) => (a.examDate ?? "").localeCompare(b.examDate ?? ""));

  // Tile 1 -- Examinations posted (across every real exam, any year).
  const publishedCount = exams.filter((e) => PUBLISHED_STATES.has(e.state)).length;
  const inProgressCount = exams.filter((e) => IN_PROGRESS_STATES.has(e.state)).length;
  const draftCount = exams.filter((e) => e.state === "DRAFT").length;

  // Tile 2 -- Papers this month (across every real exam).
  const now = new Date();
  const papersThisMonth = allSchedules.filter((s) => {
    if (!s.examDate) return false;
    const d = new Date(s.examDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const examsWithPapersThisMonth = new Set(
    allSchedulesByExam.filter((e) => e.rows.some((r) => papersThisMonth.includes(r))).map((e) => e.examId),
  );

  // Tile 3 -- Sections covered, for the selected examination.
  const distinctSections = new Set(selectedSchedules.map((s) => `${s.gradeName}|${s.sectionName}`));
  const distinctGrades = new Set(selectedSchedules.map((s) => s.gradeName));

  // Tile 4 -- Marks entry, for the selected examination (real `mark` row
  // counts per paper).
  const papersMarked = selectedSchedules.filter((s) => s.marksEnteredCount > 0).length;
  const papersOpen = selectedSchedules.length - papersMarked;

  const groupBadge = selectedExam
    ? `${statusLabel(selectedExam.state)} · ${tableSchedules.length} paper${tableSchedules.length === 1 ? "" : "s"}`
    : null;

  const showRoom = room ?? tableSchedules.some((s) => s.room);

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Exam timetable</h1>
      <p className="mt-1.5 text-sm text-text-muted">
        Every examination posted by the academic co-ordinators
        {selectedExam ? ` for ${selectedExam.academicYearName}` : ""}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Examinations posted"
          value={String(publishedCount)}
          detail={[`of ${exams.length} total`, `${inProgressCount} in progress · ${draftCount} in draft`]}
          pctBadge={exams.length > 0 ? formatPercentOf(publishedCount, exams.length) : undefined}
          bar={exams.length > 0 ? Math.round((publishedCount / exams.length) * 100) : undefined}
        />
        <KpiCard
          eyebrow="Papers this month"
          value={String(papersThisMonth.length)}
          detail={[
            `of ${allSchedules.length} scheduled in total`,
            `across ${examsWithPapersThisMonth.size} examination${examsWithPapersThisMonth.size === 1 ? "" : "s"}`,
          ]}
          pctBadge={allSchedules.length > 0 ? formatPercentOf(papersThisMonth.length, allSchedules.length) : undefined}
          bar={allSchedules.length > 0 ? Math.round((papersThisMonth.length / allSchedules.length) * 100) : undefined}
        />
        <KpiCard
          eyebrow="Sections covered"
          value={String(distinctSections.size)}
          detail={[
            `across ${distinctGrades.size} class${distinctGrades.size === 1 ? "" : "es"}`,
            `${selectedSchedules.length} papers scheduled`,
          ]}
        />
        <KpiCard
          eyebrow="Marks entry open"
          value={String(papersOpen)}
          detail={[`of ${selectedSchedules.length} papers`, `${papersMarked} papers already have marks entered`]}
          pctBadge={selectedSchedules.length > 0 ? formatPercentOf(papersMarked, selectedSchedules.length) : undefined}
          bar={selectedSchedules.length > 0 ? Math.round((papersMarked / selectedSchedules.length) * 100) : undefined}
        />
      </div>

      <form
        action={formAction}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Standard</span>
          <AutoSubmitSelect
            name="gradeName"
            defaultValue={selectedGrade ?? ""}
            className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            {gradeOrder.length === 0 && <option value="">No classes scheduled</option>}
            {gradeOrder.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Section</span>
          <AutoSubmitSelect
            name="sectionName"
            defaultValue={selectedSection ?? ""}
            className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            {sectionOrder.length === 0 && <option value="">—</option>}
            {sectionOrder.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Examination</span>
          <AutoSubmitSelect
            name="examId"
            defaultValue={selectedExam?.id ?? ""}
            className="min-w-[220px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            {exams.length === 0 && <option value="">No examinations yet</option>}
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.academicYearName}
                {e.term ? ` · ${e.term}` : ""}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <Link
          href={`${printBasePath}?examId=${selectedExam?.id ?? ""}&gradeName=${encodeURIComponent(selectedGrade ?? "")}&sectionName=${encodeURIComponent(selectedSection ?? "")}`}
          target="_blank"
          className="rounded-[11px] border border-border bg-field px-4 py-2.5 text-sm font-semibold text-text hover:border-primary/40"
        >
          Download PDF
        </Link>
      </form>

      {selectedExam && (
        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">
                {selectedExam.name}
                {selectedGrade ? ` · ${selectedGrade}${selectedSection ? `-${selectedSection}` : ""}` : ""}
              </h2>
              <p className="mt-1 text-[13px] text-text-muted">
                {distinctGrades.size > 0
                  ? `Classes ${Array.from(distinctGrades).join(", ")}`
                  : "No schedule set for this examination yet."}
              </p>
            </div>
            {groupBadge && <StatusPill tone={statusTone(selectedExam.state)} label={groupBadge} />}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Time</th>
                  {showRoom && <th className="px-4 py-3">Room</th>}
                  <th className="px-4 py-3">Max marks</th>
                  <th className="px-4 py-3">Invigilator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableSchedules.length === 0 && (
                  <tr>
                    <td colSpan={showRoom ? 8 : 7} className="px-4 py-10 text-center text-text-muted">
                      No papers scheduled for this class &amp; section yet.
                    </td>
                  </tr>
                )}
                {tableSchedules.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-text-muted">{formatDate(row.examDate)}</td>
                    <td className="px-4 py-3 text-text-muted">{dayName(row.examDate)}</td>
                    <td className="px-4 py-3 text-text-muted">{session(row.startTime)}</td>
                    <td className="px-4 py-3 font-semibold text-text">{row.subjectName}</td>
                    <td className="px-4 py-3 font-mono text-text-muted">
                      {row.startTime ?? "—"}
                      {endTime(row.startTime, row.durationMinutes) ? ` - ${endTime(row.startTime, row.durationMinutes)}` : ""}
                    </td>
                    {showRoom && <td className="px-4 py-3 text-text-muted">{row.room ?? "—"}</td>}
                    <td className="px-4 py-3 font-mono text-text">{row.maxMarks}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {row.teacherFirstName ? `${row.teacherFirstName} ${row.teacherLastName ?? ""}`.trim() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
