import { AttendanceDiaryPage } from "@/components/attendance-diary/AttendanceDiaryPage";

export const dynamic = "force-dynamic";

// Attendance Diary -- shared screen; the backend scopes it to this login's own role and class mappings.
export default function CorrespondentAttendanceDiaryPage() {
  return <AttendanceDiaryPage studentBase="/correspondent/students" employeeBase="/correspondent/faculty" />;
}
