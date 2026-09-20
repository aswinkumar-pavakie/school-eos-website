"use server";

import { revalidatePath } from "next/cache";
import { createOdRequest } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

// The design's own OD form has several fields (Duty type, Level, Venue,
// Escorting staff, Transport) with no matching column on the real
// sports_od_request row -- it only ever has teamId/fixtureId/eventDate/
// reason (confirmed via the DTO). Rather than drop them, every one is
// folded into one real, well-structured `reason` string that's genuinely
// saved as typed -- nothing here is fabricated storage, it's a composed
// version of the one real free-text field the backend has.
export async function createOdRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const teamId = String(formData.get("teamId") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  if (!teamId) return { error: "Pick a squad." };
  if (!eventDate) return { error: "Pick an event date." };
  if (!purpose) return { error: "Event / purpose is required." };

  const dutyType = String(formData.get("dutyType") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const escort = String(formData.get("escort") ?? "").trim();
  const transport = String(formData.get("transport") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim();

  const parts = [
    dutyType && `Duty: ${dutyType}`,
    purpose,
    level && `Level: ${level}`,
    venue && `Venue: ${venue}`,
    escort && `Escort: ${escort}`,
    transport && `Transport: ${transport}`,
    remarks,
  ].filter(Boolean);
  const reason = parts.join(" — ");

  try {
    await createOdRequest({ teamId, eventDate, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit this OD request." };
  }
  revalidatePath("/sports-admin/od");
  return {};
}
