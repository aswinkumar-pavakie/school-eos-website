// Driver detail -- Transport Manager's real operational surface for driver
// documents (new: driver_document table/endpoints, TRANSPORT_MANAGER now has
// list/create/update access -- see drivers.controller.ts). Driver identity
// fields themselves (name, licence no./expiry, status) stay read-only here --
// editing the driver record itself is still Admin-only, unchanged.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { DriverDocumentsPanel, type DriverDocument } from "@/components/transport/DriverDocumentsPanel";
import { apiFetch } from "@/lib/api";

interface DriverDetail {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  status: string;
}

export default async function TransportManagerDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [driverRes, documentsRes] = await Promise.all([
    apiFetch(`/drivers/${id}`),
    apiFetch(`/drivers/${id}/documents`),
  ]);

  if (driverRes.status === 404) notFound();
  if (!driverRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this driver</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: driver } = (await driverRes.json()) as { data: DriverDetail };
  const documents: DriverDocument[] = documentsRes.ok
    ? ((await documentsRes.json()) as { data: DriverDocument[] }).data
    : [];

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/transport-manager/drivers" label="Back to Drivers" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{driver.fullName}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {driver.phone ?? "No phone on file"} · licence {driver.licenceNo}
          </p>
        </div>
        <StatusPill tone={driver.status === "ACTIVE" ? "success" : "pending"} label={driver.status} />
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Licence on file</h2>
        <p className="mt-2 text-sm text-text">
          {driver.licenceNo} · expires {driver.licenceExpiry.slice(0, 10)}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          This is the driver&apos;s core licence record — edit it from the Drivers list on the Admin console.
        </p>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Documents</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Attached documents and their own expiry — driving licence, medical certificate, police verification, and
          anything else on file.
        </p>
        <div className="mt-3">
          <DriverDocumentsPanel driverId={driver.id} documents={documents} />
        </div>
      </section>
    </div>
  );
}
