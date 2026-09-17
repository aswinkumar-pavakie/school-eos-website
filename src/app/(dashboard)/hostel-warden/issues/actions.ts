"use server";

import { revalidatePath } from "next/cache";
import { createComplaint, updateComplaintStatus, type HostelComplaintState, type HostelIssueType } from "@/lib/hostel-warden-api";

export async function createComplaintAction(input: {
  issueType: HostelIssueType;
  subject: string;
  description: string;
  blockId?: string;
  roomId?: string;
}): Promise<void> {
  await createComplaint(input);
  revalidatePath("/hostel-warden/issues");
  revalidatePath("/hostel-warden");
}

export async function updateComplaintStatusAction(id: string, state: HostelComplaintState): Promise<void> {
  await updateComplaintStatus(id, state);
  revalidatePath("/hostel-warden/issues");
  revalidatePath("/hostel-warden");
}
