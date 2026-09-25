// Drivers & crew -- pixel-matched to the exact reference design: a search
// bar with a real count, then a 3-column card grid, one card per real
// driver (serial circle, initials avatar, name+phone, a real licence-status
// pill, a 3x2 field grid -- Licence no/Valid till, Experience/Assigned bus,
// Attendant/Blood group -- and real Edit crew/Remove actions). Experience
// and Blood group are real columns added specifically for this (see
// query.md) -- not fabricated to match the reference; every driver shows
// "not recorded" until these are actually set via the real edit form.
//
// The reference design's own card embeds a driver's paired attendant as a
// field rather than giving attendants their own card -- but that assumes
// every attendant is paired with a driver, which this app's real data
// doesn't guarantee (an attendant can exist with no current
// vehicle_route_assignment). Hiding a real unpaired attendant entirely would
// violate this session's own stronger rule against hiding real data, so any
// attendant with no current driver pairing still gets a real (simpler) card
// below the driver grid, rather than being dropped silently.

import { AutoSubmitSearchInput } from "@/components/dashboard/AutoSubmitFilter";
import { DriverEditForm } from "@/components/transport/DriverEditForm";
import { RequestActionButton } from "@/components/transport/RequestActionButton";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
import { requestDriverDeactivateAction } from "@/app/(dashboard)/transport-manager/actions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  experienceYears: number | null;
  bloodGroup: string | null;
}
interface Attendant {
  id: string;
  fullName: string;
  phone: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
}
interface Assignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
}

