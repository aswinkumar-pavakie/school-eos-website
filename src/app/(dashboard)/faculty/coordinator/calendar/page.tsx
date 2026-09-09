import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getCoordinatorMe, listCoordinatorCalendarEvents } from "@/lib/faculty-coordinator-api";
import { EventModal } from "./EventModal";
import { deleteCalendarEventAction } from "../actions";

const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-Primary", PRIMARY: "Primary", MIDDLE: "Middle", SECONDARY: "Secondary", HIGHER_SECONDARY: "Higher Secondary",
};

export default async function CoordinatorCalendarPage() {
  try {
    const [me, events] = await Promise.all([getCoordinatorMe(), listCoordinatorCalendarEvents()]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/faculty/coordinator" className="text-xs font-semibold text-text-muted hover:text-text">← Coordinator</Link>
            <h1 className="mt-1 text-2xl font-extrabold text-text">Academic Calendar</h1>
            <p className="mt-1 text-sm text-text-muted">Create, edit or delete a stage-scoped event — it appears instantly in every relevant faculty member&apos;s own Calendar tab.</p>
          </div>
          <EventModal stages={me.stages} />
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
                    {formatDate(e.startDate)}{e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ""} · {e.eventType.replace(/_/g, " ")}
                    {e.scopeType === "STAGE" && e.scopeStage ? ` · ${STAGE_LABELS[e.scopeStage] ?? e.scopeStage}` : " · School-wide"}
                  </p>
                </div>
                {e.scopeType === "STAGE" ? (
                  <div className="flex shrink-0 gap-2">
                    <EventModal stages={me.stages} event={e} />
                    <form action={deleteCalendarEventAction.bind(null, e.id)}>
                      <PlainButton type="submit" variant="danger">Delete</PlainButton>
                    </form>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-[7px] bg-field px-2 py-0.5 text-xs font-bold text-text-muted">School-wide</span>
                )}
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
