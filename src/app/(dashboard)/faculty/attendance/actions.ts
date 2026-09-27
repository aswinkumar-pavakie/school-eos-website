"use server";

import { revalidatePath } from "next/cache";
import { markAllPresent, markAttendanceRecord, publishAttendance } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

// These two are plain <form action={...}> bindings with no useActionState
// channel back to the UI (unlike markRecordAction below), so there's nowhere
// to display a curated inline error even if we caught one here -- swallowing
// the error and returning normally would make a real failure look like a
// silent success, which is worse. Instead: log server-side for diagnostics,
// then rethrow so it still surfaces the same way it already did (caught by
// the app's error boundary), just with a server-side record of what failed.
export async function markAllPresentAction(sectionId: string, date: string): Promise<void> {
  try {
    await markAllPresent(sectionId, date);
  } catch (err) {
    console.error(`[markAllPresentAction] section=${sectionId} date=${date}:`, err);
    throw err;
  }
  revalidatePath("/faculty/attendance");
}

export async function publishAttendanceAction(sectionId: string, date: string): Promise<void> {
  try {
    await publishAttendance(sectionId, date);
  } catch (err) {
    console.error(`[publishAttendanceAction] section=${sectionId} date=${date}:`, err);
    throw err;
  }
  revalidatePath("/faculty/attendance");
}

export async function markRecordAction(
  recordId: string,
  sectionId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const status = String(formData.get("status") ?? "");
  try {
    await markAttendanceRecord(recordId, sectionId, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update attendance." };
  }
  revalidatePath("/faculty/attendance");
  return {};
}
