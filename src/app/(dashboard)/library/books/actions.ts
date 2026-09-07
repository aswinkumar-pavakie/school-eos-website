"use server";

import { revalidatePath } from "next/cache";
import {
  createBook,
  createBookCopy,
  createCategory,
  markCopyDamaged,
  markCopyLost,
  markCopyUnderRepair,
  restoreCopy,
  updateBook,
  updateBookCopy,
  updateCategory,
  withdrawBook,
  withdrawCopy,
  type CategoryStatus,
} from "@/lib/library-api";

export interface FormActionState {
  error?: string;
}

/** A non-blank string field, or undefined -- the shared "optional PATCH body
 * field" convention every Library mutation below uses. */
function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function num(formData: FormData, key: string): number | undefined {
  const value = str(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function createBookAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  if (!title || !author) return { error: "Title and author are required." };
  try {
    await createBook({
      title,
      author,
      isbn: str(formData, "isbn"),
      publisher: str(formData, "publisher"),
      edition: str(formData, "edition"),
      categoryId: str(formData, "categoryId"),
      publicationYear: num(formData, "publicationYear"),
      language: str(formData, "language"),
      description: str(formData, "description"),
      coverImageUrl: str(formData, "coverImageUrl"),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/library/books");
  return {};
}

export async function updateBookAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  try {
    await updateBook(id, {
      title: str(formData, "title"),
      author: str(formData, "author"),
      isbn: str(formData, "isbn"),
      publisher: str(formData, "publisher"),
      edition: str(formData, "edition"),
      categoryId: str(formData, "categoryId"),
      publicationYear: num(formData, "publicationYear"),
      language: str(formData, "language"),
      description: str(formData, "description"),
      coverImageUrl: str(formData, "coverImageUrl"),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath("/library/books");
  revalidatePath(`/library/books/${id}`);
  return {};
}

export async function withdrawBookAction(id: string): Promise<void> {
  await withdrawBook(id);
  revalidatePath("/library/books");
  revalidatePath(`/library/books/${id}`);
}

export async function createCopyAction(bookId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const copyCode = String(formData.get("copyCode") ?? "").trim();
  if (!copyCode) return { error: "Copy code is required." };
  try {
    await createBookCopy(bookId, {
      copyCode,
      shelfLocation: str(formData, "shelfLocation"),
      acquisitionDate: str(formData, "acquisitionDate"),
      acquisitionCostPaise: str(formData, "acquisitionCostPaise"),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Add copy failed." };
  }
  revalidatePath(`/library/books/${bookId}`);
  return {};
}

export async function updateCopyAction(bookId: string, copyId: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  try {
    await updateBookCopy(copyId, {
      copyCode: str(formData, "copyCode"),
      shelfLocation: str(formData, "shelfLocation"),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath(`/library/books/${bookId}`);
  return {};
}

export async function markCopyLostAction(
  bookId: string,
  copyId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await markCopyLost(copyId, { reason: str(formData, "reason"), notes: str(formData, "notes") });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't mark this copy lost." };
  }
  revalidatePath(`/library/books/${bookId}`);
  return {};
}

export async function markCopyDamagedAction(
  bookId: string,
  copyId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  try {
    await markCopyDamaged(copyId, { reason: str(formData, "reason"), notes: str(formData, "notes") });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't mark this copy damaged." };
  }
  revalidatePath(`/library/books/${bookId}`);
  return {};
}

export async function withdrawCopyAction(bookId: string, copyId: string): Promise<void> {
  await withdrawCopy(copyId);
  revalidatePath(`/library/books/${bookId}`);
}

export async function markCopyUnderRepairAction(bookId: string, copyId: string): Promise<void> {
  await markCopyUnderRepair(copyId);
  revalidatePath(`/library/books/${bookId}`);
}

export async function restoreCopyAction(bookId: string, copyId: string): Promise<void> {
  await restoreCopy(copyId);
  revalidatePath(`/library/books/${bookId}`);
}

export async function createCategoryAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };
  try {
    await createCategory(name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/library/books");
  return {};
}

export async function updateCategoryAction(id: string, input: { name?: string; status?: CategoryStatus }): Promise<void> {
  await updateCategory(id, input);
  revalidatePath("/library/books");
}
