"use server";

import { revalidatePath } from "next/cache";
import { createFeedback, createFoodOrder, createMedicalAppointment, type FeedbackCategory } from "@/lib/campus-api";

export interface CampusFormState {
  error?: string;
  done?: boolean;
}

const CATEGORIES: FeedbackCategory[] = ["FACILITIES", "FOOD", "TRANSPORT", "SAFETY", "OTHER"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
function optional(formData: FormData, key: string): string | undefined {
  const v = text(formData, key);
  return v.length > 0 ? v : undefined;
}

export async function createFoodOrderAction(_prev: CampusFormState, formData: FormData): Promise<CampusFormState> {
  try {
    const pickupTime = optional(formData, "pickupTime");
    const notes = optional(formData, "notes");
    await createFoodOrder({ items: text(formData, "items"), ...(pickupTime ? { pickupTime } : {}), ...(notes ? { notes } : {}) });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not place the order." };
  }
  revalidatePath("/faculty/campus/food-court");
  return { done: true };
}

export async function createMedicalAction(_prev: CampusFormState, formData: FormData): Promise<CampusFormState> {
  try {
    const preferredTime = optional(formData, "preferredTime");
    await createMedicalAppointment({
      preferredDate: text(formData, "preferredDate"),
      reason: text(formData, "reason"),
      ...(preferredTime ? { preferredTime } : {}),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not book the appointment." };
  }
  revalidatePath("/faculty/campus/medical");
  return { done: true };
}

export async function createFeedbackAction(_prev: CampusFormState, formData: FormData): Promise<CampusFormState> {
  const category = text(formData, "category") as FeedbackCategory;
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };
  try {
    await createFeedback({ category, message: text(formData, "message") });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit your feedback." };
  }
  revalidatePath("/faculty/campus/feedback");
  return { done: true };
}
