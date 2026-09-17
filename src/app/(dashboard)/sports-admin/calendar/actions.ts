"use server";

import { revalidatePath } from "next/cache";
import { createCalendarEvent, listAcademicYears, type CalendarEventType } from "@/lib/sports-admin-api";

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
