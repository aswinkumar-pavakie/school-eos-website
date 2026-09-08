"use server";

import { revalidatePath } from "next/cache";
import { submitHomework } from "@/lib/parent-api";

export interface FormState {
  error?: string;
}

/** Pulls the note + any real File objects straight out of the submitted
 * &lt;input type="file" multiple&gt;, rebuilds a fresh FormData matching the
 * backend's own multipart field names, and forwards it -- Node's Server
 * Action runtime hands us real File objects here (no Blob workaround needed,
 * unlike the mobile app's own broken FormData polyfill). */
export async function submitHomeworkAction(
  studentId: string,
  homeworkId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const note = String(formData.get("note") ?? "").trim();
  const upload = new FormData();
  if (note) upload.set("note", note);
  for (const file of formData.getAll("files")) {
    if (file instanceof File && file.size > 0) upload.append("files", file);
  }

  try {
    await submitHomework(studentId, homeworkId, upload);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit homework." };
  }
  revalidatePath("/parent/homework");
  return {};
}
