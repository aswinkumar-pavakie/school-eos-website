"use server";

import { createRazorpayOrder, listPayments, type PaymentRow, type RazorpayOrder } from "@/lib/parent-api";

export async function createFeeOrderAction(
  studentId: string,
  input: { academicYearId: string; instalmentNo: number; feeDemandIds: string[]; amountPaise: string },
): Promise<RazorpayOrder> {
  return createRazorpayOrder(studentId, input);
}

/** Polled by the client after Razorpay's own checkout closes -- the only
 * source of truth for whether money actually arrived is the backend's own
 * webhook-confirmed payment state, never Razorpay's client-side callback. */
export async function getPaymentStatusAction(studentId: string, paymentId: string): Promise<PaymentRow | null> {
  const payments = await listPayments(studentId);
  return payments.find((p) => p.id === paymentId) ?? null;
}
