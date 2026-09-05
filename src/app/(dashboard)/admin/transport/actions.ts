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
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/transport");
  return {};
}

// Vehicles
export async function createVehicleAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/vehicles", "POST", collect(formData, ["registrationNo", "model", "capacity", "ownership"]));
}
export async function updateVehicleAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/vehicles/${id}`,
    "PATCH",
    collect(formData, ["registrationNo", "model", "capacity", "ownership", "operationalStatus"]),
  );
}

// Routes
export async function createRouteAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/routes", "POST", collect(formData, ["name", "code", "direction", "distanceKm"]));
}
export async function updateRouteAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/routes/${id}`, "PATCH", collect(formData, ["name", "code", "direction", "distanceKm", "status"]));
}
export async function createRouteStopAction(routeId: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/routes/${routeId}/stops`, "POST", collect(formData, ["stopName", "sequenceNo", "scheduledTime"]));
}

// Drivers
export async function createDriverAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/drivers", "POST", collect(formData, ["fullName", "phone", "licenceNo", "licenceExpiry"]));
}
export async function updateDriverAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/drivers/${id}`, "PATCH", collect(formData, ["fullName", "phone", "licenceNo", "licenceExpiry", "status"]));
}

// Attendants
export async function createAttendantAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/attendants", "POST", collect(formData, ["fullName", "phone"]));
}
export async function updateAttendantAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/attendants/${id}`, "PATCH", collect(formData, ["fullName", "phone", "status"]));
}

// Vehicle-route assignments
export async function createAssignmentAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/vehicle-route-assignments",
    "POST",
    collect(formData, ["vehicleId", "routeId", "driverId", "attendantId", "effectiveFrom"]),
  );
}

// Route -> assigned students (Route detail page)
export async function addStudentTransportAllocationAction(
  routeId: string,
  studentId: string,
  academicYearId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (!studentId) return { error: "Pick a student." };
  if (!academicYearId) return { error: "No current academic year is set." };

  const payload: Record<string, unknown> = {
    studentId,
    academicYearId,
    routeStopId: formData.get("routeStopId"),
    direction: formData.get("direction"),
  };
  const feeSlab = formData.get("feeSlab");
  if (typeof feeSlab === "string" && feeSlab.trim() !== "") payload.feeSlab = feeSlab;

  const res = await apiFetch("/student-transport-allocations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

export async function changeStudentTransportStopAction(
  routeId: string,
  allocationId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/student-transport-allocations/${allocationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["routeStopId"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

export async function cancelStudentTransportAllocationAction(routeId: string, allocationId: string): Promise<void> {
  await apiFetch(`/student-transport-allocations/${allocationId}/cancel`, { method: "POST" });
  revalidatePath(`/admin/transport/routes/${routeId}`);
}

/**
 * "Change vehicle" from the Drivers tab -- keeps the same route/driver/attendant,
 * just swaps which vehicle. vehicle_id isn't an editable column on
 * vehicle_route_assignment (it's part of what identifies the assignment), so this
 * ends today's assignment and opens a new one today rather than patching it in
 * place. The real vra_no_overlap constraint is scoped to (route_id, date range),
 * not vehicle_id, so ending the old row today and starting the new one the same
 * day never overlaps (the end date is exclusive).
 */
export async function changeDriverVehicleAction(
  assignmentId: string,
  routeId: string,
  driverId: string,
  attendantId: string | null,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const vehicleId = formData.get("vehicleId");
  if (typeof vehicleId !== "string" || !vehicleId) return { error: "Pick a vehicle." };

  const today = new Date().toISOString().slice(0, 10);

  const endRes = await apiFetch(`/vehicle-route-assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ effectiveTo: today }),
  });
  if (!endRes.ok) return { error: await readError(endRes) };

  const createRes = await apiFetch("/vehicle-route-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId,
      routeId,
      driverId,
      attendantId: attendantId ?? undefined,
      effectiveFrom: today,
    }),
  });
  if (!createRes.ok) {
    return {
      error: `Ended the previous vehicle assignment but couldn't start the new one: ${await readError(createRes)}. This driver currently has no active vehicle — try again.`,
    };
  }

  revalidatePath("/admin/transport");
  return {};
}
