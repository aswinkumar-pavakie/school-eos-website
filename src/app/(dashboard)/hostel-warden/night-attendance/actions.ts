"use server";

import { revalidatePath } from "next/cache";
import { markNightAttendance, type NightAttendanceStatus } from "@/lib/hostel-warden-api";

export async function markNightAttendanceAction(
  date: string,
  entries: { studentId: string; status: NightAttendanceStatus }[],
): Promise<void> {
  await markNightAttendance(date, entries);
  revalidatePath("/hostel-warden/night-attendance");
  revalidatePath("/hostel-warden");
}
