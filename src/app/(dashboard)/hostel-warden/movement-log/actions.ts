"use server";

import { revalidatePath } from "next/cache";
import {
  amendMovementLogEntry,
  approveEmergencyExitRequest,
  approveGatePassRequest,
  createMovementLogEntry,
  recordMovementLogReturn,
  rejectEmergencyExitRequest,
  rejectGatePassRequest,
  type MovementLogPurpose,
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

export async function recordExitAction(input: {
  studentId: string;
  purposeCategory: MovementLogPurpose;
  reason: string;
  calledByName: string;
  calledByPhone: string;
  outFrom: string;
  expectedReturn: string;
}): Promise<void> {
  await createMovementLogEntry(input);
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden");
}

export async function recordReturnAction(id: string): Promise<void> {
  await recordMovementLogReturn(id);
  revalidatePath("/hostel-warden/movement-log");
  revalidatePath("/hostel-warden");
}

export async function amendMovementLogAction(
  id: string,
  input: { expectedReturn?: string; reason?: string; calledByName?: string; calledByPhone?: string },
): Promise<void> {
  await amendMovementLogEntry(id, input);
  revalidatePath("/hostel-warden/movement-log");
}
