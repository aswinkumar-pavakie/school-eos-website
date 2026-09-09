import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getFacultyBus } from "@/lib/faculty-academics-api";

export default async function BusPage() {
  try {
    const assignment = await getFacultyBus();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">My Bus</h1>
          <p className="mt-1 text-sm text-text-muted">Real vehicle and route details, if you are assigned as a driver or attendant.</p>
        </div>

        {!assignment ? (
          <EmptyState title="Not currently assigned" body="You are not assigned to a bus as a driver or attendant." />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">{assignment.registrationNo}</p>
              <span className="rounded-[7px] bg-field px-2 py-0.5 text-xs font-bold uppercase text-text-muted">{assignment.role}</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {assignment.model ?? "Vehicle"} · Capacity {assignment.capacity}
            </p>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm font-bold text-text">{assignment.routeName}{assignment.routeCode ? ` (${assignment.routeCode})` : ""}</p>
              <p className="text-xs text-text-muted">{assignment.direction}</p>
            </div>

            {assignment.stops.length > 0 ? (
              <ol className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
                {assignment.stops
                  .sort((a, b) => a.sequenceNo - b.sequenceNo)
                  .map((s) => (
                    <li key={s.sequenceNo} className="flex items-center justify-between text-sm">
                      <span className="text-text">{s.sequenceNo}. {s.stopName}</span>
                      {s.scheduledTime ? <span className="font-mono text-xs text-text-muted">{s.scheduledTime.slice(0, 5)}</span> : null}
                    </li>
                  ))}
              </ol>
            ) : null}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your bus assignment. Nothing was changed — try again." />;
  }
}
