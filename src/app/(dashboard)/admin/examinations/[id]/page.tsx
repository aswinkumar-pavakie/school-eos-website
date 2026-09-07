// Examination detail -- schedule (exam_subject) management lives here: pick a
// grade+section via the GET filter, then add subjects from that section's real
// subject_offering rows (GET /subject-offerings requires sectionId -- see
// SubjectOfferingQueryDto). Publish/Lock are the exam's own lifecycle actions;
// both are state-gated server-side (ExamsService), the buttons here just call
// them and surface the real error if a guard rejects it.

import { notFound } from "next/navigation";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateExamScheduleForm } from "@/components/examinations/CreateExamScheduleForm";
import { EditExamForm } from "@/components/examinations/EditExamForm";
import { ExamLifecycleButton } from "@/components/examinations/ExamLifecycleButton";
import { ExamScheduleRow, type ScheduleRow } from "@/components/examinations/ExamScheduleRow";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ExamDetail {
  id: string;
  name: string;
  examType: string;
  term: string | null;
  academicYearId: string;
  academicYearName: string;
  gradeScaleId: string | null;
  gradeScaleName: string | null;
  state: string;
  publishedAt: string | null;
}
interface GradeScale {
  id: string;
  name: string;
}
interface NamedRow {
  id: string;
  name: string;
}
interface Section extends NamedRow {
  gradeId: string;
}
interface Offering {
  id: string;
  subjectName: string;
  teacherFirstName: string | null;
  teacherLastName: string | null;
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

export default async function ExamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gradeId?: string; sectionId?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [examRes, scalesRes, gradesRes, sectionsRes, schedulesRes] = await Promise.all([
    apiFetch(`/examinations/${id}`),
    apiFetch("/grade-scales"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch(`/examinations/${id}/schedules`),
  ]);

  if (examRes.status === 404) notFound();
  if (!examRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this examination</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: exam } = (await examRes.json()) as { data: ExamDetail };
  const gradeScales: GradeScale[] = scalesRes.ok ? ((await scalesRes.json()) as { data: GradeScale[] }).data : [];
  const grades: NamedRow[] = gradesRes.ok ? ((await gradesRes.json()) as { data: NamedRow[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const schedules: ScheduleRow[] = schedulesRes.ok
    ? ((await schedulesRes.json()) as { data: ScheduleRow[] }).data
    : [];

  const sectionsForGrade = sp.gradeId ? sections.filter((s) => s.gradeId === sp.gradeId) : sections;
  let offerings: Offering[] = [];
  if (sp.sectionId) {
    const offeringsRes = await apiFetch(`/subject-offerings?sectionId=${sp.sectionId}`);
    offerings = offeringsRes.ok ? ((await offeringsRes.json()) as { data: Offering[] }).data : [];
  }

  const locked = exam.state === "LOCKED";
  const canPublish = exam.state !== "PUBLISHED" && exam.state !== "LOCKED";
  const canLock = exam.state === "PUBLISHED";

  return (
    <div className="mx-auto max-w-[1100px]">
      <BackLink href="/admin/examinations" label="Back to Examinations" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{exam.name}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {exam.examType.replace(/_/g, " ").toLowerCase()}
            {exam.term ? ` · ${exam.term}` : ""} · {exam.academicYearName}
            {exam.gradeScaleName ? ` · ${exam.gradeScaleName}` : ""}
          </p>
          {exam.publishedAt && <p className="mt-1 text-xs text-text-muted">Published {formatDate(exam.publishedAt)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={STATE_TONE[exam.state] ?? "pending"} label={exam.state.replace(/_/g, " ")} />
          {canPublish && <ExamLifecycleButton id={exam.id} action="publish" />}
          {canLock && <ExamLifecycleButton id={exam.id} action="lock" />}
        </div>
      </div>

      {!locked && (
        <div className="mt-4">
          <EditExamForm
            exam={{
              id: exam.id,
              name: exam.name,
              examType: exam.examType,
              term: exam.term,
              gradeScaleId: exam.gradeScaleId,
            }}
            gradeScales={gradeScales}
          />
        </div>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[17px] font-extrabold leading-[22px] text-text">Schedule</h2>
        </div>

        {!locked && (
          <>
            <form action={`/admin/examinations/${id}`} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Standard</span>
                <AutoSubmitSelect
                  name="gradeId"
                  defaultValue={sp.gradeId ?? ""}
                  className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
                >
                  <option value="">Select standard</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Section</span>
                <AutoSubmitSelect
                  name="sectionId"
                  defaultValue={sp.sectionId ?? ""}
                  className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
                >
                  <option value="">Select section</option>
                  {sectionsForGrade.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </label>
            </form>
            <div className="mt-3">
              <CreateExamScheduleForm examId={exam.id} offerings={offerings} />
            </div>
          </>
        )}

        <div className="mt-4 overflow-x-auto rounded-[16px] border border-border bg-surface">
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                    No subjects scheduled yet.
                  </td>
                </tr>
              )}
              {schedules.map((row) => (
                <ExamScheduleRow key={row.id} row={row} locked={locked} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
