// Principal -> Attendance: staff/teacher roll call, same real data
// (staff_attendance_event) and same board Admin's own /admin/attendance page
// uses. Per the approved API doc (Phase 3 · Attendance, "POST
// /staff/attendance/manual" = "Admin/Principal (direct, confirmed)"),
// Principal marks attendance directly here too -- not view-only, and not an
// approval step -- the one Principal action in this build with full parity
// with Admin. Student attendance (sessions/records) has no frontend anywhere
// yet, Admin included -- deliberately out of scope, same reasoning as
// Examinations.

import { StaffAttendanceBoard, type StaffDailyStatus } from "@/components/attendance/StaffAttendanceBoard";
import { StaffAttendanceFilterBar } from "@/components/attendance/StaffAttendanceFilterBar";
import { apiFetch } from "@/lib/api";

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function PrincipalAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    isTeaching?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
  }>;
}) {
  const params = await searchParams;
  const date = params.date ?? today();

  const query = new URLSearchParams({ date });
  if (params.isTeaching) query.set("isTeaching", params.isTeaching);
  if (params.isTeaching === "true") {
    if (params.gradeId) query.set("gradeId", params.gradeId);
    if (params.sectionId) query.set("sectionId", params.sectionId);
    if (params.subjectId) query.set("subjectId", params.subjectId);
  }

  const [rosterRes, gradesRes, sectionsRes, subjectsRes] = await Promise.all([
    apiFetch(`/staff-attendance?${query.toString()}`),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/subjects"),
  ]);

  if (!rosterRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Attendance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const roster: StaffDailyStatus[] = ((await rosterRes.json()) as { data: StaffDailyStatus[] }).data;
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const subjects: Subject[] = subjectsRes.ok ? ((await subjectsRes.json()) as { data: Subject[] }).data : [];

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">Whole-day roll call for staff.</p>
        </div>
      </div>

      <StaffAttendanceFilterBar
        date={date}
        isTeaching={params.isTeaching ?? ""}
        gradeId={params.gradeId ?? ""}
        sectionId={params.sectionId ?? ""}
        subjectId={params.subjectId ?? ""}
        grades={grades}
        sections={sections}
        subjects={subjects}
        formAction="/principal/attendance"
      />

      <div className="mt-6">
        <StaffAttendanceBoard date={date} roster={roster} revalidatePathOverride="/principal/attendance" />
      </div>
    </div>
  );
}
