// Meetings -- pixel-rebuilt from the design's own isMeetings screen
// (list -> details). Real teacher-opened slots + real booking state
// (listParentMeetingSlots/createParentMeetingBooking), same
// /parent/meeting-slots + /parent/meeting-bookings endpoints already
// established. The design's own "Join call"/"Record" screens have NO real
// backend anywhere in this schema for a Parent-Faculty meeting -- unlike
// Faculty's Online class (a real Google Meet link), MeetingSlot/
// MeetingBooking carry no meetingUrl or any call/recording field at all.
// Honestly omitted rather than faked; a slot's own approved state is the
// only real signal this screen can show.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listChildren, listParentMeetingSlots, resolveSelectedChild, type MeetingBooking } from "@/lib/parent-api";
import { RequestMeetingPanel } from "./RequestMeetingPanel";

const BOOKING_TONE: Record<MeetingBooking["state"], PillTone> = {
  PENDING: "amber",
  APPROVED: "blue",
  REJECTED: "red",
};

function time(value: string): string {
  return value.slice(0, 5);
}

export default async function ParentMeetingsPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  let selected: ReturnType<typeof resolveSelectedChild> | null = null;
  let slots: Awaited<ReturnType<typeof listParentMeetingSlots>> = [];
  let loadError: string | null = null;
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    selected = resolveSelectedChild(children, requestedStudentId);
    if (selected) {
      slots = await listParentMeetingSlots(selected.studentId);
    }
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    loadError = err instanceof Error ? err.message : "Couldn't load meeting slots.";
  }

  if (loadError) return <ErrorState message={loadError} />;
  if (!selected) return <ErrorState message="No children linked to this account." />;

  return (
      <div className="parent-scope">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Meetings</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Book a parent-teacher meeting slot for {selected.studentName}.</div>
        </div>

        {slots.length === 0 ? (
          <EmptyPanel label="Teachers haven't opened any slots for this child yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {slots.map((slot) => (
              <div key={slot.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
                        <path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 20.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{slot.facultyName}</div>
                      <div style={{ fontSize: 12.5, color: "var(--par-body-muted)" }}>{formatDate(slot.meetingDate)} · {time(slot.fromTime)} – {time(slot.toTime)}</div>
                    </div>
                  </div>
                  {slot.booking && <StatusPill label={slot.booking.state} tone={BOOKING_TONE[slot.booking.state]} />}
                </div>

                {slot.booking ? (
                  <>
                    {slot.booking.notes && <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginTop: 10 }}>Your note: {slot.booking.notes}</div>}
                    {slot.booking.state === "APPROVED" && (
                      <Link
                        href={`/meeting-call/${slot.booking.id}`}
                        style={{
                          marginTop: 10,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: "var(--par-radius-input)",
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#fff",
                          background: "#1E8A4C",
                        }}
                      >
                        Join call
                      </Link>
                    )}
                  </>
                ) : (
                  <RequestMeetingPanel studentId={selected.studentId} slotId={slot.id} facultyName={slot.facultyName} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
