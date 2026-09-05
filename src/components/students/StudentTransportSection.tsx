// Real transport info for this specific student -- resolved server-side (route,
// stop, current vehicle + driver) from GET /students/:id/transport. If this
// student isn't using school transport, commuteMode (real data now -- see
// query.md for the migration) shows how they actually get to school instead of
// just saying "not using school transport" with no further detail.

interface TransportAllocation {
  id: string;
  direction: string;
  feeSlab: string | null;
  validFrom: string;
  status: string;
  stopName: string;
  routeName: string;
  vehicleRegistrationNo: string | null;
  driverName: string | null;
}

const COMMUTE_MODE_LABELS: Record<string, string> = {
  WALK: "Walks to school",
  PARENT_DROP: "Dropped off by parent",
  PRIVATE_VEHICLE: "Private vehicle",
  PUBLIC_TRANSPORT: "Public transport",
  OTHER: "Other",
};

export function StudentTransportSection({
  usesSchoolTransport,
  commuteMode,
  allocations,
}: {
  usesSchoolTransport: boolean;
  commuteMode: string | null;
  allocations: TransportAllocation[];
}) {
  const active = allocations.filter((a) => a.status === "ACTIVE");

  if (!usesSchoolTransport && active.length === 0) {
    return (
      <p className="mt-3 text-sm text-text-muted">
        Not using school transport
        {commuteMode ? ` — ${COMMUTE_MODE_LABELS[commuteMode] ?? commuteMode}` : " (commute mode not recorded)"}.
      </p>
    );
  }

  if (active.length === 0) {
    return (
      <p className="mt-3 text-sm text-text-muted">
        Marked as using school transport, but no active route allocation is on file yet.
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col divide-y divide-border">
      {active.map((a) => (
        <li key={a.id} className="py-3">
          <p className="text-[13.5px] font-semibold text-text">
            {a.routeName} · {a.stopName}
            <span className="ml-2 text-xs font-normal text-text-muted">{a.direction.replace(/_/g, " ").toLowerCase()}</span>
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {a.vehicleRegistrationNo ? `Vehicle ${a.vehicleRegistrationNo}` : "No vehicle currently assigned to this route"}
            {a.driverName ? ` · Driver ${a.driverName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
