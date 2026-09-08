"use server";

import { revalidatePath } from "next/cache";
import { createLeaveRequest } from "@/lib/parent-api";

export interface FormState {
  error?: string;
}

export async function createLeaveRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "");
  const fromDate = String(formData.get("fromDate") ?? "");
  const toDate = String(formData.get("toDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const skipSchoolTransport = formData.get("skipSchoolTransport") === "on";

  if (!studentId) return { error: "No child selected." };
  if (!fromDate || !toDate) return { error: "From and to dates are required." };
  if (toDate < fromDate) return { error: "To date must be on or after the from date." };
  if (!reason) return { error: "A reason is required." };

  try {
    await createLeaveRequest({ studentId, fromDate, toDate, reason, skipSchoolTransport });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit the leave request." };
  }
  revalidatePath("/parent/leave");
  return {};
}
