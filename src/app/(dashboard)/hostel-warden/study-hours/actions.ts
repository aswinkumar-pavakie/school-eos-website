"use server";

import { revalidatePath } from "next/cache";
import { createStudySession, markStudyAttendance, type NightAttendanceStatus } from "@/lib/hostel-warden-api";

export async function createStudySessionAction(input: { sessionDate: string; startTime: string; endTime: string }): Promise<{ id: string }> {
  const session = await createStudySession(input);
  revalidatePath("/hostel-warden/study-hours");
  return { id: session.id };
}

export async function markStudyAttendanceAction(
  sessionId: string,
  entries: { studentId: string; status: NightAttendanceStatus }[],
): Promise<void> {
  await markStudyAttendance(sessionId, entries);
  revalidatePath(`/hostel-warden/study-hours/${sessionId}`);
}
