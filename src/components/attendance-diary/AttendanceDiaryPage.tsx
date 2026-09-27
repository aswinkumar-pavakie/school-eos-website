// Server-side wrapper each role's /attendance-diary route renders. It loads the caller's
// context (what they may see) from the backend and hands it to the shared client screen.
// Who-sees-what is decided by the backend from the caller's own role mappings, so the same
// wrapper is safe for every role.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getDiaryContext } from "@/lib/attendance-diary-api";
import { AttendanceDiaryView } from "./AttendanceDiaryView";

export async function AttendanceDiaryPage({
  studentBase,
  attendanceProfileBase,
  employeeBase,
}: {
  studentBase?: string;
  attendanceProfileBase?: string;
  employeeBase?: string;
}) {
  let ctx: Awaited<ReturnType<typeof getDiaryContext>>;
  try {
    ctx = await getDiaryContext();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the Attendance Diary."} />;
  }
  return <AttendanceDiaryView initialContext={ctx} studentBase={studentBase} attendanceProfileBase={attendanceProfileBase} employeeBase={employeeBase} />;
}
