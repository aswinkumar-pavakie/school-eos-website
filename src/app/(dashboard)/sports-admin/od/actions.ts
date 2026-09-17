"use server";

import { revalidatePath } from "next/cache";
import { createOdRequest } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createOdRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!teamId) return { error: "Pick a squad." };
  if (!eventDate) return { error: "Pick an event date." };
  if (!reason) return { error: "Reason is required." };

  try {
    await createOdRequest({ teamId, eventDate, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit this OD request." };
  }
  revalidatePath("/sports-admin/od");
  return {};
}
