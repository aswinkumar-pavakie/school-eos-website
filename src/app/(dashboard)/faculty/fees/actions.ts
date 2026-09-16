"use server";

import { revalidatePath } from "next/cache";
import { createAnnouncement } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
  success?: string;
}

// Real write: posts a genuine Notice/Announcement to every parent in this
// section, via the same real /faculty/announcements endpoint the Notice
// screen itself uses -- there is no per-parent-filtered send in the real
// backend (a Faculty announcement is always whole-section), so this reaches
// every parent in the class, same as the design's own "to all N parents"
// framing.
export async function sendFeeNoticeAction(
  sectionId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message before posting." };
  try {
    await createAnnouncement({
      title: "Fee payment reminder",
      body,
      category: "FEES",
      priority: "NORMAL",
      targetSectionIds: [sectionId],
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not post this notice." };
  }
  revalidatePath("/faculty/fees");
  revalidatePath("/faculty/announcements");
  return { success: "Notice posted to all parents in this class." };
}
