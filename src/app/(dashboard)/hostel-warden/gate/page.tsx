// Check-in / check-out -- the design's own gate register, mapped to the real
// backend's Night Attendance feature: the only real "is this student in the
// hostel tonight" check that exists (see hostel-warden-api.ts's own header
// comment -- there is no separate check-in/check-out event anywhere in the
// schema; the roll call itself is the real check).

import { ErrorState } from "@/components/ui/EmptyState";
import { getNightAttendanceRoster } from "@/lib/hostel-warden-api";
import { nowMs, todayIsoDate } from "@/lib/hostel-warden-time";
import { NightRosterMarker } from "./NightRosterMarker";

export default async function GatePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || todayIsoDate(nowMs());

  try {
    const roster = await getNightAttendanceRoster(date);
    const present = roster.filter((r) => r.status === "PRESENT").length;
    const absent = roster.filter((r) => r.status === "ABSENT").length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <form style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--hw-text-muted)" }}>
            Date
            <input className="input" type="date" name="date" defaultValue={date} style={{ height: 34, width: 160 }} />
          </label>
          <button type="submit" className="hw-btn-secondary" style={{ height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid var(--hw-border-input)", background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--hw-text-muted)" }}>
            {present} present · {absent} absent · {roster.length} on roll
          </span>
        </form>

        <NightRosterMarker date={date} roster={roster} />
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the night roll call."} />;
  }
}
