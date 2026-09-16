"use server";

import { revalidatePath } from "next/cache";
import { deleteTimetableSlot, getCoordinatorStructure, publishTimetable, upsertTimetableSlot } from "@/lib/faculty-coordinator-api";

export async function saveDraftSlotsAction(
  sectionId: string,
  entries: { dayOfWeek: number; periodId: string; subjectOfferingId: string }[],
): Promise<{ error?: string }> {
  try {
    for (const entry of entries) {
      await upsertTimetableSlot({ sectionId, dayOfWeek: entry.dayOfWeek, periodId: entry.periodId, subjectOfferingId: entry.subjectOfferingId });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the draft timetable." };
  }
  revalidatePath("/academic-coordinator/timetable");
  return {};
}

export async function deleteSlotAction(slotId: string): Promise<void> {
  await deleteTimetableSlot(slotId);
  revalidatePath("/academic-coordinator/timetable");
}

export async function publishTimetableAction(sectionId: string): Promise<void> {
  await publishTimetable(sectionId);
  revalidatePath("/academic-coordinator/timetable");
}

/** "Publish all classes" -- real, composed from the same per-section
 * publishTimetable call the single-class Publish button uses, looped across
 * every section in scope. No bulk endpoint exists on the backend for this,
 * so this is the real, honest way to do it -- never a fabricated single
 * call pretending to be atomic across sections it isn't. */
export async function publishAllTimetablesAction(): Promise<{ publishedSections: number }> {
  const { sections } = await getCoordinatorStructure();
  let publishedSections = 0;
  for (const section of sections) {
    const result = await publishTimetable(section.sectionId);
    if (result.publishedSlotCount > 0) publishedSections++;
  }
  revalidatePath("/academic-coordinator/timetable");
  return { publishedSections };
}
