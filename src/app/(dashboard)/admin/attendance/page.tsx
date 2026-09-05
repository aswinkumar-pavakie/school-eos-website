// Attendance -- staff only. Marking student attendance is a teacher's job, not
// admin's, so the Students roll-call view (section pick -> create/lock session)
// was removed from here entirely rather than just made read-only; it can come
// back once there's a real staff/teacher login to own it. Real data from
// staff_attendance_event -- nothing is mocked.

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

export default async function AttendancePage({
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

  const roster: StaffDailyStatus[] = rosterRes.ok
    ? ((await rosterRes.json()) as { data: StaffDailyStatus[] }).data
    : [];
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const subjects: Subject[] = subjectsRes.ok ? ((await subjectsRes.json()) as { data: Subject[] }).data : [];

  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Attendance</h1>
      <p className="mt-1 text-sm text-text-muted">Whole-day roll call for staff, marked by the admin in bulk.</p>

      <StaffAttendanceFilterBar
        date={date}
        isTeaching={params.isTeaching ?? ""}
        gradeId={params.gradeId ?? ""}
        sectionId={params.sectionId ?? ""}
        subjectId={params.subjectId ?? ""}
        grades={grades}
        sections={sections}
        subjects={subjects}
      />

      <div className="mt-6">
        <StaffAttendanceBoard date={date} roster={roster} />
      </div>
    </div>
  );
}
