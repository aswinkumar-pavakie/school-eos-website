"use server";

import { revalidatePath } from "next/cache";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/lib/media-api";

export async function createMediaEventAction(input: {
  academicYearId: string;
  title: string;
  date: string;
  callTime: string;
}): Promise<void> {
  if (!input.academicYearId) throw new Error("No academic year resolved.");
  if (!input.title.trim()) throw new Error("Event title is required.");
  if (!input.date) throw new Error("Date is required.");

  await createCalendarEvent({
    academicYearId: input.academicYearId,
    title: input.title.trim(),
    // Real field, no fabrication: call time is genuine user input folded into
    // the only free-text field calendar_event has (description) -- there is
    // no dedicated call-time column in this schema.
    description: input.callTime.trim() ? `Call time: ${input.callTime.trim()}` : undefined,
    startDate: input.date,
    endDate: input.date,
    eventType: "OTHER",
  });
  revalidatePath("/media/calendar");
}

export async function updateMediaEventAction(id: string, input: { title: string; date: string; description?: string }): Promise<{ error?: string }> {
  if (!input.title.trim()) return { error: "Event title is required." };
  if (!input.date) return { error: "Date is required." };
  try {
    await updateCalendarEvent(id, {
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      startDate: input.date,
      endDate: input.date,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this event." };
  }
  revalidatePath("/media/calendar");
  return {};
}

export async function deleteMediaEventAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteCalendarEvent(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this event." };
  }
  revalidatePath("/media/calendar");
  return {};
}
