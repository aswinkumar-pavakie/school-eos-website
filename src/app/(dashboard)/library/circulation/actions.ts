"use server";

import { revalidatePath } from "next/cache";
import { createIssue, markIssueLost, renewIssue, returnIssue } from "@/lib/library-api";

export interface FormActionState {
  error?: string;
}

/** The Circulation page's own "Issue a book" form -- copyId/memberId come from the
 * IssueBookForm's two search-selects (see ../search-actions.ts), not typed IDs. */
export async function issueBookAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const copyId = String(formData.get("copyId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!copyId || !memberId) return { error: "Pick both a book copy and a member." };
  try {
    await createIssue({ copyId, memberId });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Issue failed." };
  }
  revalidatePath("/library/circulation");
  revalidatePath("/library/books");
  return {};
}

/** Same underlying createIssue() call, used by the "Issue" action on an individual
 * AVAILABLE copy row on the book detail page -- bookId is only there to revalidate
 * that page too. */
export async function issueCopyAction(
  bookId: string,
  copyId: string,
  memberId: string,
  _prev: FormActionState,
  _formData: FormData,
): Promise<FormActionState> {
  if (!memberId) return { error: "Pick who this copy is being issued to." };
  try {
    await createIssue({ copyId, memberId });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Issue failed." };
  }
  revalidatePath(`/library/books/${bookId}`);
  revalidatePath("/library/circulation");
  return {};
}

export async function returnIssueAction(id: string): Promise<void> {
  await returnIssue(id);
  revalidatePath("/library/circulation");
  revalidatePath("/library/books");
  revalidatePath("/library/members");
}

export async function renewIssueAction(id: string): Promise<void> {
  await renewIssue(id);
  revalidatePath("/library/circulation");
}

export async function markIssueLostAction(id: string): Promise<void> {
  await markIssueLost(id);
  revalidatePath("/library/circulation");
  revalidatePath("/library/books");
  revalidatePath("/library/fines");
}
