"use server";

import { revalidatePath } from "next/cache";
import {
  approveEmergencyExitRequest,
  approveGatePassRequest,
  rejectEmergencyExitRequest,
  rejectGatePassRequest,
} from "@/lib/hostel-warden-api";

export type OutingKind = "gate-pass" | "emergency-exit";

export async function approveOutingRequestAction(kind: OutingKind, id: string, comment?: string): Promise<void> {
  if (kind === "gate-pass") await approveGatePassRequest(id, comment);
  else await approveEmergencyExitRequest(id, comment);
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden");
}

export async function rejectOutingRequestAction(kind: OutingKind, id: string, comment: string): Promise<void> {
  if (kind === "gate-pass") await rejectGatePassRequest(id, comment);
  else await rejectEmergencyExitRequest(id, comment);
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden");
}
