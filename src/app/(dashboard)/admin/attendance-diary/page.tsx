import { AttendanceDiaryPage } from "@/components/attendance-diary/AttendanceDiaryPage";

export const dynamic = "force-dynamic";

// Attendance Diary -- shared screen; the backend scopes it to this login's own role and class mappings.
export default function AdminAttendanceDiaryPage() {
  return <AttendanceDiaryPage studentBase="/admin/students" employeeBase="/admin/faculty" />;
}
