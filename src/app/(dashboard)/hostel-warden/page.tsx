// Hostel Warden Dashboard -- pixel-rebuilt from the design's own "isDashboard"
// screen. Every figure is a real read against this warden's own scope (night
// attendance roster, gate-pass/emergency-exit requests, room/bed structure +
// allocations, complaints) -- nothing fabricated. Two real adaptations from
// the design, both because there is no "check-in"/"return" event anywhere in
// the real schema (only an approval decision): "out now"/"overdue" are
// derived from an approved request's own out-from/expected-return window,
// and the "Record return" action becomes a plain link into the Movement log
// rather than a warden-authored write.

import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  getNightAttendanceRoster,
  listComplaints,
  listEmergencyExitRequests,
  listGatePassRequests,
  listHostelStructure,
  listMovementLogEntries,
  listRoomAllocations,
} from "@/lib/hostel-warden-api";
import { nowMs, todayIsoDate } from "@/lib/hostel-warden-time";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, PrimaryButton, SecondaryButton } from "@/components/hostel-warden-ui/primitives";
import { DashboardStat } from "./DashboardStat";

function greeting(ms: number): string {
  const hour = new Date(ms).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ICON = {
  students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.9",
  check: "M20 6 9 17l-5-5",
  gate: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  rooms: "M3 3h18v18H3zM3 9h18M9 21V9",
};

export default async function HostelWardenDashboardPage() {
  try {
    const now = nowMs();
    const today = todayIsoDate(now);
    const nowIso = new Date(now).toISOString();

    const [roster, gatePasses, emergencyExits, directEntries, structure, allocations, complaints, personRes] = await Promise.all([
      getNightAttendanceRoster(today).catch(() => []),
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listMovementLogEntries(),
      listHostelStructure(),
      listRoomAllocations(),
      listComplaints().catch(() => []),
      apiFetch("/auth/me"),
    ]);

    const person = personRes.ok
      ? ((await personRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }).data.person
      : null;
    const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";

    const totalCapacity = structure.flatMap((b) => b.rooms).reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
    const totalOccupied = allocations.length;
    const bedsVacant = Math.max(0, totalCapacity - totalOccupied);
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    const rosterMarked = roster.filter((r) => r.status !== null);
    const presentCount = roster.filter((r) => r.status === "PRESENT").length;
    const rollCallPercent = roster.length > 0 ? Math.round((presentCount / roster.length) * 100) : 0;
    const unaccounted = roster.filter((r) => r.status === "ABSENT" && !r.hasApprovedLeaveToday).length;

    const roomByStudent = new Map<string, string>();
    for (const a of allocations) roomByStudent.set(a.studentId, `${a.roomNo} · ${a.blockName}`);

    const tagged = [
      ...gatePasses.map((r) => ({ ...r, kind: "gate-pass" as const })),
      ...emergencyExits.map((r) => ({ ...r, kind: "emergency-exit" as const })),
    ];
    const approved = tagged.filter((r) => r.state === "APPROVED");
    // Warden-recorded exits that were approved and have no return logged are
    // physically still away. Requested/rejected entries never left.
    const openDirect = directEntries.filter((r) => r.state === "APPROVED" && !r.actualReturnAt && r.outFrom <= nowIso);
    const outNow = [
      ...approved.filter((r) => r.outFrom <= nowIso && r.expectedReturn >= nowIso),
      ...openDirect.filter((r) => r.expectedReturn >= nowIso),
    ];
    const overdue = [
      ...approved.filter((r) => r.expectedReturn < nowIso),
      ...openDirect.filter((r) => r.expectedReturn < nowIso),
    ];
    // outing_request.state's real values are REQUESTED/APPROVED/REJECTED/
    // CANCELLED/COMPLETED (confirmed live) -- "REQUESTED" is the real
    // not-yet-decided state, not the generic approval_request "PENDING".
    const pendingCount = tagged.filter((r) => r.state === "REQUESTED").length;
    const complaintsOpen = complaints.filter((c) => c.state === "OPEN" || c.state === "IN_PROGRESS" || c.state === "ESCALATED").length;

    const todayGate = approved
      .filter((r) => r.outFrom.slice(0, 10) === today)
      .sort((a, b) => (a.outFrom < b.outFrom ? 1 : -1))
      .slice(0, 6);

    const attention: { title: string; note: string; href: string }[] = [];
    if (overdue.length > 0) attention.push({ title: `${overdue.length} pass${overdue.length === 1 ? "" : "es"} past the return time`, note: "Still shown as out -- follow up with the parent", href: "/hostel-warden/movement-log" });
    if (unaccounted > 0) attention.push({ title: `${unaccounted} student${unaccounted === 1 ? "" : "s"} unaccounted at roll call`, note: "Absent tonight with no approved leave on record", href: "/hostel-warden/night-attendance" });
    if (complaintsOpen > 0) attention.push({ title: `${complaintsOpen} complaint${complaintsOpen === 1 ? "" : "s"} open`, note: "Raised on the block round or by a student", href: "/hostel-warden/issues" });
    if (bedsVacant > 0) attention.push({ title: `${bedsVacant} bed${bedsVacant === 1 ? "" : "s"} vacant`, note: "Ready to allot this week", href: "/hostel-warden/rooms" });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ margin: 0, fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {greeting(now)}
              {personName ? `, ${personName}` : ""}
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: "var(--hw-text-muted)" }}>
              {new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {roster.length} students on the night roll
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/hostel-warden/night-attendance" style={{ textDecoration: "none" }}>
              <SecondaryButton type="button" style={{ height: 44, padding: "0 22px", fontSize: 14 }}>
                Night roll call
              </SecondaryButton>
            </Link>
            <Link href="/hostel-warden/movement-log" style={{ textDecoration: "none" }}>
              <PrimaryButton type="button" style={{ height: 44, padding: "0 22px", fontSize: 14 }}>
                Open movement log{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </PrimaryButton>
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
          <DashboardStat
            label="Present in hostel"
            value={String(presentCount)}
            deltaStrong={String(roster.length)}
            deltaText="students on roll"
            note={`${unaccounted} unaccounted tonight`}
            percent={rollCallPercent}
            d={ICON.students}
            href="/hostel-warden/night-attendance"
          />
          <DashboardStat
            label="Roll-call attendance"
            value={roster.length > 0 ? `${rollCallPercent}%` : "—"}
            deltaStrong={String(rosterMarked.length)}
            deltaText="marked so far"
            note="Tonight's roll call"
            percent={rollCallPercent}
            d={ICON.check}
            href="/hostel-warden/night-attendance"
          />
          <DashboardStat
            label="Out of the hostel now"
            value={String(outNow.length)}
            deltaStrong={String(overdue.length)}
            deltaText="past the return time"
            note="Based on each pass's approved window"
            percent={approved.length > 0 ? Math.round((outNow.length / approved.length) * 100) : 0}
            d={ICON.gate}
            href="/hostel-warden/movement-log"
          />
          <DashboardStat
            label="Beds occupied"
            value={totalCapacity > 0 ? `${occupancyPercent}%` : "—"}
            deltaStrong={String(bedsVacant)}
            deltaText="beds vacant"
            note={`${totalOccupied} of ${totalCapacity} beds taken`}
            percent={occupancyPercent}
            d={ICON.rooms}
            href="/hostel-warden/rooms"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
          <Card style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Students out of the hostel</h2>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--hw-accent-700)", background: "var(--hw-accent-100)", borderRadius: 99, padding: "6px 12px", whiteSpace: "nowrap" }}>
                {outNow.length} out now
              </span>
            </div>
            {outNow.slice(0, 5).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: "1px solid var(--hw-divider-soft)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{[r.studentFirstName, r.studentLastName].filter(Boolean).join(" ")}</span>
                  <span style={{ display: "block", fontSize: 13, color: "#8b95a1", marginTop: 3 }}>
                    {roomByStudent.get(r.studentId) ?? "—"} · back by {new Date(r.expectedReturn).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                </span>
              </div>
            ))}
            {outNow.length === 0 && <div style={{ padding: "28px 0 8px", fontSize: 13, color: "var(--hw-text-muted)" }}>Everyone is inside the hostel right now.</div>}
            <Link href="/hostel-warden/movement-log" className="hw-btn-ghost" style={{ display: "inline-block", marginTop: 16, fontSize: 13.5, fontWeight: 700, color: "var(--hw-accent)" }}>
              Open movement log →
            </Link>
          </Card>

          <Card style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Needs attention</h2>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--hw-accent-700)", background: "var(--hw-accent-100)", borderRadius: 99, padding: "6px 12px", whiteSpace: "nowrap" }}>
                {attention.length}
              </span>
            </div>
            {attention.map((f) => (
              <Link key={f.title} href={f.href} style={{ display: "flex", gap: 14, padding: "15px 0", borderBottom: "1px solid var(--hw-divider-soft)", textDecoration: "none", color: "inherit" }}>
                <span style={{ flex: "0 0 8px", width: 8, height: 8, borderRadius: 99, background: "var(--hw-accent)", marginTop: 7 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{f.title}</span>
                  <span style={{ display: "block", fontSize: 13, color: "#8b95a1", marginTop: 3 }}>{f.note}</span>
                </span>
              </Link>
            ))}
            {attention.length === 0 && <div style={{ padding: "28px 0 8px", fontSize: 13, color: "var(--hw-text-muted)" }}>Nothing needs attention right now.</div>}
          </Card>

          <Card style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Gate log · today</h2>
              <Link href="/hostel-warden/gate" className="hw-btn-ghost" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--hw-accent)" }}>
                Register
              </Link>
            </div>
            {todayGate.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--hw-divider-soft)" }}>
                <span style={{ flex: "0 0 46px", fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "var(--hw-accent)" }}>
                  {new Date(m.outFrom).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.4 }}>
                  {[m.studentFirstName, m.studentLastName].filter(Boolean).join(" ")} left · {roomByStudent.get(m.studentId) ?? "—"}
                </span>
                <span style={{ flex: "0 0 auto", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", borderRadius: 7, padding: "4px 8px", background: m.kind === "emergency-exit" ? "var(--hw-red-bg)" : "var(--hw-accent-100)", color: m.kind === "emergency-exit" ? "var(--hw-red-text)" : "var(--hw-accent-700)" }}>
                  {m.kind === "emergency-exit" ? "Emergency" : "Gate pass"}
                </span>
              </div>
            ))}
            {todayGate.length === 0 && <div style={{ padding: "28px 0 8px", fontSize: 13, color: "var(--hw-text-muted)" }}>No exits logged yet today.</div>}
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the dashboard."} />;
  }
}
