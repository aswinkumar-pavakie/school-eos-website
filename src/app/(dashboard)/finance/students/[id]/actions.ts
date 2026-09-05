"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { clearEducationLoanDD, receiveStudentPayment } from "@/lib/finance-api";

export interface FormState {
  error?: string;
  success?: string;
}

export async function receivePaymentAction(studentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  const mode = String(formData.get("mode")) as "CASH" | "CHEQUE" | "DD";

  try {
    const { payment, receipt } = await receiveStudentPayment(studentId, {
      feeDemandId: String(formData.get("feeDemandId")),
      amountPaise: String(Math.round(amountRupees * 100)),
      mode,
      idempotencyKey: randomUUID(),
      bankName: mode === "DD" ? String(formData.get("bankName") || "") : undefined,
      ddReferenceNo: mode === "DD" ? String(formData.get("ddReferenceNo") || "") : undefined,
    });
    revalidatePath(`/finance/students/${studentId}`);
    revalidatePath(`/finance/students/${studentId}/demand`);
    revalidatePath(`/finance/students/${studentId}/history`);
    revalidatePath(`/finance/students/${studentId}/education-loan-dd`);
    if (receipt) return { success: `Payment recorded — receipt ${receipt.receiptNo}` };
    if (mode === "DD") return { success: "DD received — mark it cleared once the bank confirms it (Education Loan DD tab)." };
    return { success: `Payment ${payment.id} recorded` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Payment failed." };
  }
}

export async function clearDDAction(studentId: string, paymentId: string): Promise<void> {
  await clearEducationLoanDD(paymentId);
  revalidatePath(`/finance/students/${studentId}`);
  revalidatePath(`/finance/students/${studentId}/demand`);
  revalidatePath(`/finance/students/${studentId}/history`);
  revalidatePath(`/finance/students/${studentId}/education-loan-dd`);
}
