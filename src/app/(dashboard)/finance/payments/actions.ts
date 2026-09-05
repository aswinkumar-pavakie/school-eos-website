"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { allocatePayment, createPayment, createRefund, generateReceipts, processRefundPayout, type PaymentMode } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  const mode = String(formData.get("mode")) as PaymentMode;
  const gateway = String(formData.get("gateway") || "") || undefined;

  let created;
  try {
    created = await createPayment({
      amountPaise: String(Math.round(amountRupees * 100)),
      mode,
      gateway,
      paidByPersonId: String(formData.get("paidByPersonId") || "") || undefined,
      idempotencyKey: randomUUID(),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/payments");
  redirect(`/finance/payments/${created.id}`);
}

export async function allocatePaymentAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const feeDemandIds = formData.getAll("feeDemandId") as string[];
  const amounts = formData.getAll("amountRupees") as string[];
  const allocations = feeDemandIds
    .map((feeDemandId, i) => ({ feeDemandId, amountPaise: String(Math.round(Number(amounts[i] || "0") * 100)) }))
    .filter((a) => a.feeDemandId && Number(a.amountPaise) > 0);
  if (allocations.length === 0) return { error: "Add at least one allocation" };

  try {
    await allocatePayment(id, allocations);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Allocation failed." };
  }
  revalidatePath(`/finance/payments/${id}`);
  return {};
}

export async function generateReceiptsAction(id: string): Promise<void> {
  await generateReceipts(id);
  revalidatePath(`/finance/payments/${id}`);
}

export async function createRefundAction(paymentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  try {
    await createRefund(paymentId, {
      studentId: String(formData.get("studentId")),
      amountPaise: String(Math.round(amountRupees * 100)),
      reason: String(formData.get("reason")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Refund request failed." };
  }
  revalidatePath(`/finance/payments/${paymentId}`);
  return {};
}

export async function processRefundAction(paymentId: string, refundId: string): Promise<void> {
  await processRefundPayout(refundId);
  revalidatePath(`/finance/payments/${paymentId}`);
}
