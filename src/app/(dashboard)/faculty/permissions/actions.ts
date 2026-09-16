"use server";

import { revalidatePath } from "next/cache";
import {
  addParticipant,
  createEvent,
  deleteEvent,
  listEventGrades,
  listEventSections,
  removeParticipant,
  searchEventStudents,
  searchEventTeachers,
} from "@/lib/faculty-permissions-api";

export async function searchTeachersAction(query: string) {
  return searchEventTeachers(query);
}
export async function searchStudentsAction(query: string, gradeId?: string, sectionId?: string) {
  return searchEventStudents({ search: query || undefined, gradeId, sectionId });
}
export async function listGradesAction() {
  return listEventGrades();
}
export async function listSectionsAction(gradeId?: string) {
  return listEventSections(gradeId);
}

export interface FormState {
  error?: string;
}

// Two real, separate steps -- matches the mobile app's own Events flow
// exactly (create.tsx, then a separate add-students.tsx): create the event
// first, then add students to it as its own action. There is no combined
// "create + bulk add" endpoint in the real backend.
export async function createEventAction(input: {
  name: string;
  location: string;
  purpose: string;
  monitoringTeacherPersonId: string;
  startsAt: string;
  endsAt: string;
}): Promise<FormState & { eventId?: string }> {
  try {
    const event = await createEvent(input);
    revalidatePath("/faculty/permissions");
    return { eventId: event.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create event." };
  }
}

export async function addParticipantAction(eventId: string, studentId: string): Promise<FormState> {
  try {
    await addParticipant(eventId, studentId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add this student." };
  }
  revalidatePath("/faculty/permissions");
  return {};
}

export async function deleteEventAction(eventId: string): Promise<void> {
  await deleteEvent(eventId);
  revalidatePath("/faculty/permissions");
}

export async function removeParticipantAction(eventId: string, participantId: string): Promise<void> {
  await removeParticipant(eventId, participantId);
  revalidatePath("/faculty/permissions");
}
