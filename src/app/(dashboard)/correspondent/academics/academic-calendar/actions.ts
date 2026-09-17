"use server";

// Principal's own real create action for calendar events (design-reframe
// addition, per the SIS mockup's "+ Add event" flow and explicit user
// confirmation this supersedes the module's earlier "Principal is view-only"
// decision). Mirrors admin/academic-calendar/actions.ts's createCalendarEventAction
// exactly, just revalidating Principal's own route -- the backend grant itself
// (@Roles('ADMIN', 'PRINCIPAL') on POST /calendar-events) is the real gate,
// this is just the server-action wrapper this route needs.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface CreateEventResult {
  error?: string;
}

export async function createPrincipalCalendarEventAction(
  academicYearId: string,
  isoDate: string,
  title: string,
  eventType: string,
): Promise<CreateEventResult> {
  const res = await apiFetch("/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      academicYearId,
      title,
      eventType,
      isHoliday: eventType === "HOLIDAY",
      startDate: isoDate,
      endDate: isoDate,
      scopeType: "SCHOOL",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: Array.isArray(body?.message) ? body.message.join(" ") : (body?.message ?? "Something went wrong. Nothing was changed.") };
  }
  revalidatePath("/correspondent/academics/academic-calendar");
  return {};
}
