"use server";

// Transport Manager's own server actions -- kept separate from
// admin/transport/actions.ts (not reused as-is) because those revalidate
// /admin/transport specifically; a Transport Manager mutation needs its own
// page(s) revalidated instead. The one write this role performs outside
// vehicle-route assignment (already covered by AssignmentsPanel's own
// createAssignmentAction, safe to reuse verbatim since the backend allows
// TRANSPORT_MANAGER on that exact endpoint) is acknowledging a transport
// alert.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

export async function acknowledgeAlertAction(
  alertId: string,
  _prev: FormActionState,
): Promise<FormActionState> {
  const res = await apiFetch(`/transport-ops/alerts/${alertId}/acknowledge`, {
    method: "POST",
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager");
  revalidatePath("/transport-manager/live-tracking");
  return {};
}
