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

// Route detail page (the reference-design rebuild) -- real write actions that
// revalidate that specific route's own path rather than runMutation's generic
// "/admin/transport" (the landing page), since these all show up inline on
// /admin/transport/routes/[id]. Admin has genuine ADMIN-only access on every
// one of these (route-stop hard delete, vehicle-document hard delete, vehicle
// spec/master edit, crew reassignment) -- broader than Transport Manager's own
// grant, which routes the delete-equivalents through the approvals engine
// instead (see routes.controller.ts's own comment on why route-stop DELETE
// stays ADMIN-only).
export async function updateRouteDetailAction(routeId: string, _prev: FormActionState, formData: FormData) {
  const res = await apiFetch(`/routes/${routeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["name", "code", "direction", "distanceKm", "status"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  revalidatePath("/admin/transport");
  return {};
}

export async function updateRouteStopAdminAction(
  stopId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/route-stops/${stopId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["stopName", "sequenceNo", "scheduledTime"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

export async function createRouteStopAdminAction(routeId: string, _prev: FormActionState, formData: FormData) {
  const res = await apiFetch(`/routes/${routeId}/stops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["stopName", "sequenceNo", "scheduledTime"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

/** Real hard delete -- DELETE /route-stops/:id stays ADMIN-only on the
 * backend (the one entity in Transport with a genuine hard-delete today).
 * Transport Manager's own equivalent is a request routed through the
 * approvals engine; Admin acts directly. */
export async function deleteRouteStopAdminAction(stopId: string, routeId: string): Promise<void> {
  await apiFetch(`/route-stops/${stopId}`, { method: "DELETE" });
  revalidatePath(`/admin/transport/routes/${routeId}`);
}

export async function updateVehicleMasterAdminAction(
  vehicleId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["registrationNo", "model", "capacity", "ownership", "operationalStatus"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  revalidatePath("/admin/transport");
  return {};
}

export async function updateVehicleSpecAdminAction(
  vehicleId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicles/${vehicleId}/spec`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      collect(formData, [
        "bodyType",
        "yearOfManufacture",
        "chassisNo",
        "engineNo",
        "engineDesc",
        "wheelbaseMm",
        "tyreSize",
        "tyreCount",
        "fuelTankLitres",
        "rtoOffice",
        "parkingBay",
      ]),
    ),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

export async function updateAssignmentCrewAdminAction(
  assignmentId: string,
  vehicleId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicle-route-assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collect(formData, ["driverId", "attendantId"])),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/routes/${routeId}`);
  return {};
}

/** Real hard delete -- DELETE /vehicle-documents/:id stays ADMIN-only on the
 * backend, same reasoning as deleteRouteStopAdminAction above. */
export async function deleteVehicleDocumentAdminAction(documentId: string, routeId: string): Promise<void> {
  await apiFetch(`/vehicle-documents/${documentId}`, { method: "DELETE" });
  revalidatePath(`/admin/transport/routes/${routeId}`);
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

// Vehicle-route assignments -- Admin's own Transport tabs use this directly;
// Transport Manager's own crew/route reassignment now lives on the bus
// detail page instead (buses/[id]/page.tsx's own EditCrewForm/EditRouteForm,
// via transport-manager/actions.ts's own updateAssignmentCrewAction/
// updateAssignmentRouteAction) -- there's no more standalone "Bus Allocation"
// page for this to revalidate, so this only ever touches Admin's own path
// now (runMutation's own default).
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

// Driver documents (driver detail page) -- same endpoints Transport Manager
// uses in transport-manager/actions.ts, kept as separate actions here only so
// each revalidates its own page path (/admin/transport/... vs
// /transport-manager/...). No delete action: DELETE stays ADMIN-only on the
// backend but isn't offered from this detail page either, to keep both
// surfaces' UI identical -- deleting a document, if ever needed, can be added
// later as its own explicit action.
export async function createDriverDocumentAdminAction(
  driverId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/drivers/${driverId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      docType: formData.get("docType"),
      docNo: formData.get("docNo") || undefined,
      validFrom: formData.get("validFrom") || undefined,
      validTo: formData.get("validTo"),
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/drivers/${driverId}`);
  return {};
}

export async function updateDriverDocumentAdminAction(
  driverId: string,
  documentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/drivers/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      docType: formData.get("docType") || undefined,
      docNo: formData.get("docNo") || undefined,
      validFrom: formData.get("validFrom") || undefined,
      validTo: formData.get("validTo") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/drivers/${driverId}`);
  return {};
}

// Vehicle documents + maintenance (vehicle detail page) -- same pairing as above.
export async function createVehicleDocumentAdminAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicles/${vehicleId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      docType: formData.get("docType"),
      docNo: formData.get("docNo") || undefined,
      validFrom: formData.get("validFrom") || undefined,
      validTo: formData.get("validTo"),
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/vehicles/${vehicleId}`);
  return {};
}

export async function updateVehicleDocumentAdminAction(
  vehicleId: string,
  documentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicle-documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      docType: formData.get("docType") || undefined,
      docNo: formData.get("docNo") || undefined,
      validFrom: formData.get("validFrom") || undefined,
      validTo: formData.get("validTo") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/vehicles/${vehicleId}`);
  return {};
}

export async function createVehicleMaintenanceAdminAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const costRupees = formData.get("costRupees");
  const res = await apiFetch(`/vehicles/${vehicleId}/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maintenanceType: formData.get("maintenanceType"),
      performedOn: formData.get("performedOn"),
      odometerKm: formData.get("odometerKm") || undefined,
      costPaise: typeof costRupees === "string" && costRupees.trim() !== "" ? Math.round(Number(costRupees) * 100) : undefined,
      vendor: formData.get("vendor") || undefined,
      notes: formData.get("notes") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/vehicles/${vehicleId}`);
  return {};
}

export async function updateVehicleMaintenanceAdminAction(
  vehicleId: string,
  maintenanceId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const costRupees = formData.get("costRupees");
  const res = await apiFetch(`/vehicle-maintenance/${maintenanceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maintenanceType: formData.get("maintenanceType") || undefined,
      performedOn: formData.get("performedOn") || undefined,
      odometerKm: formData.get("odometerKm") || undefined,
      costPaise: typeof costRupees === "string" && costRupees.trim() !== "" ? Math.round(Number(costRupees) * 100) : undefined,
      vendor: formData.get("vendor") || undefined,
      notes: formData.get("notes") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/transport/vehicles/${vehicleId}`);
  return {};
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
