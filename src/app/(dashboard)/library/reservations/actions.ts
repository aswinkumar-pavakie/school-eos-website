"use server";

import { revalidatePath } from "next/cache";
import { cancelReservation } from "@/lib/library-api";

export async function cancelReservationAction(id: string): Promise<void> {
  await cancelReservation(id);
  revalidatePath("/library/reservations");
}
