"use server";

import { revalidatePath as revalidate } from "next/cache";
import { withdrawSportsApprovalRequest } from "@/lib/sports-admin-api";

// Shared server action behind WithdrawAction.tsx -- reused by every screen
// whose "delete" is really "withdraw my still-open request" (OD requests,
// Indents, Budget requests), same real /approvals/:id/withdraw endpoint.
export async function withdrawSportsApprovalRequestAction(approvalRequestId: string, path: string): Promise<{ error?: string }> {
  try {
    await withdrawSportsApprovalRequest(approvalRequestId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not withdraw this request." };
  }
  revalidate(path);
  return {};
}
