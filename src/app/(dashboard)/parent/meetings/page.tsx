// Parent Meetings -- real open slots for the selected child's teachers,
// each slot's own real booking state; an open slot with no booking yet gets
// a small request action, same /parent/meeting-slots +
// /parent/meeting-bookings endpoints the Parent mobile app's own Meetings
// screen already calls.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listChildren, listParentMeetingSlots, resolveSelectedChild } from "@/lib/parent-api";
import { RequestMeetingModal } from "./RequestMeetingModal";

function time(value: string): string {
  return value.slice(0, 5);
}

export default async function ParentMeetingsPage({
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

    const slots = await listParentMeetingSlots(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Meetings</h1>
            <p className="mt-1 text-sm text-text-muted">Book a parent-teacher meeting slot for {selected.studentName}.</p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {slots.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No meeting slots yet" body="Teachers haven't opened any slots for this child yet." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{slot.facultyName}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(slot.meetingDate)} · {time(slot.fromTime)} – {time(slot.toTime)}
                    </p>
                  </div>
                  {slot.booking ? <StatusPill state={slot.booking.state} /> : null}
                </div>

                {slot.booking ? (
                  slot.booking.notes ? <p className="mt-2 text-sm text-text-muted">Your note: {slot.booking.notes}</p> : null
                ) : (
                  <div className="mt-3">
                    <RequestMeetingModal studentId={selected.studentId} slotId={slot.id} facultyName={slot.facultyName} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load meeting slots. Nothing was changed — try again." />;
  }
}
