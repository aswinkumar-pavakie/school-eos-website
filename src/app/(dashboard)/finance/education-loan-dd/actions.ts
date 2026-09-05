"use server";

import { revalidatePath } from "next/cache";
import { clearEducationLoanDD } from "@/lib/finance-api";

export async function clearDDAction(paymentId: string): Promise<void> {
  await clearEducationLoanDD(paymentId);
  revalidatePath("/finance/education-loan-dd");
  revalidatePath("/finance/students/[id]", "layout");
}
