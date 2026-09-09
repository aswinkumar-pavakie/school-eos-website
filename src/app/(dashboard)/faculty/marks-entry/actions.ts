"use server";

import { revalidatePath } from "next/cache";
import { publishMarks, saveMarks } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
  success?: string;
}

export async function saveMarksAction(examSubjectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const studentIds = new Set<string>();
  for (const key of formData.keys()) {
    if (key.startsWith("marksObtained__") || key.startsWith("isAbsent__")) {
      studentIds.add(key.split("__")[1]!);
    }
  }

  const entries = [...studentIds].map((studentId) => {
    const isAbsent = formData.get(`isAbsent__${studentId}`) === "on";
    const raw = String(formData.get(`marksObtained__${studentId}`) ?? "").trim();
    return {
      studentId,
      isAbsent,
      marksObtained: !isAbsent && raw !== "" ? Number(raw) : undefined,
    };
  });

  try {
    const result = await saveMarks(examSubjectId, entries);
    revalidatePath("/faculty/marks-entry");
    return { success: `Saved ${result.saved} entr${result.saved === 1 ? "y" : "ies"}.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save marks." };
  }
}

export async function publishMarksAction(examSubjectId: string): Promise<void> {
  await publishMarks(examSubjectId);
  revalidatePath("/faculty/marks-entry");
}
