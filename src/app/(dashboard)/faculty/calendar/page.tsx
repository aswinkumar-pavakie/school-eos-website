import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getFacultyCalendar } from "@/lib/faculty-academics-api";

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
  PRE_PRIMARY: "Pre-Primary", PRIMARY: "Primary", MIDDLE: "Middle", SECONDARY: "Secondary", HIGHER_SECONDARY: "Higher Secondary",
};

export default async function CalendarPage() {
  try {
    const { events, academicYear } = await getFacultyCalendar();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Academic Calendar</h1>
          <p className="mt-1 text-sm text-text-muted">
            School-wide events, plus every event for a stage you teach or advise in.
            {academicYear ? ` · ${academicYear.name} (${formatDate(academicYear.startDate)} – ${formatDate(academicYear.endDate)})` : ""}
          </p>
        </div>

        {events.length === 0 ? (
          <EmptyState title="No events" body="Nothing is on the calendar yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-bold text-text">{e.title}</p>
                  <p className="text-xs text-text-muted">
                    {formatDate(e.startDate)}{e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ""}
                    {e.scopeType === "STAGE" && e.scopeStage ? ` · ${STAGE_LABELS[e.scopeStage] ?? e.scopeStage}` : " · School-wide"}
                  </p>
                  {e.description ? <p className="mt-1 text-sm text-text">{e.description}</p> : null}
                </div>
                <span className={`shrink-0 rounded-[7px] px-2 py-0.5 text-xs font-bold uppercase ${EVENT_TONE[e.eventType] ?? EVENT_TONE.OTHER}`}>
                  {e.eventType.replace(/_/g, " ")}
                </span>
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
