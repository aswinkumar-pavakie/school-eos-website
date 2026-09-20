"use server";

import { revalidatePath } from "next/cache";
import { recordMovementLogReturn } from "@/lib/hostel-warden-api";

export async function recordGateReturnAction(outingRequestId: string): Promise<void> {
  await recordMovementLogReturn(outingRequestId);
  revalidatePath("/hostel-warden/gate");
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden/leave");
  revalidatePath("/hostel-warden");
}
