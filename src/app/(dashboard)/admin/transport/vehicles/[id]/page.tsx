// Vehicle detail -- Admin's own view of vehicle documents + maintenance,
// mirroring transport-manager/buses/[id]/page.tsx exactly. Vehicle identity
// fields (registration no., model, capacity, operational status) stay
// read-only here too -- editing the vehicle record itself still happens from
// the Vehicles tab's existing Edit toggle on the Transport list page.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { VehicleDocumentsPanel, type VehicleDocument } from "@/components/transport/VehicleDocumentsPanel";
import { VehicleMaintenancePanel, type VehicleMaintenanceRecord } from "@/components/transport/VehicleMaintenancePanel";
import {
  createVehicleDocumentAdminAction,
  updateVehicleDocumentAdminAction,
  createVehicleMaintenanceAdminAction,
  updateVehicleMaintenanceAdminAction,
} from "../../actions";
import { apiFetch } from "@/lib/api";

interface VehicleDetail {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
}

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "GROUNDED" || status === "RETIRED") return "critical";
  return "pending";
}

export default async function AdminVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [vehicleRes, documentsRes, maintenanceRes] = await Promise.all([
    apiFetch(`/vehicles/${id}`),
    apiFetch(`/vehicles/${id}/documents`),
    apiFetch(`/vehicles/${id}/maintenance`),
  ]);

  if (vehicleRes.status === 404) notFound();
  if (!vehicleRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this vehicle</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicle } = (await vehicleRes.json()) as { data: VehicleDetail };
  const documents: VehicleDocument[] = documentsRes.ok
    ? ((await documentsRes.json()) as { data: VehicleDocument[] }).data
    : [];
  const maintenance: VehicleMaintenanceRecord[] = maintenanceRes.ok
    ? ((await maintenanceRes.json()) as { data: VehicleMaintenanceRecord[] }).data
    : [];

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/admin/transport" label="Back to Vehicles" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text font-mono">{vehicle.registrationNo}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {vehicle.model ?? "—"} · {vehicle.capacity} seats
            {vehicle.ownership ? ` · ${vehicle.ownership.toLowerCase()}` : ""}
          </p>
        </div>
        <StatusPill tone={tone(vehicle.operationalStatus)} label={vehicle.operationalStatus} />
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Documents</h2>
        <p className="mt-1 text-[13px] text-text-muted">Insurance, fitness, permit, PUC and other compliance documents.</p>
        <div className="mt-3">
          <VehicleDocumentsPanel
            vehicleId={vehicle.id}
            documents={documents}
            createAction={createVehicleDocumentAdminAction}
            updateAction={updateVehicleDocumentAdminAction}
          />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Maintenance</h2>
        <p className="mt-1 text-[13px] text-text-muted">Service, repair and upkeep history for this vehicle.</p>
        <div className="mt-3">
          <VehicleMaintenancePanel
            vehicleId={vehicle.id}
            records={maintenance}
            createAction={createVehicleMaintenanceAdminAction}
            updateAction={updateVehicleMaintenanceAdminAction}
          />
        </div>
      </section>
    </div>
  );
}