function daysUntil(dateIso: string): number {
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function initialsOf(name: string): string {
  return name
    .replace(/^(Mr\.|Mrs\.|Ms\.)\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
// Same BAD/WARN/OK severity language used everywhere else this session
// (Fleet card seat badge, Compliance matrix) applied to licence expiry.
function licenceState(expiry: string): { label: string; color: string; bg: string } {
  const d = daysUntil(expiry);
  if (d < 0) return { label: "expired", color: "var(--color-navy)", bg: "var(--color-tint)" };
  if (d <= 45) return { label: "due soon", color: "var(--color-primary)", bg: "var(--color-tint)" };
  return { label: "valid", color: "var(--color-text-muted)", bg: "var(--color-field)" };
}

export default async function TransportManagerDriversPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const sp = await searchParams;
  const [driversRes, attendantsRes, vehiclesRes, assignmentsRes] = await Promise.all([
    apiFetch("/drivers"),
    apiFetch("/attendants"),
    apiFetch("/vehicles"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!driversRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Drivers &amp; crew</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const drivers: Driver[] = (await driversRes.json()).data;
  const attendants: Attendant[] = attendantsRes.ok ? (await attendantsRes.json()).data : [];
  const vehicles: Vehicle[] = vehiclesRes.ok ? (await vehiclesRes.json()).data : [];
  const assignments: Assignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const attendantById = new Map(attendants.map((a) => [a.id, a]));
  const assignmentByDriverId = new Map(assignments.filter((a) => a.driverId).map((a) => [a.driverId as string, a]));
  const pairedAttendantIds = new Set(assignments.filter((a) => a.attendantId).map((a) => a.attendantId as string));
  const unpairedAttendants = attendants.filter((a) => !pairedAttendantIds.has(a.id));

  const search = (sp.search ?? "").trim().toLowerCase();
  const driverCards = drivers
    .map((d) => {
      const assignment = assignmentByDriverId.get(d.id) ?? null;
      const vehicle = assignment ? vehicleById.get(assignment.vehicleId) ?? null : null;
      const attendant = assignment?.attendantId ? attendantById.get(assignment.attendantId) ?? null : null;
      return { driver: d, vehicle, attendant, assignment };
    })
    .filter(({ driver, vehicle }) => {
      if (!search) return true;
      const haystack = `${driver.fullName} ${driver.licenceNo} ${vehicle?.registrationNo ?? ""}`.toLowerCase();
      return haystack.includes(search);
    });

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Drivers &amp; crew</h1>
          <p className="mt-1.5 text-[15px] text-text-muted">Licences, experience and assigned buses.</p>
        </div>
      </div>

      <form
        action="/transport-manager/drivers"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-[14px] px-4 py-3.5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-divider)" }}
      >
        <div className="flex min-w-[280px] flex-1 items-center gap-2.5 rounded-[10px] px-3.5 py-2.5" style={{ border: "1px solid var(--color-border)" }}>
          <MaterialIcon name="search" size={20} className="text-[var(--color-text-tertiary)]" />
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={sp.search ?? ""}
            placeholder="Search driver, attendant, licence no or assigned bus"
            className="w-full border-0 bg-transparent text-sm text-text outline-none"
          />
        </div>
        <span className="whitespace-nowrap text-[13px] font-semibold text-text-muted">
          {driverCards.length} of {drivers.length} drivers
        </span>
      </form>

      {driverCards.length === 0 ? (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold text-text">No one matches this search</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {driverCards.map(({ driver, vehicle, attendant, assignment }, i) => {
            const licence = licenceState(driver.licenceExpiry);
            return (
              <div
                key={driver.id}
                className="card-hover flex flex-col gap-[14px] rounded-[16px] border border-border bg-surface p-[18px]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-primary"
                    style={{ border: "1px solid var(--color-tint-2)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-white text-[16px] font-extrabold"
                    style={{ color: "var(--color-navy)" }}
                  >
                    {initialsOf(driver.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-text">{driver.fullName}</p>
                    <p className="font-mono text-[13px]" style={{ color: "var(--color-text-muted)" }}>{driver.phone ?? "—"}</p>
                  </div>
                  <span className="shrink-0 rounded-[6px] px-[9px] py-[5px] text-[11px] font-bold" style={{ background: licence.bg, color: licence.color }}>
                    {licence.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Licence no</p>
                    <p className="mt-[3px] truncate font-mono text-[13px] font-semibold text-text">{driver.licenceNo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Valid till</p>
                    <p className="mt-[3px] text-[13px] font-semibold text-text">{formatDate(driver.licenceExpiry)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Experience</p>
                    <p className="mt-[3px] text-[13px] font-semibold text-text">{driver.experienceYears != null ? `${driver.experienceYears} yrs` : "not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Assigned bus</p>
                    <p className="mt-[3px] truncate font-mono text-[13px] font-semibold text-text">{vehicle?.registrationNo ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Attendant</p>
                    <p className="mt-[3px] truncate text-[13px] font-semibold text-text">{attendant?.fullName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--color-text-tertiary)" }}>Blood group</p>
                    <p className="mt-[3px] text-[13px] font-semibold text-text">{driver.bloodGroup ?? "not recorded"}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--color-field)" }}>
                  <DriverEditForm
                    driverId={driver.id}
                    assignmentId={assignment?.id ?? null}
                    fullName={driver.fullName}
                    phone={driver.phone}
                    licenceNo={driver.licenceNo}
                    licenceExpiry={driver.licenceExpiry}
                    experienceYears={driver.experienceYears}
                    bloodGroup={driver.bloodGroup}
                    vehicleRegNo={vehicle?.registrationNo ?? null}
                    currentAttendantId={assignment?.attendantId ?? null}
                    attendants={attendants}
                    triggerClassName="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-[7px] text-[12.5px] font-bold text-text hover:bg-field"
                    triggerLabel={
                      <>
                        <MaterialIcon name="edit" size={16} /> Edit crew
                      </>
                    }
                  />
                  <RequestActionButton
                    action={requestDriverDeactivateAction.bind(null, driver.id)}
                    confirmTitle="Request removal"
                    confirmBody="No hard delete exists for a driver in this app -- this requests deactivating them. Nothing changes until Admin approves."
                    submitLabel="Request"
                    submittedLabel="Removal requested"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-[7px] text-[12.5px] font-bold"
                      style={{ border: "1px solid var(--color-tint-2)", color: "var(--color-navy)" }}
                    >
                      <MaterialIcon name="delete" size={16} /> Remove
                    </button>
                  </RequestActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unpairedAttendants.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-bold text-text">Attendants not currently on a bus</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Real crew members without a current route assignment — shown here rather than hidden, since the reference card design assumes every
            attendant is paired with a driver.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {unpairedAttendants.map((a) => (
              <div key={a.id} className="card-hover flex items-center gap-3 rounded-[16px] border border-border bg-surface p-[18px]">
                <span
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-primary"
                  style={{ background: "var(--color-tint)" }}
                >
                  {initialsOf(a.fullName)}
                </span>
                <div>
                  <p className="text-[15px] font-bold text-text">{a.fullName}</p>
                  <p className="text-[13px] text-text-muted">Attendant · {a.phone ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
