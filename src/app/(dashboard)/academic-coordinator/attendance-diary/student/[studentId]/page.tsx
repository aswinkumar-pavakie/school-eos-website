import { StudentAttendanceProfilePage } from "@/components/attendance-diary/StudentAttendanceProfile";

export const dynamic = "force-dynamic";

// Limited, attendance-only student profile opened from the Attendance Diary. Scope is enforced by
// the backend (a student outside this login's classes is a 404).
export default async function Page({ params, searchParams }: { params: Promise<{ studentId: string }>; searchParams: Promise<{ date?: string }> }) {
  const { studentId } = await params;
  const { date } = await searchParams;
  return <StudentAttendanceProfilePage studentId={studentId} date={date} backHref="/academic-coordinator/attendance-diary" />;
}
