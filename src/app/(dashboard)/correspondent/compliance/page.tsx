// Correspondent -> Compliance: Phase 8's Document Expiry Center. Not a new
// document system -- same real vehicle_document/driver_document data
// Transport Manager's own /transport-manager/compliance page reads (both
// already grant CORRESPONDENT: vehicles.controller.ts's ':id/documents' and
// drivers.controller.ts's ':id/documents'), the only real document-with-
// expiry architecture anywhere in this schema (checked: no Faculty/Student/
// Hostel document-with-expiry table exists -- grep for valid_to/expiry/
// expires_at outside modules/transport turned up nothing comparable).
// Read-only: no Edit/Delete icons (those stay Transport Manager/Admin
// operational actions, per that page's own comment -- Correspondent never had
// write access to vehicles/:id/documents to begin with). No per-vehicle/
// per-driver detail route exists for Correspondent yet, so entity labels are
// plain text rather than links to a page that doesn't exist.

import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Vehicle {
  id: string;
  registrationNo: string;
}
interface Driver {
  id: string;
  fullName: string;
}
interface DocRow {
  id: string;
  docType: string;
  docNo: string | null;
  validTo: string;
}

function daysUntil(dateIso: string): number {
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function docTypeLabel(docType: string): string {
  return docType.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function windowLabel(daysLeft: number): { label: string; tone: "success" | "pending" | "critical" } {
  if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, tone: "critical" };
  if (daysLeft <= 7) return { label: `Due in ${daysLeft}d`, tone: "critical" };
  if (daysLeft <= 30) return { label: `Due in ${daysLeft}d`, tone: "pending" };
  if (daysLeft <= 90) return { label: `Due in ${daysLeft}d`, tone: "pending" };
  return { label: "Valid", tone: "success" };
}

export default async function CorrespondentCompliancePage() {
  const [vehiclesRes, driversRes] = await Promise.all([apiFetch("/vehicles"), apiFetch("/drivers")]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Compliance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const vehicles: Vehicle[] = (await vehiclesRes.json()).data;
  const drivers: Driver[] = driversRes.ok ? (await driversRes.json()).data : [];

  const [vehicleDocs, driverDocs] = await Promise.all([
    Promise.all(
      vehicles.map(async (v) => {
        const res = await apiFetch(`/vehicles/${v.id}/documents`);
        const docs: DocRow[] = res.ok ? (await res.json()).data : [];
        return docs.map((d) => ({ ...d, entityLabel: v.registrationNo, source: "Vehicle" as const }));
      }),
    ),
    Promise.all(
      drivers.map(async (d) => {
        const res = await apiFetch(`/drivers/${d.id}/documents`);
        const docs: DocRow[] = res.ok ? (await res.json()).data : [];
        return docs.map((doc) => ({ ...doc, entityLabel: d.fullName, source: "Driver" as const }));
      }),
    ),
  ]);

  const allDocs = [...vehicleDocs.flat(), ...driverDocs.flat()]
    .map((d) => ({ ...d, daysLeft: daysUntil(d.validTo) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const expired = allDocs.filter((d) => d.daysLeft < 0);
  const within7 = allDocs.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 7);
  const within30 = allDocs.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 30);
  const within90 = allDocs.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 90);

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Compliance</h1>
      <p className="mt-1 text-sm text-text-muted">
        Vehicle and driver document expiry — view-only. Uploading or correcting a document date is a Transport
        Manager/Admin operation, not part of this view.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Expired</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{expired.length}</p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Within 7 days</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{within7.length}</p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Within 30 days</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{within30.length}</p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Within 90 days</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{within90.length}</p>
        </div>
      </div>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">All documents, soonest expiry first</h2>
        <p className="mt-1 text-xs text-text-muted">
          {allDocs.length} documents across {vehicles.length} vehicles · {drivers.length} drivers
        </p>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {allDocs.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No documents on file.</li>}
          {allDocs.map((d) => {
            const w = windowLabel(d.daysLeft);
            return (
              <li key={d.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-2 py-2.5 text-[13.5px]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">
                    {d.entityLabel} · {docTypeLabel(d.docType)}
                    <span className="ml-1.5 font-normal text-text-muted">({d.source})</span>
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {d.docNo ?? "—"} · valid till {formatDate(d.validTo)}
                  </p>
                </div>
                <StatusPill tone={w.tone} label={w.label} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
