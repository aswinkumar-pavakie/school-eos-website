"use server";

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

function collect(formData: FormData, keys: string[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  return payload;
}

async function runMutation(
  path: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
  revalidate: string,
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(revalidate);
  return {};
}

export async function createHostelAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/hostels", "POST", collect(formData, ["name", "gender", "capacity"]), "/admin/hostel");
}
export async function updateHostelAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/hostels/${id}`, "PATCH", collect(formData, ["name", "gender", "capacity", "status"]), `/admin/hostel/${id}`);
}
export async function createBlockAction(hostelId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/hostels/${hostelId}/blocks`, "POST", collect(formData, ["name"]), `/admin/hostel/${hostelId}`);
}
export async function createFloorAction(hostelId: string, blockId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/hostel-blocks/${blockId}/floors`, "POST", collect(formData, ["floorNo"]), `/admin/hostel/${hostelId}`);
}
export async function createRoomAction(hostelId: string, floorId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/hostel-floors/${floorId}/rooms`, "POST", collect(formData, ["roomNo", "roomType", "bedCapacity"]), `/admin/hostel/${hostelId}`);
}
export async function createBedAction(hostelId: string, roomId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/hostel-rooms/${roomId}/beds`, "POST", collect(formData, ["bedNo"]), `/admin/hostel/${hostelId}`);
}

export async function createAllocationAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/hostel-allocations",
    "POST",
    collect(formData, ["studentId", "bedId", "academicYearId", "allocatedFrom"]),
    "/admin/hostel",
  );
}
export async function vacateAllocationAction(id: string): Promise<void> {
  await apiFetch(`/hostel-allocations/${id}/vacate`, { method: "POST" });
  revalidatePath("/admin/hostel");
}

/** Drag-and-drop allocation on the hostel detail page -- called directly with
 * plain arguments (not a form submission), so it needs its own action rather
 * than reusing createAllocationAction's FormData signature. */
export async function allocateBedAction(
  hostelId: string,
  studentId: string,
  bedId: string,
  academicYearId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch("/hostel-allocations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      bedId,
      academicYearId,
      allocatedFrom: new Date().toISOString().slice(0, 10),
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/hostel/${hostelId}`);
  return {};
}

export async function vacateBedAllocationAction(hostelId: string, allocationId: string): Promise<void> {
  await apiFetch(`/hostel-allocations/${allocationId}/vacate`, { method: "POST" });
  revalidatePath(`/admin/hostel/${hostelId}`);
}
