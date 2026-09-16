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

/**
 * Driver documents -- real operational access (list/create/update), same
 * backend endpoints Admin uses (`POST/PATCH /drivers/:id/documents` etc.,
 * now also @Roles('ADMIN','TRANSPORT_MANAGER')). No delete action here on
 * purpose: DELETE stays ADMIN-only on the backend, so this UI doesn't offer
 * a button that would only ever come back as a 403.
 */
export async function createDriverDocumentAction(
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
  revalidatePath(`/transport-manager/drivers/${driverId}`);
  return {};
}

export async function updateDriverDocumentAction(
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
  revalidatePath(`/transport-manager/drivers/${driverId}`);
  return {};
}

/**
 * Vehicle documents + maintenance -- same real operational access pattern as
 * driver documents above (`vehicles.controller.ts` now grants TRANSPORT_MANAGER
 * list/create/update on both; delete stays ADMIN-only, so no delete action here).
 */
export async function createVehicleDocumentAction(
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
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

export async function updateVehicleDocumentAction(
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
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

export async function createVehicleMaintenanceAction(
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
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

export async function updateVehicleMaintenanceAction(
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
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/** Fleet-wide "+ Log service" flow (transport-manager/maintenance page) --
 * same real POST /vehicles/:id/maintenance the per-vehicle panel uses, just
 * with the vehicle picked from a real Bus select instead of being fixed by
 * the page's own URL, and revalidating the fleet-wide log too. */
export async function createVehicleMaintenanceFleetAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const vehicleId = formData.get("vehicleId");
  if (typeof vehicleId !== "string" || !vehicleId) return { error: "Select a bus." };
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
  revalidatePath(`/transport-manager/maintenance`);
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/** Fleet-wide edit -- vehicle can't change (the record already belongs to
 * one bus), same real PATCH /vehicle-maintenance/:id the per-vehicle panel
 * uses, revalidating the fleet-wide log too. */
export async function updateVehicleMaintenanceFleetAction(
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
  revalidatePath(`/transport-manager/maintenance`);
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Fuel log -- real operational recording (`POST /vehicles/:id/fuel-log`, the
 * same TRANSPORT_MANAGER write access as documents/maintenance above). No
 * update/delete action: a logged fill-up is a real transaction, not
 * something to quietly edit away (see vehicles.controller.ts's own comment).
 */
export async function createFuelLogAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const costRupees = formData.get("costRupees");
  const res = await apiFetch(`/vehicles/${vehicleId}/fuel-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filledOn: formData.get("filledOn"),
      litres: formData.get("litres"),
      costPaise: typeof costRupees === "string" && costRupees.trim() !== "" ? Math.round(Number(costRupees) * 100) : undefined,
      odometerKm: formData.get("odometerKm") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Vehicle spec (year/body/chassis/engine/wheelbase/tyre/fuel tank/RTO/
 * parking bay/odometer/next-service-due) -- real, but a SEPARATE endpoint
 * from the vehicle master record (`PATCH /vehicles/:id`, still Admin-only).
 * Every field is optional -- only send what the form actually has a value
 * for, exactly like the document/maintenance actions above.
 */
export async function updateVehicleSpecAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  for (const key of [
    "yearOfManufacture",
    "bodyType",
    "chassisNo",
    "engineNo",
    "engineDesc",
    "wheelbaseMm",
    "tyreSize",
    "tyreCount",
    "fuelTankLitres",
    "rtoOffice",
    "parkingBay",
    "currentOdometerKm",
    "nextServiceDueKm",
  ]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const res = await apiFetch(`/vehicles/${vehicleId}/spec`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Crew reassignment -- real write on the SAME real vehicle-route-assignment
 * row (`PATCH /vehicle-route-assignments/:id`), the one endpoint
 * TRANSPORT_MANAGER genuinely has create/update access to (see
 * vehicle-route-assignments.controller.ts's own comment: "the real
 * driver<->vehicle assignment action... the one write Transport Manager is
 * meant to perform"). Folded directly into the bus detail page's own Crew
 * card -- there's no more separate "Bus Allocation" page/action for this.
 */
export async function updateAssignmentCrewAction(
  assignmentId: string,
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const driverId = formData.get("driverId");
  const attendantId = formData.get("attendantId");
  const res = await apiFetch(`/vehicle-route-assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      driverId: typeof driverId === "string" && driverId.trim() !== "" ? driverId : undefined,
      attendantId: typeof attendantId === "string" && attendantId.trim() !== "" ? attendantId : undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Route reassignment -- `routeId` isn't patchable on an existing assignment
 * (UpdateVehicleRouteAssignmentDto only allows driver/attendant/dates), so a
 * genuine route change is a real two-step real operation: close today's
 * assignment (PATCH effectiveTo), then create the new one (POST) carrying
 * over the same driver/attendant. Both real calls against the same real
 * endpoint the crew form above uses.
 */
export async function updateAssignmentRouteAction(
  assignmentId: string,
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const routeId = formData.get("routeId");
  const driverId = formData.get("driverId");
  const attendantId = formData.get("attendantId");
  if (typeof routeId !== "string" || !routeId) return { error: "Route · required" };

  const today = new Date().toISOString().slice(0, 10);
  const closeRes = await apiFetch(`/vehicle-route-assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ effectiveTo: today }),
  });
  if (!closeRes.ok) return { error: await readError(closeRes) };

  const createRes = await apiFetch("/vehicle-route-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId,
      routeId,
      driverId: typeof driverId === "string" && driverId.trim() !== "" ? driverId : undefined,
      attendantId: typeof attendantId === "string" && attendantId.trim() !== "" ? attendantId : undefined,
      effectiveFrom: today,
    }),
  });
  if (!createRes.ok) return { error: await readError(createRes) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Assign (or reassign) a bus to a route -- the same real
 * vehicle_route_assignment write as updateAssignmentRouteAction above, just
 * initiated from the route's own side instead of the bus's. `routeId` isn't
 * patchable on an existing assignment (same backend reasoning as the
 * bus-side action) -- if this route already has a current assignment, this
 * closes it (PATCH effectiveTo=today) before creating the new one; if it has
 * none, it just creates one. The backend's own overlap check
 * (VehicleRouteAssignmentsService.create) rejects double-booking the chosen
 * vehicle/driver/attendant with a clean error -- surfaced here as-is, not
 * re-validated client-side.
 */
export async function assignBusToRouteAction(
  routeId: string,
  currentAssignmentId: string | null,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const vehicleId = formData.get("vehicleId");
  const driverId = formData.get("driverId");
  const attendantId = formData.get("attendantId");
  if (typeof vehicleId !== "string" || !vehicleId) return { error: "Bus · required" };

  const today = new Date().toISOString().slice(0, 10);
  if (currentAssignmentId) {
    const closeRes = await apiFetch(`/vehicle-route-assignments/${currentAssignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ effectiveTo: today }),
    });
    if (!closeRes.ok) return { error: await readError(closeRes) };
  }

  const createRes = await apiFetch("/vehicle-route-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId,
      routeId,
      driverId: typeof driverId === "string" && driverId.trim() !== "" ? driverId : undefined,
      attendantId: typeof attendantId === "string" && attendantId.trim() !== "" ? attendantId : undefined,
      effectiveFrom: today,
    }),
  });
  if (!createRes.ok) return { error: await readError(createRes) };
  revalidatePath("/transport-manager/routes");
  revalidatePath(`/transport-manager/routes/${routeId}`);
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  return {};
}

/**
 * Route master data (name/code/direction/distanceKm/status) -- real,
 * explicit product decision (`PATCH /routes/:id` now grants TRANSPORT_MANAGER
 * alongside ADMIN, see routes.controller.ts's own comment). Create is real
 * too now (see createRouteAction below); real delete doesn't exist for a
 * route anywhere in this app -- "delete" is the request-deactivate flow
 * further down.
 */
export async function updateRouteDetailsAction(
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  for (const key of ["name", "code", "direction", "distanceKm", "status"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const res = await apiFetch(`/routes/${routeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager/routes");
  revalidatePath(`/transport-manager/routes/${routeId}`);
  return {};
}

/**
 * Vehicle master record (registrationNo/model/capacity/ownership/
 * operationalStatus) -- real create+edit access, explicit product decision
 * ("give all access for edit add bus route student for the transport
 * manager"). `POST /vehicles` and `PATCH /vehicles/:id` now grant
 * TRANSPORT_MANAGER alongside ADMIN. Distinct from updateVehicleSpecAction
 * above (the separate spec-fields endpoint).
 */
export async function createVehicleAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const capacity = formData.get("capacity");
  const res = await apiFetch("/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registrationNo: formData.get("registrationNo"),
      model: formData.get("model") || undefined,
      capacity: typeof capacity === "string" && capacity.trim() !== "" ? Number(capacity) : undefined,
      ownership: formData.get("ownership") || undefined,
      operationalStatus: formData.get("operationalStatus") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager/buses");
  revalidatePath("/transport-manager");
  return {};
}

export async function updateVehicleMasterAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  for (const key of ["registrationNo", "model", "capacity", "ownership", "operationalStatus"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = key === "capacity" ? Number(value) : value;
  }
  const res = await apiFetch(`/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  revalidatePath("/transport-manager/buses");
  return {};
}

/**
 * Route create -- real, same access grant as updateRouteDetailsAction above
 * (`POST /routes` now grants TRANSPORT_MANAGER alongside ADMIN).
 */
export async function createRouteAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const distanceKm = formData.get("distanceKm");
  const res = await apiFetch("/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.get("name"),
      code: formData.get("code") || undefined,
      direction: formData.get("direction") || undefined,
      distanceKm: typeof distanceKm === "string" && distanceKm.trim() !== "" ? Number(distanceKm) : undefined,
      status: formData.get("status") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager/routes");
  return {};
}

/**
 * Route stops -- real create+edit access (`POST /routes/:id/stops`,
 * `PATCH /route-stops/:stopId` now grant TRANSPORT_MANAGER alongside ADMIN).
 * The real hard DELETE stays ADMIN-only -- Transport Manager's own path is
 * requestRouteStopDeleteAction further down.
 */
export async function createRouteStopAction(
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const sequenceNo = formData.get("sequenceNo");
  const res = await apiFetch(`/routes/${routeId}/stops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stopName: formData.get("stopName"),
      sequenceNo: typeof sequenceNo === "string" && sequenceNo.trim() !== "" ? Number(sequenceNo) : undefined,
      scheduledTime: formData.get("scheduledTime") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/routes/${routeId}`);
  revalidatePath("/transport-manager/buses");
  return {};
}

export async function updateRouteStopAction(
  stopId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  const sequenceNo = formData.get("sequenceNo");
  if (typeof sequenceNo === "string" && sequenceNo.trim() !== "") payload.sequenceNo = Number(sequenceNo);
  for (const key of ["stopName", "scheduledTime"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const res = await apiFetch(`/route-stops/${stopId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/routes/${routeId}`);
  revalidatePath("/transport-manager/buses");
  return {};
}

/**
 * Student transport allocation -- real create+edit access (`POST
 * /student-transport-allocations`, `PATCH /student-transport-allocations/:id`
 * now grant TRANSPORT_MANAGER alongside ADMIN). No student-search endpoint is
 * reachable by TRANSPORT_MANAGER anywhere in this backend (checked
 * students.controller.ts directly -- ADMIN/PRINCIPAL only), so create isn't
 * wired to a UI form yet -- a real picker needs that gap closed first, not a
 * fabricated one. update (moving an already-assigned student to a different
 * stop) needs no picker and is wired.
 */
export async function updateStudentAllocationAction(
  allocationId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  for (const key of ["routeStopId", "direction", "feeSlab"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  const res = await apiFetch(`/student-transport-allocations/${allocationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/routes/${routeId}`);
  return {};
}

/**
 * The 4 real "request X, Admin decides" actions -- each creates a real
 * approval_request via the generic approvals engine (school-eos-backend/src/
 * modules/approvals). Nothing changes until an ADMIN approves it from their
 * own Requests & Approvals inbox; the real side effect (deactivate/delete/
 * cancel) only runs from transport-approval-handlers.service.ts's own
 * onApproved, never from this action directly.
 *
 * TRANSPORT_MANAGER cannot query their own submitted requests anywhere in
 * this backend -- GET /approvals only ever returns the CALLER's OWN
 * approver inbox (requests awaiting a decision from a role the caller
 * holds), never "requests I raised" (checked approval-request.repository.ts's
 * own listForCaller SQL directly: it joins on the caller's own approver
 * role, there is no requestedBy-only mode). Since every one of these 4
 * policies is ADMIN-only-approves, that endpoint always returns empty for
 * this role. A real "still pending" badge that survives a page refresh isn't
 * buildable without a small backend addition (e.g. a requestedBy filter) --
 * not done here since it's outside this pass's backend scope. The forms
 * below show a real one-time "Request submitted" confirmation from the
 * action's own successful response instead of a fabricated persistent badge.
 */
export async function requestVehicleDeactivateAction(
  vehicleId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/vehicles/${vehicleId}/request-deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: formData.get("reason") || undefined }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/buses/${vehicleId}`);
  revalidatePath("/transport-manager/buses");
  return {};
}

export async function requestRouteDeactivateAction(
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/routes/${routeId}/request-deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: formData.get("reason") || undefined }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager/routes");
  return {};
}

export async function requestRouteStopDeleteAction(
  stopId: string,
  routeId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/route-stops/${stopId}/request-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: formData.get("reason") || undefined }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/routes/${routeId}`);
  revalidatePath("/transport-manager/buses");
  return {};
}

export async function requestStudentAllocationCancelAction(
  allocationId: string,
  routeId: string,
  studentLabel: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/student-transport-allocations/${allocationId}/request-cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: formData.get("reason") || undefined, studentLabel }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/transport-manager/routes/${routeId}`);
  return {};
}

/**
 * Driver master-record edit (name/phone/licence/experience/blood group) --
 * `PATCH /drivers/:id` grants TRANSPORT_MANAGER alongside ADMIN (explicit
 * product decision, matching the vehicle/route master-record edit pattern).
 */
/**
 * Real "Crew details" edit -- driver master fields via `PATCH /drivers/:id`,
 * plus (only if this driver has a current vehicle_route_assignment) a real
 * attendant swap via `PATCH /vehicle-route-assignments/:id` -- the same real
 * endpoint EditCrewForm.tsx already uses on the bus detail page, so this is
 * a genuine second real entry point to the same write, not a new one.
 * "Assigned bus" deliberately stays read-only here -- moving a driver to a
 * different bus is really "change which vehicle this assignment covers",
 * which already has its own correct, safe flow (Routes' own "Assign bus",
 * the bus detail page's own "Edit route") that also has to reason about the
 * bus's route and its previous driver; duplicating a partial version of that
 * here risks leaving a bus without a driver or a route without checks this
 * form doesn't have visibility into.
 */
export async function updateDriverMasterAction(
  driverId: string,
  assignmentId: string | null,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  for (const key of ["fullName", "phone", "licenceNo", "licenceExpiry", "experienceYears", "bloodGroup"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") {
      payload[key] = key === "experienceYears" ? Number(value) : value;
    }
  }
  const res = await apiFetch(`/drivers/${driverId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };

  if (assignmentId) {
    const attendantId = formData.get("attendantId");
    if (typeof attendantId === "string" && attendantId.trim() !== "") {
      const assignRes = await apiFetch(`/vehicle-route-assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendantId }),
      });
      if (!assignRes.ok) return { error: await readError(assignRes) };
    }
  }

  revalidatePath("/transport-manager/drivers");
  return {};
}

/**
 * No real hard-delete exists for a driver -- "Remove" on the crew card is a
 * real request-to-deactivate, same request-X-through-the-approval-engine
 * pattern as vehicle/route/route-stop/student-allocation.
 */
export async function requestDriverDeactivateAction(
  driverId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/drivers/${driverId}/request-deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: formData.get("reason") || undefined }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager/drivers");
  return {};
}

/**
 * Real "Post a notice" -- `POST /announcements` now grants TRANSPORT_MANAGER
 * alongside ADMIN/PRINCIPAL (explicit product decision), matching the
 * mockup's own dashboard control. Always posted as audienceType 'ROLE' /
 * targetRoles ['TRANSPORT_MANAGER'] -- this role never posts a school-wide
 * announcement from here, only into the same real feed the Transport
 * dashboard's own Notices card already reads. Neither "Bus no" nor "Route"
 * is a real announcement field anywhere in this schema -- when picked, their
 * real values are folded into the title/body text itself
 * ("TN45BC4101 · Route 03 — <notice>"), the same natural phrasing this
 * role's own existing real notices already use ("Route 04 diverted — ..."),
 * rather than inventing new columns.
 */
export async function createNoticeAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const busNo = formData.get("busNo");
  const routeLabel = formData.get("routeLabel");
  const tag = formData.get("tag");
  const notice = formData.get("notice");
  if (typeof notice !== "string" || notice.trim() === "") return { error: "Notice · required" };

  const prefixParts = [
    typeof busNo === "string" && busNo.trim() !== "" ? busNo.trim() : null,
    typeof routeLabel === "string" && routeLabel.trim() !== "" ? routeLabel.trim() : null,
  ].filter((p): p is string => p !== null);
  const text = prefixParts.length > 0 ? `${prefixParts.join(" · ")} — ${notice.trim()}` : notice.trim();
  const res = await apiFetch("/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: text,
      body: text,
      category: typeof tag === "string" && tag.trim() !== "" ? tag.trim().toUpperCase() : undefined,
      priority: "NORMAL",
      audienceType: "ROLE",
      targetRoles: ["TRANSPORT_MANAGER"],
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/transport-manager");
  return {};
}
