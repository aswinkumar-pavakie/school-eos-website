"use server";

import { revalidatePath } from "next/cache";
import { createTrainingSession, recordTrainingAttendance, updateTrainingSession } from "@/lib/sports-faculty-api";

export interface FormState {
  error?: string;
}

export async function createSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  if (!teamId) return { error: "Team is required." };
  if (!scheduledAt) return { error: "Date & time is required." };

  try {
    await createTrainingSession({
      teamId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      focus: String(formData.get("focus") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create training session." };
  }
  revalidatePath("/sports/training");
  return {};
}

// Fire-and-forget (bound straight to a plain <form action>, no useActionState) --
// a thrown error surfaces via the nearest error.tsx rather than an inline message.
export async function updateSessionStatusAction(sessionId: string, status: string): Promise<void> {
  await updateTrainingSession(sessionId, { status });
  revalidatePath("/sports/training");
}

export async function recordAttendanceAction(
  sessionId: string,
  studentIds: string[],
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const entries = studentIds.map((studentId) => ({
    studentId,
    status: (String(formData.get(`status:${studentId}`) ?? "PRESENT") as "PRESENT" | "ABSENT" | "LATE"),
  }));

  try {
    await recordTrainingAttendance(sessionId, entries);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save attendance." };
  }
  revalidatePath("/sports/training");
  return {};
}
