// Ask permissions -- this IS the mobile app's own "Events" feature for
// Faculty (app/(protected)/events/*), just under a different nav label on
// the website. Per explicit instruction, this screen replicates that real
// screen's actual structure/fields/flow exactly (flat event list, a
// create-event step, a separate add-students step, participant states
// "Waiting for approval"/"Approved"/"Rejected", a permission letter once
// approved) rather than the earlier pixel-mockup design (which had invented
// tabs, progress bars and copy that don't exist in the real feature).
// Connects to the same real, mobile-proven backend: /faculty/events
// (student-events.controller.ts).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getEventDetail, listEvents } from "@/lib/faculty-permissions-api";
import { listGradesAction } from "./actions";
import { PermissionsClient } from "./PermissionsClient";

export default async function PermissionsPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  try {
    const { eventId } = await searchParams;
    const [events, grades] = await Promise.all([listEvents(), listGradesAction()]);
    const selectedId = eventId || events[0]?.id;
    const detail = selectedId ? await getEventDetail(selectedId).catch(() => null) : null;

    return <PermissionsClient events={events} detail={detail} grades={grades} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load events. Nothing was changed -- try again." />;
  }
}
