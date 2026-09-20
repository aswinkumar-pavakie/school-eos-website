// Sports Admin -> School calendar -- pixel-rebuilt from the design's own
// `calendar` screen (isCalendar: true): month grid + "Events in {month}"
// list, day/dow badge + title/meta + a kind badge per event. Month
// navigation via ?month=YYYY-MM (a real server-rendered page, no client
// state needed for prev/next -- same query-string-driven pattern as the
// Teams status filter).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, toneOf } from "@/components/sports-ui/primitives";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listCalendarEvents } from "@/lib/sports-admin-api";
import { AddEventPanel } from "./AddEventPanel";
import { EventActions } from "./EventActions";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EVENT_TONE: Record<string, "info" | "good" | "warn"> = {
  COMPETITION: "warn",
  FUNCTION: "good",
  OTHER: "info",
  HOLIDAY: "info",
  TERM_START: "info",
  TERM_END: "info",
  EXAM_WINDOW: "info",
  PTM: "info",
  WORKING_SATURDAY: "info",
};

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default async function SportsAdminCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  try {
    const now = new Date();
    const [y, m] = monthParam ? monthParam.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const year = y || now.getFullYear();
    const month = (m || now.getMonth() + 1) - 1; // 0-indexed

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const prevMonth = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month + 1, 1);

    const [events, actor] = await Promise.all([
      listCalendarEvents({
        fromDate: monthStart.toISOString().slice(0, 10),
        toDate: monthEnd.toISOString().slice(0, 10),
      }),
      getCurrentActor(),
    ]);
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const eventDays = new Set(sorted.map((e) => new Date(e.startDate).getDate()));

    const firstWeekday = (monthStart.getDay() + 6) % 7; // Monday-first
    const daysInMonth = monthEnd.getDate();
    const cells: { label: string; hasEvent: boolean }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ label: "", hasEvent: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ label: String(d), hasEvent: eventDays.has(d) });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Calendar</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Fixtures, trials, meets and PT camps</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <AddEventPanel />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 16, marginTop: 24 }}>
          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "24px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <Link href={`/sports-admin/calendar?month=${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`} style={{ width: 36, height: 36, border: "1px solid var(--sport-border)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sport-body-muted)", textDecoration: "none" }}>‹</Link>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: "var(--sport-heading)" }}>{monthLabel(year, month)}</div>
                <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{events.length} sports events</div>
              </div>
              <Link href={`/sports-admin/calendar?month=${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`} style={{ width: 36, height: 36, border: "1px solid var(--sport-border)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sport-body-muted)", textDecoration: "none" }}>›</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {DAY_NAMES.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--sport-tertiary-3)", paddingBottom: 6 }}>{d}</div>
              ))}
              {cells.map((c, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: c.hasEvent ? 700 : 500,
                    color: c.label === "" ? "transparent" : c.hasEvent ? "#fff" : "var(--sport-ink)",
                    background: c.hasEvent ? "var(--sport-primary)" : "transparent",
                  }}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 800, color: "var(--sport-heading)" }}>Events in {monthLabel(year, month).split(" ")[0]}</h2>
            {sorted.length === 0 ? (
              <EmptyPanel label="No events this month." />
            ) : (
              sorted.map((e) => {
                const d = new Date(e.startDate);
                const mine = e.createdBy === actor.personId;
                return (
                  <div key={e.id} style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", border: "1px solid var(--sport-border-soft)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ width: 52, textAlign: "center" }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--sport-heading)", lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "var(--sport-tertiary-3)" }}>{d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sport-ink)" }}>{e.title}</div>
                      <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>{e.description ?? "—"}</div>
                    </div>
                    <StatusPill label={e.eventType.replace(/_/g, " ")} tone={EVENT_TONE[e.eventType] ?? toneOf(e.eventType)} />
                    {mine ? <EventActions event={e} /> : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the calendar."} />;
  }
}
