"use server";

import { revalidatePath } from "next/cache";
import { updateLibraryConfig } from "@/lib/library-api";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

export async function updateLibraryConfigAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const finePerDayRupees = Number(formData.get("finePerDayRupees") || "0");
  try {
    await updateLibraryConfig({
      loanPeriodDays: Number(formData.get("loanPeriodDays") || "0"),
      maxRenewals: Number(formData.get("maxRenewals") || "0"),
      finePerDayPaise: String(Math.round(finePerDayRupees * 100)),
      maxBooksPerMember: Number(formData.get("maxBooksPerMember") || "0"),
      reservationHoldDays: Number(formData.get("reservationHoldDays") || "0"),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed." };
  }
  revalidatePath("/library/configuration");
  return { success: true };
}
