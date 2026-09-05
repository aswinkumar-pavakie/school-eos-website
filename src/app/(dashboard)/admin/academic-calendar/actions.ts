"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function createCalendarEventAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const scopeType = formData.get("scopeType");
  const payload: Record<string, unknown> = {
    academicYearId: formData.get("academicYearId"),
    title: formData.get("title"),
    eventType: formData.get("eventType"),
    isHoliday: formData.get("isHoliday") === "on",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    scopeType,
  };
  const description = formData.get("description");
  if (typeof description === "string" && description.trim() !== "") payload.description = description;

  if (scopeType === "STAGE") {
    payload.scopeStage = formData.get("scopeStage");
  } else if (scopeType === "CAMPUS" || scopeType === "GRADE" || scopeType === "SECTION") {
    payload.scopeId = formData.get("scopeId");
  }

  const res = await apiFetch("/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/academic-calendar");
  return {};
}

export async function deleteCalendarEventAction(id: string): Promise<void> {
  const res = await apiFetch(`/calendar-events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Couldn't remove this event. Nothing was changed.");
  revalidatePath("/admin/academic-calendar");
}
