"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { collectMiscReceivablePayment } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

/** Finance's one real financial action on this page -- everything else here is
 * read-only (see this route's own page.tsx comment: send-to-finance/waive stay on
 * Library's own fines page, not here). */
export async function collectLibraryFinePaymentAction(receivableId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  const mode = String(formData.get("mode") ?? "CASH") as "CASH" | "CHEQUE" | "DD" | "ONLINE";
  try {
    await collectMiscReceivablePayment(receivableId, {
      amountPaise: String(Math.round(amountRupees * 100)),
      mode,
      idempotencyKey: randomUUID(),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Collect payment failed." };
  }
  revalidatePath("/finance/library");
  return {};
}
