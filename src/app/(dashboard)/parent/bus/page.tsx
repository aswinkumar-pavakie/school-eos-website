// Parent Bus -- display-only allocation for the selected child: route,
// vehicle, driver/attendant contact (a plain tel: link, the web's own
// equivalent of a phone dialer button), the child's own stop + scheduled
// time, and the full route's stop list. No GPS/live tracking exists in the
// backend -- nothing here is fabricated beyond what
// /parent/students/:id/bus actually returns.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getBusAllocation, listChildren, resolveSelectedChild } from "@/lib/parent-api";

const DIRECTION_LABELS: Record<string, string> = {
  PICKUP: "Pickup",
  DROP: "Drop",
  BOTH: "Pickup & drop",
};

function time(value: string | null): string {
  return value ? value.slice(0, 5) : "—";
}

export default async function ParentBusPage({
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

    const allocation = await getBusAllocation(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">My Bus</h1>
            <p className="mt-1 text-sm text-text-muted">Transport allocation for {selected.studentName}.</p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {!allocation ? (
          <div className="mt-6">
            <EmptyState title="No transport allocated" body="This student does not use school transport." />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Route</p>
                <p className="mt-1 text-sm font-bold text-text">
                  {allocation.routeName}
                  {allocation.routeCode ? ` (${allocation.routeCode})` : ""}
                </p>
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-xs font-bold tracking-wide text-text-muted uppercase">
                    {DIRECTION_LABELS[allocation.direction] ?? allocation.direction}
                  </p>
                  <p className="mt-1 text-sm text-text">{allocation.stopName}</p>
                  <p className="mt-1 text-xs text-text-muted">Scheduled: {time(allocation.scheduledTime)}</p>
                </div>
              </div>

              <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Vehicle</p>
                <p className="mt-1 text-sm font-bold text-text">
                  {allocation.registrationNo ?? "—"}
                  {allocation.model ? ` · ${allocation.model}` : ""}
                </p>
              </div>

              <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Contacts</p>
                <div className="mt-2 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{allocation.driverName ?? "Driver — not assigned"}</p>
                    {allocation.driverPhone ? (
                      <a href={`tel:${allocation.driverPhone}`} className="text-sm text-primary hover:underline">
                        {allocation.driverPhone}
                      </a>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{allocation.attendantName ?? "Attendant — not assigned"}</p>
                    {allocation.attendantPhone ? (
                      <a href={`tel:${allocation.attendantPhone}`} className="text-sm text-primary hover:underline">
                        {allocation.attendantPhone}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Route stops</h2>
              <ul className="mt-3 flex flex-col divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
                {allocation.stops
                  .slice()
                  .sort((a, b) => a.sequenceNo - b.sequenceNo)
                  .map((stop) => {
                    const isOwnStop = stop.stopName === allocation.stopName;
                    return (
                      <li
                        key={stop.sequenceNo}
                        className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${isOwnStop ? "bg-field" : ""}`}
                      >
                        <span className={isOwnStop ? "font-bold text-text" : "text-text"}>
                          {stop.sequenceNo}. {stop.stopName}
                          {isOwnStop ? " · this student's stop" : ""}
                        </span>
                        <span className="font-mono text-xs text-text-muted">{time(stop.scheduledTime)}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load bus details. Nothing was changed — try again." />;
  }
}
