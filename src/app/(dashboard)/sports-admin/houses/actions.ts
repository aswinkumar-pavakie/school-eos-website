"use server";

import { revalidatePath } from "next/cache";
import { createMeritPoint, deleteMeritPoint, updateMeritPoint } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function recordPointsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const houseId = String(formData.get("houseId") ?? "").trim();
  const pointsRaw = String(formData.get("points") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!studentId) return { error: "Pick a student." };
  if (!houseId) return { error: "Pick a house." };
  const points = Number(pointsRaw);
  if (!Number.isInteger(points) || points < 1 || points > 20) return { error: "Enter a whole number of points from 1 to 20." };
  if (!reason) return { error: "Enter what the points are for." };

  try {
    await createMeritPoint({ studentId, houseId, points, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record these points." };
  }
  revalidatePath("/sports-admin/houses");
  return {};
}

// Edit/Delete for the Sports Admin console's own Houses & inter-house
// screen -- genuinely unbuilt before this build.
export async function updateMeritPointAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const houseId = String(formData.get("houseId") ?? "").trim();
  const pointsRaw = String(formData.get("points") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const points = Number(pointsRaw);
  if (!Number.isInteger(points) || points < 1 || points > 20) return { error: "Enter a whole number of points from 1 to 20." };
  if (!reason) return { error: "Enter what the points are for." };

  try {
    await updateMeritPoint(id, { houseId: houseId || undefined, points, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this award." };
  }
  revalidatePath("/sports-admin/houses");
  return {};
}

export async function deleteMeritPointAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteMeritPoint(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete this award." };
  }
  revalidatePath("/sports-admin/houses");
  return {};
}
