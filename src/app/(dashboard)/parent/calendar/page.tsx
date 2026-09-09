import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getCalendar, listChildren, resolveSelectedChild, type CalendarEvent } from "@/lib/parent-api";

const EVENT_TONE: Record<string, string> = {
  HOLIDAY: "bg-critical-bg text-critical-text",
  PTM: "bg-pending-bg text-pending-text",
  EXAM_WINDOW: "bg-pending-bg text-pending-text",
  TERM_START: "bg-success-bg text-success-text",
  TERM_END: "bg-success-bg text-success-text",
  FUNCTION: "bg-field text-text-muted",
  COMPETITION: "bg-field text-text-muted",
  WORKING_SATURDAY: "bg-field text-text-muted",
  OTHER: "bg-field text-text-muted",
};
const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-Primary",
  PRIMARY: "Primary",
  MIDDLE: "Middle",
  SECONDARY: "Secondary",
  HIGHER_SECONDARY: "Higher Secondary",
};

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, mon] = key.split("-").map(Number);
  const date = new Date(year!, mon! - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default async function ParentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const events = await getCalendar(selected.studentId);
    const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

    const groups = new Map<string, CalendarEvent[]>();
    for (const event of sorted) {
      const key = monthKey(event.startDate);
      const list = groups.get(key);
      if (list) list.push(event);
      else groups.set(key, [event]);
    }

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Calendar</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {sorted.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No events yet" body="No calendar events have been published yet." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {[...groups.entries()].map(([key, monthEvents]) => (
              <div key={key}>
                <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-text-muted">{monthLabel(key)}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {monthEvents.map((event) => (
                    <li
                      key={event.id}
                      className={`rounded-[var(--radius-card)] border border-border border-l-4 bg-surface p-4 ${
                        event.isHoliday ? "border-l-critical-text" : "border-l-primary"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text">{event.title}</p>
                          <p className="mt-1 text-xs text-text-muted">
                            {formatDate(event.startDate)}
                            {event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}
                            {event.scopeType === "STAGE" && event.scopeStage
                              ? ` · ${STAGE_LABELS[event.scopeStage] ?? event.scopeStage}`
                              : " · School-wide"}
                          </p>
                          {event.description ? <p className="mt-2 text-sm text-text">{event.description}</p> : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-[7px] px-2 py-0.5 text-xs font-bold uppercase ${
                            event.isHoliday ? "bg-critical-bg text-critical-text" : (EVENT_TONE[event.eventType] ?? EVENT_TONE.OTHER)
                          }`}
                        >
                          {event.isHoliday ? "Holiday" : event.eventType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the calendar. Nothing was changed — try again." />;
  }
}
