import { AttendanceDiaryPage } from "@/components/attendance-diary/AttendanceDiaryPage";

export const dynamic = "force-dynamic";

// Attendance Diary -- shared screen; the backend scopes it to this login's own role and class mappings.
export default function AcademicCoordinatorAttendanceDiaryPage() {
  return <AttendanceDiaryPage attendanceProfileBase="/academic-coordinator/attendance-diary/student" />;
}
