"use server";

import { revalidatePath } from "next/cache";
import { createCalendarEvent, deleteCalendarEvent, listAcademicYears, updateCalendarEvent, type CalendarEventType } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createCalendarEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim() || startDate;
  const eventType = String(formData.get("eventType") ?? "COMPETITION").trim() as CalendarEventType;
  if (!title) return { error: "Title is required." };
  if (!startDate) return { error: "Pick a start date." };

  try {
    const years = await listAcademicYears();
    const currentYear = years.find((y) => y.isCurrent) ?? years[0];
    if (!currentYear) return { error: "No academic year is set up yet — ask Admin to create one first." };

    await createCalendarEvent({
      academicYearId: currentYear.id,
      title,
      startDate,
      endDate,
      eventType,
      description: String(formData.get("description") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this event." };
  }
  revalidatePath("/sports-admin/calendar");
  return {};
}

// Edit/Delete for events this account created -- both already real,
// already SPORTS_ADMIN-authorized on the backend, but the backend's own
// assertCanModify only allows touching an event this same account created
// (see sports-admin-api.ts's own comment); a 403 on someone else's event
// surfaces here as this action's error message.
export async function updateCalendarEventAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim() || startDate;
  const eventType = String(formData.get("eventType") ?? "COMPETITION").trim() as CalendarEventType;
  if (!title) return { error: "Title is required." };
  if (!startDate) return { error: "Pick a start date." };

  try {
    await updateCalendarEvent(id, {
      title,
      startDate,
      endDate,
      eventType,
      description: String(formData.get("description") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this event." };
  }
  revalidatePath("/sports-admin/calendar");
  return {};
}

export async function deleteCalendarEventAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteCalendarEvent(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this event." };
  }
  revalidatePath("/sports-admin/calendar");
  return {};
}
