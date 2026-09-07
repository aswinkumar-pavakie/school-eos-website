// Examination Timetable -- a read-only viewer over the same exam_subject
// schedule that's built/edited from the Examinations module (this page has no
// write UI at all; managing a schedule happens on the exam's own detail page,
// linked from here). Real data, same backend as Examinations
// (src/modules/examinations) -- see query.md, section 6.

import Link from "next/link";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ExamRow {
  id: string;
  name: string;
  examType: string;
  term: string | null;
  academicYearName: string;
  state: string;
  createdAt: string;
}
interface ScheduleRow {
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
}

const STATE_TONE: Record<string, "success" | "pending" | "critical"> = {
  DRAFT: "pending",
  SCHEDULED: "pending",
  CONDUCTED: "pending",
  MARKS_ENTRY: "pending",
  VERIFIED: "pending",
  PUBLISHED: "success",
  LOCKED: "critical",
};

export default async function ExaminationTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const sp = await searchParams;

  const examsRes = await apiFetch("/examinations");
  const exams: ExamRow[] = examsRes.ok ? ((await examsRes.json()) as { data: ExamRow[] }).data : [];
  const selectedExam = sp.examId ? exams.find((e) => e.id === sp.examId) : exams[0];

  let schedules: ScheduleRow[] = [];
  if (selectedExam) {
    const res = await apiFetch(`/examinations/${selectedExam.id}/schedules`);
    schedules = res.ok ? ((await res.json()) as { data: ScheduleRow[] }).data : [];
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Examination Timetable</h1>
          <p className="mt-1 text-sm text-text-muted">
            Per-subject exam schedule. To add or edit subjects, open the examination in{" "}
            <Link href="/admin/examinations" className="font-semibold text-primary">
              Examinations
            </Link>
            .
          </p>
        </div>
      </div>

      <form action="/admin/examination-timetable" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Examination</span>
          <AutoSubmitSelect
            name="examId"
            defaultValue={selectedExam?.id ?? ""}
            className="min-w-[260px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
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
        {selectedExam && (
          <StatusPill
            tone={STATE_TONE[selectedExam.state] ?? "pending"}
            label={selectedExam.state.replace(/_/g, " ")}
          />
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Marks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {schedules.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  {exams.length === 0 ? "No examinations created yet." : "No subjects scheduled for this examination yet."}
                </td>
              </tr>
            )}
            {schedules.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-text">
                  {row.gradeName} {row.sectionName}
                </td>
                <td className="px-4 py-3 text-text">{row.subjectName}</td>
                <td className="px-4 py-3 text-text-muted">
                  {row.teacherFirstName ? `${row.teacherFirstName} ${row.teacherLastName ?? ""}`.trim() : "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">{row.examDate ? formatDate(row.examDate) : "—"}</td>
                <td className="px-4 py-3 text-text-muted">
                  {row.startTime ?? "—"}
                  {row.durationMinutes ? ` · ${row.durationMinutes}m` : ""}
                </td>
                <td className="px-4 py-3 text-text-muted">{row.room ?? "—"}</td>
                <td className="px-4 py-3 text-text">
                  {row.maxMarks}
                  {row.passMarks ? ` (pass ${row.passMarks})` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
