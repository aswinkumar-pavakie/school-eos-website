// Shared Hostel oversight view -- Admin/Principal/Vice Principal all render the
// exact same real hostel data (structure counts, roll call, gate passes/
// emergency exits, complaints), the same pattern LibraryOverviewView.tsx and
// TransportOversightRoutesList.tsx already use for their own modules. Pixel-
// matched against Principal Console.dc.html's own hostelPage() (line
// ~1771-1814), checked against the literal inline data shape, not inferred:
//
//   REAL, wired in: present-in-hostel / roll-call (hostel_attendance, tonight's
//   date), beds occupied + bed occupancy by block + "Blocks & wardens" table
//   (hostel_block -> floor -> room -> bed -> hostel_allocation aggregate, plus
//   each block's HOSTEL-level warden via hostel.warden_staff_id -- the real
//   schema has no block-level warden), "out of the hostel now" + "students out
//   of the hostel" (outing_request, Gate Pass + Emergency Exit together, real
//   state machine has no explicit "returned" flag so "overdue" is inferred from
//   expected_return < now -- see backend's own comment), "gate log" (each
//   request's real approval_request.decided_at -- the closest honest substitute
//   for a check-in/exit event feed, since no separate gate-event log table
//   exists), open complaints (complaint table).
//
//   NOT TRACKED, honestly omitted rather than fabricated: "Hostel fees" table
//   and "Fee defaulters" KPI (no HOSTEL fee_head row exists in the real schema
//   at all -- checked live, fee_head.head_type only has OTHER/TUITION/EXAM/
//   TRANSPORT/ID_CARD, and building a whole hostel fee subsystem is out of
//   scope for this pass, same call as Transport's own "Term fee"/"Safety &
//   fitment"), "Mess feedback" (no mess/feedback table anywhere in the schema),
//   room "sharing" type (hostel_room.room_type is real but almost entirely
//   null/DORM in the seeded data, not a Double/Triple label the fees table
//   could honestly use anyway since there's no fee data to pair it with).

import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate, formatDateTime } from "@/lib/format";

export interface HostelRosterEntry {
  studentId: string;
  status: string | null;
}

export interface HostelBlockOversight {
  id: string;
  name: string;
  hostelId: string;
  hostelName: string;
  roomCount: number;
  capacity: number;
  occupied: number;
  wardenFirstName: string | null;
  wardenLastName: string | null;
}

export interface HostelOutingEntry {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  outFrom: string;
  expectedReturn: string;
  reason: string;
  destination: string | null;
  state: string;
  requestType: string | null;
  decidedAt: string | null;
}

export interface HostelComplaintEntry {
  id: string;
  issueType: string;
  subject: string;
  state: string;
  createdAt: string;
}

function outingKindLabel(requestType: string | null): string {
  if (requestType === "HOSTEL_GATE_PASS_REQUEST") return "on pass";
  if (requestType === "HOSTEL_EMERGENCY_EXIT_REQUEST") return "on leave";
  return "out";
}

function isOverdue(entry: HostelOutingEntry, now: number): boolean {
  return new Date(entry.expectedReturn).getTime() < now;
}

