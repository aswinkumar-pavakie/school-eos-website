// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpAttendance"
// screen. Reuses EXISTING real getMyAttendance(month) data unchanged. Now
// renders the shared src/components/shared-ui/MyAttendanceView -- Faculty's
// screen is the canonical design Principal/Vice-Principal's own My
// Attendance feature also renders verbatim (see principal/my-attendance/
// page.tsx).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getMyAttendance } from "@/lib/faculty-staff-api";
import { MyAttendanceView, type MyAttendanceDay } from "@/components/shared-ui/MyAttendanceView";

function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  try {
    const { month } = await searchParams;
    const selectedMonth = month || thisMonth();
    const [y, m] = selectedMonth.split("-").map(Number);
    const { today, summary, days } = await getMyAttendance(selectedMonth);

    const viewDays: MyAttendanceDay[] = days.map((d) => ({
      date: d.date,
      status: (d.status as MyAttendanceDay["status"]) ?? null,
      detailLine: `${d.punchIn ?? "--"} ${d.punchOut ? `- ${d.punchOut}` : ""}`.trim(),
    }));

    const todayLine = today.status
      ? `${today.status}${today.punchIn ? ` · In ${today.punchIn}` : ""}${today.punchOut ? ` · Out ${today.punchOut}` : ""}`
      : "No event recorded yet today.";

    return (
      <MyAttendanceView
        basePath="/faculty/my-attendance"
        subtitle="Your biometric log"
        year={y}
        month={m - 1}
        statTiles={[
          { label: "Attendance rate", value: summary.ratePercent !== null ? `${summary.ratePercent}%` : "--" },
          { label: "Present", value: String(summary.presentCount) },
          { label: "Absent", value: String(summary.absentCount) },
          { label: "On duty", value: String(summary.onDutyCount) },
        ]}
        todayLine={todayLine}
        days={viewDays}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your attendance. Nothing was changed -- try again." />;
  }
}
