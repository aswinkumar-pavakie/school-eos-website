// Vice Principal -- Exam timetable: per the SIS Principal mockup's own screen
// (nav item "Exam timetable"). Thin data-fetching wrapper around the shared
// ExamTimetableView (src/components/academics/ExamTimetableView.tsx), which
// also backs Principal and Admin so all three render identically off the
// same real exam/exam_subject schedule (exams.controller.ts, granted to
// VICE_PRINCIPAL) and marksEnteredCount (a real count of `mark` rows per
// paper -- see exam.repository.ts's own comment). No create/edit/publish/
// lock controls: all writes stay Admin-only.

import { ExamTimetableView, type ExamRow, type ExamScheduleRow } from "@/components/academics/ExamTimetableView";
import { apiFetch } from "@/lib/api";

export default async function VicePrincipalExamTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; gradeName?: string; sectionName?: string }>;
}) {
  const sp = await searchParams;

  const examsRes = await apiFetch("/examinations");
  const exams: ExamRow[] = examsRes.ok ? ((await examsRes.json()) as { data: ExamRow[] }).data : [];
  const selectedExam = (sp.examId ? exams.find((e) => e.id === sp.examId) : exams[0]) ?? null;

  // Every exam's own schedule -- only a handful of real exams exist, so
  // fetching all of them in parallel to compute a real "papers this month"
  // figure is cheap; no new endpoint needed for that.
  const allSchedulesByExam = await Promise.all(
    exams.map(async (e) => {
      const res = await apiFetch(`/examinations/${e.id}/schedules`);
      const rows: ExamScheduleRow[] = res.ok ? ((await res.json()) as { data: ExamScheduleRow[] }).data : [];
      return { examId: e.id, rows };
    }),
  );
  const allSchedules = allSchedulesByExam.flatMap((e) => e.rows);
  const selectedSchedules = allSchedulesByExam.find((e) => e.examId === selectedExam?.id)?.rows ?? [];

  const gradeOrder: string[] = [];
  for (const s of selectedSchedules) if (!gradeOrder.includes(s.gradeName)) gradeOrder.push(s.gradeName);
  const selectedGrade = sp.gradeName && gradeOrder.includes(sp.gradeName) ? sp.gradeName : gradeOrder[0];
  const sectionOrder: string[] = [];
  for (const s of selectedSchedules) {
    if (s.gradeName === selectedGrade && !sectionOrder.includes(s.sectionName)) sectionOrder.push(s.sectionName);
  }
  const selectedSection = sp.sectionName && sectionOrder.includes(sp.sectionName) ? sp.sectionName : sectionOrder[0];

  return (
    <ExamTimetableView
      formAction="/vice-principal/academics/examination-timetable"
      printBasePath="/print/examinations/timetable"
      exams={exams}
      selectedExam={selectedExam}
      allSchedules={allSchedules}
      allSchedulesByExam={allSchedulesByExam}
      selectedSchedules={selectedSchedules}
      selectedGrade={selectedGrade}
      selectedSection={selectedSection}
      gradeOrder={gradeOrder}
      sectionOrder={sectionOrder}
    />
  );
}