export function HostelOverview({
  allocationsOnRoll,
  roster,
  rollCallDate,
  blocks,
  activeOutings,
  recentDecisions,
  complaints,
}: {
  /** Count of ACTIVE hostel_allocation rows -- the real "665 on roll" denominator. */
  allocationsOnRoll: number;
  /** Tonight's hostel_attendance roster (present/absent/on-leave/etc, or unmarked). */
  roster: HostelRosterEntry[];
  rollCallDate: string;
  blocks: HostelBlockOversight[];
  /** Real outing_request rows (Gate Pass + Emergency Exit) currently out or
   * overdue in the last 7 days -- see backend comment for why that window. */
  activeOutings: HostelOutingEntry[];
  /** Real, recently-decided Gate Pass/Emergency Exit requests -- the closest
   * honest substitute for a gate-event log (see this file's own top comment). */
  recentDecisions: HostelOutingEntry[];
  complaints: HostelComplaintEntry[];
}) {
  const dateLabel = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const now = Date.now();

  const presentCount = roster.filter((r) => r.status === "PRESENT").length;
  const markedCount = roster.filter((r) => r.status !== null).length;
  const rollCallPct = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;
  const unaccounted = markedCount > 0 ? markedCount - presentCount : 0;

  const totalCapacity = blocks.reduce((sum, b) => sum + b.capacity, 0);
  const totalOccupied = blocks.reduce((sum, b) => sum + b.occupied, 0);
  const totalVacant = totalCapacity - totalOccupied;
  const occupiedPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const overdueOutings = activeOutings.filter((o) => isOverdue(o, now));
  const outNowOutings = activeOutings.filter((o) => !isOverdue(o, now));
  const openComplaints = complaints.filter(
    (c) => c.state !== "CLOSED" && c.state !== "RESOLVED" && c.state !== "REJECTED",
  );
  const openComplaintsPct =
    complaints.length > 0 ? Math.round((openComplaints.length / complaints.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1180px]">
      <div>
        <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Hostel</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          School overview of the hostel module · {allocationsOnRoll} students on roll · {dateLabel}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          eyebrow="Present in hostel"
          value={`${presentCount} / ${allocationsOnRoll}`}
          detail={
            markedCount > 0
              ? [`${rollCallPct}% of tonight's marked roll call`, `${allocationsOnRoll - markedCount} not yet marked`]
              : ["Tonight's roll call not marked yet", `of ${allocationsOnRoll} on roll`]
          }
          pctBadge={allocationsOnRoll > 0 ? `${Math.round((presentCount / allocationsOnRoll) * 100)}%` : undefined}
          bar={allocationsOnRoll > 0 ? Math.round((presentCount / allocationsOnRoll) * 100) : undefined}
        />
        <KpiCard
          eyebrow="Beds occupied"
          value={`${totalOccupied} / ${totalCapacity}`}
          detail={[`${occupiedPct}% of the beds taken`, `${totalVacant} beds vacant`]}
          pctBadge={totalCapacity > 0 ? `${occupiedPct}%` : undefined}
          bar={totalCapacity > 0 ? occupiedPct : undefined}
        />
        <KpiCard
          eyebrow="Roll-call attendance"
          value={markedCount > 0 ? `${rollCallPct}%` : "—"}
          detail={
            markedCount > 0
              ? [`${formatDate(rollCallDate)} roll call`, `${unaccounted} unaccounted of ${markedCount} marked`]
              : ["No roll call marked for this date yet", ""]
          }
          pctBadge={markedCount > 0 ? `${rollCallPct}%` : undefined}
          bar={markedCount > 0 ? rollCallPct : undefined}
        />
        <KpiCard
          eyebrow="Out of the hostel now"
          value={String(outNowOutings.length)}
          detail={[
            "On an approved gate pass or emergency exit",
            `${overdueOutings.length} past the return time`,
          ]}
        />
        <KpiCard eyebrow="Fee defaulters" value="Not tracked" detail="No hostel fee head set up in Finance yet" />
        <KpiCard
          eyebrow="Open complaints"
          value={String(openComplaints.length)}
          detail={[`of ${complaints.length} raised`, "Room, mess and electrical issues"]}
          pctBadge={complaints.length > 0 ? `${openComplaintsPct}%` : undefined}
          bar={complaints.length > 0 ? openComplaintsPct : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-surface p-5">
          <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Bed occupancy by block</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
            Beds occupied out of each block&apos;s capacity
          </p>
          <div className="mt-4 flex flex-col gap-3.5">
            {blocks.length === 0 && <p className="py-7 text-[15px] text-text-muted">No blocks set up yet.</p>}
            {blocks.map((b) => {
              const pct = b.capacity > 0 ? Math.round((b.occupied / b.capacity) * 100) : 0;
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span className="font-semibold text-text">
                      {b.hostelName} · {b.name}
                    </span>
                    <span className="text-text-muted">
                      {b.occupied} / {b.capacity}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-[var(--radius-pill)]"
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "var(--color-primary)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-5">
          <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Gate log</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
            Latest gate pass and emergency exit decisions
          </p>
          <div className="mt-2 flex flex-col">
            {recentDecisions.length === 0 && (
              <p className="py-7 text-[15px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                No gate pass or emergency exit decisions recorded yet.
              </p>
            )}
            {recentDecisions.map((d) => (
              <div key={d.id} className="card-hover flex items-center justify-between gap-[18px] rounded-[12px] border-t border-[#eef1f6] px-2 py-[15px]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-text">
                    {d.studentFirstName} {d.studentLastName ?? ""} · {d.reason}
                  </p>
                  <p className="truncate text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    {d.decidedAt ? formatDateTime(d.decidedAt) : "—"}
                  </p>
                </div>
                <StatusPill
                  tone={d.state === "APPROVED" ? "success" : "critical"}
                  label={d.state === "APPROVED" ? outingKindLabel(d.requestType) : "rejected"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-5">
        <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Blocks &amp; wardens</h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
          Rooms, capacity and occupancy for each block on the register
        </p>
        {blocks.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No blocks set up yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                  <th className="px-3 py-2.5">Block</th>
                  <th className="px-3 py-2.5">Hostel</th>
                  <th className="px-3 py-2.5">Rooms</th>
                  <th className="px-3 py-2.5">Capacity</th>
                  <th className="px-3 py-2.5">Occupied</th>
                  <th className="px-3 py-2.5">Vacant</th>
                  <th className="px-3 py-2.5">Occupancy</th>
                  <th className="px-3 py-2.5">Warden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.map((b) => {
                  const pct = b.capacity > 0 ? Math.round((b.occupied / b.capacity) * 100) : 0;
                  const wardenName =
                    b.wardenFirstName ? `${b.wardenFirstName} ${b.wardenLastName ?? ""}`.trim() : "—";
                  return (
                    <tr key={b.id}>
                      <td className="px-3 py-2.5 font-semibold text-text">{b.name}</td>
                      <td className="px-3 py-2.5 text-text-muted">{b.hostelName}</td>
                      <td className="px-3 py-2.5 text-text-muted">{b.roomCount}</td>
                      <td className="px-3 py-2.5 text-text-muted">{b.capacity}</td>
                      <td className="px-3 py-2.5 text-text-muted">{b.occupied}</td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-primary">{b.capacity - b.occupied}</td>
                      <td className="px-3 py-2.5 font-semibold text-text">{pct}%</td>
                      <td className="px-3 py-2.5 text-text-muted">{wardenName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-5">
        <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Hostel fees</h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
          Room and mess dues for 2026–27 and how each invoice stands
        </p>
        <p className="mt-4 text-sm text-text-muted">
          Not tracked yet — no HOSTEL fee head exists in Finance for this module, so there is no real room/mess
          invoice data to show.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-surface p-5">
          <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Students out of the hostel</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
            {activeOutings.length} out now or recently due back · {overdueOutings.length} past the return time
          </p>
          <div className="mt-2 flex flex-col">
            {activeOutings.length === 0 && (
              <p className="py-7 text-[15px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                Nobody currently out of the hostel.
              </p>
            )}
            {activeOutings.map((o) => (
              <div key={o.id} className="card-hover flex items-center justify-between gap-[18px] rounded-[12px] border-t border-[#eef1f6] px-2 py-[15px]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-text">
                    {o.studentFirstName} {o.studentLastName ?? ""}
                  </p>
                  <p className="truncate text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    {o.reason} · back by {formatDateTime(o.expectedReturn)}
                  </p>
                </div>
                <StatusPill
                  tone={isOverdue(o, now) ? "critical" : "pending"}
                  label={isOverdue(o, now) ? "overdue" : outingKindLabel(o.requestType)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-5">
          <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Needs attention</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
            Real counts from the hostel module, at a glance
          </p>
          <div className="mt-2 flex flex-col">
            {[
              ["Overdue returns", `${overdueOutings.length} students · past their expected return`],
              ["Unaccounted at roll call", markedCount > 0 ? `${unaccounted} students · not marked present` : "Tonight's roll call not marked yet"],
              ["Fee defaulters", "Not tracked yet"],
              ["Beds vacant", `${totalVacant} · ready to allot`],
              ["Open complaints", `${openComplaints.length} of ${complaints.length} raised`],
              ["Mess feedback", "Not tracked yet"],
            ].map(([label, value]) => (
              <div key={label} className="card-hover flex items-center justify-between gap-[18px] rounded-[12px] border-t border-[#eef1f6] px-2 py-[15px]">
                <p className="text-[15px] font-semibold text-text">{label}</p>
                <p className="text-right text-[13px] text-text-muted">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
