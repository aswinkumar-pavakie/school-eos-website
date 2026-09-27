// Compliance -- real, fleet-wide top-level page, matching the SIS Transport
// mockup's own nav item literally (see maintenance/page.tsx's own comment
// for why this exists as a separate top-level page now). Same real
// vehicle_document + driver_document data as the bus detail page's own
// Documents & compliance panel, aggregated fleet-wide across every vehicle
// AND driver instead of per-vehicle.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
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

// Real doc_type CHECK constraint on vehicle_document is INSURANCE/FITNESS/
// PERMIT/PUC/ROAD_TAX/OTHER -- these 5 (minus OTHER) match the mockup's own
// 5-column matrix (Insurance/Fitness/Permit/Pollution/Road tax) exactly.
const DOC_TYPE_COLUMNS = ["INSURANCE", "FITNESS", "PERMIT", "PUC", "ROAD_TAX"] as const;
const DOC_TYPE_LABEL: Record<(typeof DOC_TYPE_COLUMNS)[number], string> = {
  INSURANCE: "Insurance",
  FITNESS: "Fitness",
  PERMIT: "Permit",
  PUC: "Pollution",
  ROAD_TAX: "Road tax",
};

// Dot color legend matches the mockup's own docState() literally: BAD
// var(--color-navy) = expired, WARN var(--color-primary) = due within 45 days, OK var(--color-text-muted) = valid.
function dotColor(daysLeft: number | null): string {
  if (daysLeft === null) return "var(--color-border)";
  if (daysLeft < 0) return "var(--color-navy)";
  if (daysLeft <= 45) return "var(--color-primary)";
  return "var(--color-text-muted)";
}

export default async function TransportManagerCompliancePage() {
  const [vehiclesRes, driversRes] = await Promise.all([apiFetch("/vehicles"), apiFetch("/drivers")]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Compliance</p>
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
        return docs.map((d) => ({ ...d, entityLabel: v.registrationNo, href: `/transport-manager/buses/${v.id}`, source: "Vehicle" as const }));
      }),
    ),
    Promise.all(
      drivers.map(async (d) => {
        const res = await apiFetch(`/drivers/${d.id}/documents`);
        const docs: DocRow[] = res.ok ? (await res.json()).data : [];
        return docs.map((doc) => ({ ...doc, entityLabel: d.fullName, href: `/transport-manager/drivers/${d.id}`, source: "Driver" as const }));
      }),
    ),
  ]);

  const allDocs = [...vehicleDocs.flat(), ...driverDocs.flat()]
    .map((d) => ({ ...d, daysLeft: daysUntil(d.validTo) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const expiring = allDocs.filter((d) => d.daysLeft <= 45);
  const overdue = expiring.filter((d) => d.daysLeft < 0);

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Compliance</h1>
      <p className="mt-1.5 text-[15px] text-text-muted">Insurance, fitness, permit, pollution and tax — read-only.</p>

      <div className="mt-5 grid grid-cols-1 gap-[14px] sm:grid-cols-3">
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Expiring within 45 days</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{expiring.length}</p>
          <p className="mt-2 text-[13px] text-text-muted">{overdue.length} already overdue</p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Total documents</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{allDocs.length}</p>
          <p className="mt-2 text-[13px] text-text-muted">
            across {vehicles.length} buses · {drivers.length} drivers
          </p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Valid</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{allDocs.length - expiring.length}</p>
          <p className="mt-2 text-[13px] text-text-muted">no action needed</p>
        </div>
      </div>

      {/* Color-coded matrix -- mockup's own "isDocs" screen: one row per bus,
          one column per document type, a colored dot standing in for the
          full record (hover/click for detail). Real vehicle_document rows
          only, latest per (vehicle, docType) when more than one exists. */}
      <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Vehicle compliance matrix</h2>
          <div className="flex items-center gap-4 text-[12px] font-semibold text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-navy)" }} /> Expired
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-primary)" }} /> Due within 45 days
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-text-muted)" }} /> Valid
            </span>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="py-2.5 pr-3">Bus</th>
                {DOC_TYPE_COLUMNS.map((t) => (
                  <th key={t} className="px-2 py-2.5 text-center">
                    {DOC_TYPE_LABEL[t]}
                  </th>
                ))}
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((v) => {
                const vDocs = vehicleDocs.flat().filter((d) => d.entityLabel === v.registrationNo);
                return (
                  <tr key={v.id}>
                    <td className="py-3 pr-3">
                      <Link href={`/transport-manager/buses/${v.id}`} className="font-mono font-semibold text-primary">
                        {v.registrationNo}
                      </Link>
                    </td>
                    {DOC_TYPE_COLUMNS.map((t) => {
                      const doc = vDocs.filter((d) => d.docType === t).sort((a, b) => (a.validTo > b.validTo ? -1 : 1))[0];
                      const daysLeft = doc ? daysUntil(doc.validTo) : null;
                      return (
                        <td key={t} className="px-2 py-3 text-center">
                          <span
                            className="mx-auto block h-3 w-3 rounded-full"
                            style={{ background: dotColor(daysLeft) }}
                            title={doc ? `${DOC_TYPE_LABEL[t]} · valid till ${formatDate(doc.validTo)}` : `No ${DOC_TYPE_LABEL[t]} record`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-3 pl-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/transport-manager/buses/${v.id}`}
                          title="Edit this bus's document dates"
                          className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                          <MaterialIcon name="edit" size={17} />
                        </Link>
                        <span
                          title="Deleting a document record is Admin-only — not available to Transport Manager"
                          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-[8px] opacity-50"
                          style={{ border: "1px solid var(--color-tint-2)", color: "var(--color-navy)" }}
                        >
                          <MaterialIcon name="delete" size={17} />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[17px] font-bold leading-[22px] text-text">Driver documents</h2>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {driverDocs.flat().length === 0 && <li className="py-6 text-center text-sm text-text-muted">No driver documents on file.</li>}
          {driverDocs.flat().map((d) => {
            const daysLeft = daysUntil(d.validTo);
            return (
              <li key={d.id} className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-[10px] px-2 py-2.5 text-[13.5px]">
                <div>
                  <p className="font-semibold text-text">
                    <Link href={d.href} className="hover:text-primary">
                      {d.entityLabel}
                    </Link>{" "}
                    · {docTypeLabel(d.docType)}
                  </p>
                  <p className="text-xs text-text-muted">{d.docNo ?? "—"} · valid till {formatDate(d.validTo)}</p>
                </div>
                <StatusPill
                  tone={daysLeft < 0 ? "critical" : daysLeft <= 45 ? "pending" : "success"}
                  label={daysLeft < 0 ? `Lapsed ${Math.abs(daysLeft)}d ago` : daysLeft <= 45 ? `Due in ${daysLeft}d` : "Valid"}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
