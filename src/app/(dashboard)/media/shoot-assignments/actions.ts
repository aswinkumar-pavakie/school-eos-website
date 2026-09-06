"use server";

import { revalidatePath } from "next/cache";
import { createShootAssignment, updateShootAssignment, type ShootOutputType, type ShootStatus } from "@/lib/media-api";

export interface FormState {
  error?: string;
}

function toIso(date: string, time: string): string {
  return new Date(`${date}T${time || "00:00"}:00`).toISOString();
}

export async function createShootAssignmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const eventTitle = String(formData.get("eventTitle") ?? "").trim();
  const date = String(formData.get("scheduledDate") ?? "");
  if (!eventTitle) return { error: "Event title is required." };
  if (!date) return { error: "Date is required." };

  try {
    await createShootAssignment({
      eventTitle,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      scheduledAt: toIso(date, String(formData.get("scheduledTime") ?? "")),
      outputType: formData.get("outputType") as ShootOutputType,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      crewIds: formData.getAll("crewIds").map(String).filter(Boolean),
      gearIds: formData.getAll("gearIds").map(String).filter(Boolean),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the shoot assignment." };
  }
  revalidatePath("/media/shoot-assignments");
  revalidatePath("/media");
  return {};
}

export async function updateShootAssignmentAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const date = String(formData.get("scheduledDate") ?? "");
  try {
    await updateShootAssignment(id, {
      eventTitle: String(formData.get("eventTitle") ?? "").trim() || undefined,
      venue: String(formData.get("venue") ?? "").trim() || undefined,
      scheduledAt: date ? toIso(date, String(formData.get("scheduledTime") ?? "")) : undefined,
      outputType: (formData.get("outputType") as ShootOutputType) || undefined,
      status: (formData.get("status") as ShootStatus) || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      crewIds: formData.getAll("crewIds").map(String).filter(Boolean),
      gearIds: formData.getAll("gearIds").map(String).filter(Boolean),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update the shoot assignment." };
  }
  revalidatePath("/media/shoot-assignments");
  revalidatePath("/media");
  return {};
}
