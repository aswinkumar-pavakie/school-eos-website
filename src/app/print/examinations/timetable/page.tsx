// Exam timetable -- PDF export, same real pattern as every other "Download
// PDF" in this app (PrintReportHeader's own PrintButton -> window.print(), the
// browser's native Save-as-PDF). Renders the same real exam_subject schedule
// as the dashboard's own Exam timetable page, filtered to the same
// examination/standard/section the user had selected there.

import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ExamRow {
  id: string;
  name: string;
  examType: string;
  term: string | null;
  academicYearName: string;
  state: string;
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

export default async function ExaminationTimetablePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; gradeName?: string; sectionName?: string }>;
}) {
  const sp = await searchParams;

  const [examsRes, schedulesRes] = await Promise.all([
    apiFetch("/examinations"),
    sp.examId ? apiFetch(`/examinations/${sp.examId}/schedules`) : Promise.resolve(null),
  ]);
  const exams: ExamRow[] = examsRes.ok ? ((await examsRes.json()) as { data: ExamRow[] }).data : [];
  const exam = exams.find((e) => e.id === sp.examId);
  const allSchedules: ScheduleRow[] = schedulesRes?.ok
    ? ((await schedulesRes.json()) as { data: ScheduleRow[] }).data
    : [];
  const schedules = allSchedules.filter(
    (s) => (!sp.gradeName || s.gradeName === sp.gradeName) && (!sp.sectionName || s.sectionName === sp.sectionName),
  );

  const title = exam
    ? `${exam.name}${sp.gradeName ? ` · ${sp.gradeName}${sp.sectionName ? `-${sp.sectionName}` : ""}` : ""}`
    : "Exam timetable";

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader title={title} subtitle={`${schedules.length} papers`} printLabel="Download PDF" />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Day</th>
            <th className="py-2 pr-3">Session</th>
            <th className="py-2 pr-3">Subject</th>
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">Max marks</th>
            <th className="py-2 pr-3">Invigilator</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id} className="border-b border-border">
              <td className="py-2 pr-3">{formatDate(s.examDate)}</td>
              <td className="py-2 pr-3">{dayName(s.examDate)}</td>
              <td className="py-2 pr-3">{session(s.startTime)}</td>
              <td className="py-2 pr-3">{s.subjectName}</td>
              <td className="py-2 pr-3">
                {s.startTime ?? "—"}
                {endTime(s.startTime, s.durationMinutes) ? ` - ${endTime(s.startTime, s.durationMinutes)}` : ""}
              </td>
              <td className="py-2 pr-3">{s.maxMarks}</td>
              <td className="py-2 pr-3">
                {s.teacherFirstName ? `${s.teacherFirstName} ${s.teacherLastName ?? ""}`.trim() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
