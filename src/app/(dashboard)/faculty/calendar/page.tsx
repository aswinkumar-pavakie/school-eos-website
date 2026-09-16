// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isCalendar" screen.
// Reuses EXISTING real getFacultyCalendar() unchanged for school-wide
// events. Personal events are real, private-per-user browser storage --
// see CalendarMonthView.tsx's own header comment for why (no backend
// support exists anywhere for this, confirmed in both school-eos-backend
// and the mobile app).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getFacultyCalendar } from "@/lib/faculty-academics-api";
import { CalendarMonthView } from "./CalendarMonthView";

export default async function CalendarPage() {
  try {
    const [{ events }, actor] = await Promise.all([getFacultyCalendar(), getCurrentActor()]);
    return <CalendarMonthView events={events} personId={actor.personId} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the calendar. Nothing was changed -- try again." />;
  }
}
