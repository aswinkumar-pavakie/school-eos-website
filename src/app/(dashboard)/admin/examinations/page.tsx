// Examinations -- real data from `exam`, which already existed fully populated
// (2 rows) with no API in front of it (see query.md, section 6). Backend:
// src/modules/examinations. Admin-only end to end; Principal's own
// Examinations page stays its existing ComingSoon stub -- not wired here.

import Link from "next/link";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateExamForm } from "@/components/examinations/CreateExamForm";
import { apiFetch } from "@/lib/api";

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface GradeScale {
  id: string;
  name: string;
  isDefault: boolean;
}
interface ExamRow {
  id: string;
  name: string;
  examType: string;
  term: string | null;
  academicYearName: string;
  gradeScaleName: string | null;
  state: string;
  publishedAt: string | null;
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

export default async function ExaminationsPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string; state?: string }>;
}) {
  const params = await searchParams;

  const [yearsRes, scalesRes] = await Promise.all([apiFetch("/academic-years"), apiFetch("/grade-scales")]);
  const academicYears: AcademicYear[] = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const gradeScales: GradeScale[] = scalesRes.ok ? ((await scalesRes.json()) as { data: GradeScale[] }).data : [];

  const query = new URLSearchParams();
  if (params.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params.state) query.set("state", params.state);
  const res = await apiFetch(`/examinations?${query.toString()}`);
  const exams: ExamRow[] = res.ok ? ((await res.json()) as { data: ExamRow[] }).data : [];

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Examinations</h1>
          <p className="mt-1 text-sm text-text-muted">Create, schedule, publish, and lock examinations.</p>
        </div>
        <CreateExamForm academicYears={academicYears} gradeScales={gradeScales} />
      </div>

      <form action="/admin/examinations" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Academic year</span>
          <AutoSubmitSelect
            name="academicYearId"
            defaultValue={params.academicYearId ?? ""}
            className="min-w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">All years</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">State</span>
          <AutoSubmitSelect
            name="state"
            defaultValue={params.state ?? ""}
            className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">All states</option>
            {["DRAFT", "SCHEDULED", "CONDUCTED", "MARKS_ENTRY", "VERIFIED", "PUBLISHED", "LOCKED"].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Grade scale</th>
              <th className="px-4 py-3">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No examinations yet.
                </td>
              </tr>
            )}
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/examinations/${exam.id}`} className="font-semibold text-primary">
                    {exam.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-muted">{exam.examType.replace(/_/g, " ").toLowerCase()}</td>
                <td className="px-4 py-3 text-text-muted">{exam.term ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">{exam.academicYearName}</td>
                <td className="px-4 py-3 text-text-muted">{exam.gradeScaleName ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={STATE_TONE[exam.state] ?? "pending"} label={exam.state.replace(/_/g, " ")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
