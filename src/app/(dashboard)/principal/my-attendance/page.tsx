// Now renders the shared src/components/shared-ui/MyAttendanceView, the
// same canonical screen Faculty's own faculty/my-attendance/page.tsx
// renders. Real /staff/me/attendance-history data (getMyAttendanceHistory)
// -- same real data as before, only the presentation is now shared rather
// than a Principal-specific plain table. That real data source has no
// separate ON_DUTY status or punch-in/out times (only CHECK_IN/ABSENT plus
// a single occurredAt timestamp), so those are mapped as faithfully as the
// real shape allows: CHECK_IN -> PRESENT for the month-grid's coloring, and
// occurredAt's time-of-day stands in for the punch line.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getMyAttendanceHistory } from "@/lib/principal-staff-api";
import { MyAttendanceView, type MyAttendanceDay } from "@/components/shared-ui/MyAttendanceView";

function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PrincipalMyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const selectedMonth = month || thisMonth();
  const [y, m] = selectedMonth.split("-").map(Number);

  let monthlySummary: Awaited<ReturnType<typeof getMyAttendanceHistory>>["monthlySummary"];
  let days: Awaited<ReturnType<typeof getMyAttendanceHistory>>["days"];
  try {
    ({ monthlySummary, days } = await getMyAttendanceHistory(selectedMonth));
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your attendance. Nothing was changed — try again." />;
  }

  const viewDays: MyAttendanceDay[] = days.map((d) => {
    const time = new Date(d.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return {
      date: d.date,
      status: d.status === "CHECK_IN" ? "PRESENT" : "ABSENT",
      detailLine: d.status === "CHECK_IN" ? `${time} in` : d.reason ?? "Absent",
    };
  });

  const todayEntry = days.find((d) => d.date === new Date().toISOString().slice(0, 10));
  const todayLine = todayEntry
    ? todayEntry.status === "CHECK_IN"
      ? `PRESENT · ${new Date(todayEntry.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
      : `ABSENT${todayEntry.reason ? ` · ${todayEntry.reason}` : ""}`
    : "No event recorded yet today.";

  const absentCount = monthlySummary.totalCount - monthlySummary.presentCount;

  return (
    <MyAttendanceView
      basePath="/principal/my-attendance"
      subtitle="Your real check-in history — read-only"
      year={y}
      month={m - 1}
      statTiles={[
        { label: "Attendance rate", value: monthlySummary.percentage !== null ? `${monthlySummary.percentage}%` : "--" },
        { label: "Present", value: String(monthlySummary.presentCount) },
        { label: "Absent", value: String(Math.max(0, absentCount)) },
        { label: "Marked days", value: String(monthlySummary.totalCount) },
      ]}
      todayLine={todayLine}
      days={viewDays}
    />
  );
}
