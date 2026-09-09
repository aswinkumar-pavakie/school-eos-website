"use server";

import { revalidatePath } from "next/cache";
import { requestPayslipAccess } from "@/lib/faculty-staff-api";

export interface FormState {
  error?: string;
}

export async function requestPayslipAccessAction(_prev: FormState, _formData: FormData): Promise<FormState> {
  try {
    await requestPayslipAccess();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit request." };
  }
  revalidatePath("/faculty/payslip");
  return {};
}
