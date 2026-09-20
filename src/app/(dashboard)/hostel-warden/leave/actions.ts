"use server";

import { revalidatePath } from "next/cache";
import { createMovementLogEntry } from "@/lib/hostel-warden-api";

// Home leave in this schema IS an outing_request (isOvernight=true) -- see
// RecordLeaveForm.tsx's own header comment for why this reuses the exact
// same real Movement Log write instead of a second, parallel one.
export async function recordLeaveAction(input: {
  studentId: string;
  reason: string;
  calledByName: string;
  calledByPhone: string;
  outFrom: string;
  expectedReturn: string;
}): Promise<void> {
  await createMovementLogEntry({ ...input, purposeCategory: "HOME_LEAVE", isOvernight: true });
  revalidatePath("/hostel-warden/leave");
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden");
}
