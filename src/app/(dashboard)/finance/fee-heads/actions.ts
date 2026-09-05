"use server";

import { revalidatePath } from "next/cache";
import { activateFeeHead, createFeeHead, deactivateFeeHead, type FeeHeadType } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createFeeHeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createFeeHead({
      name: String(formData.get("name")),
      code: String(formData.get("code")),
      headType: String(formData.get("headType")) as FeeHeadType,
      isRefundable: formData.get("isRefundable") === "true",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/fee-heads");
  return {};
}

export async function activateFeeHeadAction(id: string): Promise<void> {
  await activateFeeHead(id);
  revalidatePath("/finance/fee-heads");
}

export async function deactivateFeeHeadAction(id: string): Promise<void> {
  await deactivateFeeHead(id);
  revalidatePath("/finance/fee-heads");
}
