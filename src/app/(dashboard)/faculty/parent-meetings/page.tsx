import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, orDash } from "@/lib/format";
import { listMeetingSlots } from "@/lib/faculty-staff-api";
import { SlotModal } from "./SlotModal";
import { decideBookingAction, deleteSlotAction } from "./actions";

export default async function ParentMeetingsPage() {
  try {
    const slots = await listMeetingSlots();
    const booked = slots.filter((s) => s.booking).length;
    const pending = slots.filter((s) => s.booking?.state === "PENDING").length;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Parent Meetings</h1>
            <p className="mt-1 text-sm text-text-muted">Open a slot; a parent of a student you teach or advise can book it.</p>
          </div>
          <SlotModal />
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Slots" value={String(slots.length)} />
          <KpiCard eyebrow="Booked" value={String(booked)} />
          <KpiCard eyebrow="Pending" value={String(pending)} />
        </KpiGrid>

        {slots.length === 0 ? (
          <EmptyState title="No slots yet" body="Add a slot above to let parents book a meeting." />
        ) : (
          <div className="flex flex-col gap-3">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{formatDate(slot.meetingDate)}</p>
                    <p className="text-xs text-text-muted">{slot.fromTime.slice(0, 5)} – {slot.toTime.slice(0, 5)}</p>
                  </div>
                  {slot.booking ? (
                    <StatusPill state={slot.booking.state} />
                  ) : (
                    <div className="flex gap-2">
                      <SlotModal slot={slot} />
                      <form action={deleteSlotAction.bind(null, slot.id)}>
                        <PlainButton type="submit" variant="danger">Delete</PlainButton>
                      </form>
                    </div>
                  )}
                </div>

                {slot.booking ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-sm font-semibold text-text">{slot.booking.studentName} · {orDash(slot.booking.gradeName)} {orDash(slot.booking.sectionName)}</p>
                    <p className="text-xs text-text-muted">Parent: {slot.booking.parentName}{slot.booking.parentPhone ? ` · ${slot.booking.parentPhone}` : ""}</p>
                    {slot.booking.notes ? <p className="mt-1 text-sm text-text">{slot.booking.notes}</p> : null}
                    {slot.booking.state === "PENDING" ? (
                      <div className="mt-3 flex gap-2">
                        <form action={decideBookingAction.bind(null, slot.booking.id, "APPROVED")}>
                          <PlainButton type="submit" variant="primary">Approve</PlainButton>
                        </form>
                        <form action={decideBookingAction.bind(null, slot.booking.id, "REJECTED")}>
                          <PlainButton type="submit" variant="danger">Reject</PlainButton>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">Open · no booking yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load parent meetings. Nothing was changed — try again." />;
  }
}
