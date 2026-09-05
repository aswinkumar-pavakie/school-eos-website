"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface MarkStaffAttendanceState {
  error?: string;
}

export async function markStaffAttendanceAction(
  staffIds: string[],
  date: string,
  status: "PRESENT" | "ABSENT",
  reason: string,
): Promise<MarkStaffAttendanceState> {
  if (staffIds.length === 0) return { error: "Select at least one staff member." };
  if (!reason.trim()) return { error: "A reason is required." };

  const res = await apiFetch("/staff-attendance/mark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffIds, date, status, reason }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    return { error: message ?? "Couldn't mark attendance. Nothing was changed." };
  }

  revalidatePath("/admin/attendance");
  return {};
}
