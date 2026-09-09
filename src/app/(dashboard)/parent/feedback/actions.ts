"use server";

import { revalidatePath } from "next/cache";
import { submitFeedback } from "@/lib/parent-api";

export interface FeedbackFormState {
  error?: string;
}

/** One Parent-owned rating per subject offering -- `rating` is bound in by the
 * caller (one star button per value, see FeedbackStars.tsx) before this is
 * wired into useActionState, matching the same bind-then-useActionState shape
 * as submitHomeworkAction. No aggregation, no class average -- this only ever
 * writes the caller's own rating and returns their own refreshed list. */
export async function submitFeedbackAction(
  studentId: string,
  subjectOfferingId: string,
  rating: number,
  _prev: FeedbackFormState,
  _formData: FormData,
): Promise<FeedbackFormState> {
  try {
    await submitFeedback(studentId, subjectOfferingId, rating);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit your rating." };
  }
  revalidatePath("/parent/feedback");
  return {};
}
