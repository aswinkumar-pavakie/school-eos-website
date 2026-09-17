"use server";

import { revalidatePath } from "next/cache";
import { createEbook, reactivateEbook, withdrawEbook } from "@/lib/library-api";

export interface FormActionState {
  error?: string;
}

export async function createEbookAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const title = formData.get("title");
  const resourceUrl = formData.get("resourceUrl");
  if (typeof title !== "string" || title.trim() === "") {
    return { error: "Title is required." };
  }
  if (typeof resourceUrl !== "string" || resourceUrl.trim() === "") {
    return { error: "The resource's real link is required." };
  }

  const input: Parameters<typeof createEbook>[0] = { title: title.trim(), resourceUrl: resourceUrl.trim() };
  for (const key of ["author", "publisher", "edition", "categoryId", "language", "description", "coverImageUrl"] as const) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") input[key] = value.trim();
  }

  try {
    await createEbook(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong. Nothing was changed." };
  }

  revalidatePath("/library/ebooks");
  return {};
}

export async function withdrawEbookAction(id: string): Promise<void> {
  await withdrawEbook(id);
  revalidatePath("/library/ebooks");
}

export async function reactivateEbookAction(id: string): Promise<void> {
  await reactivateEbook(id);
  revalidatePath("/library/ebooks");
}
