// Vice Principal -> Repair & Maintenance -> request detail: read-only mirror
// of Admin's own detail page (problem description, assignment, completion
// details). No assign/start/complete/cancel controls -- those stay Admin
// operational actions. The affected-item link points at VP's OWN Inventory
// detail page (/vice-principal/inventory/items/[id]) rather than Admin's --
// VP never reuses another role's route. No "View history" link -- VP has no
// Audit Log access at all in this app (see this page's own inline comment).

import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

interface RepairRequestDetail {
  id: string;
  title: string;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  inventoryItemAssetCode: string | null;
  issueType: string;
  location: string | null;
  priority: string;
  description: string;
  status: string;
  requestedOn: string;
  requestedByName: string | null;
  assignedToPersonId: string | null;
  assignedToName: string | null;
  assignedOn: string | null;
  completedOn: string | null;
  repairAction: string | null;
  completionNotes: string | null;
  costPaise: string | null;
}

function priorityTone(priority: string): "success" | "pending" | "critical" {
  if (priority === "URGENT" || priority === "HIGH") return "critical";
  if (priority === "LOW") return "success";
  return "pending";
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export default async function VicePrincipalRepairRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/repair-requests/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this request</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: request } = (await res.json()) as { data: RepairRequestDetail };

  return (
    <div className="mx-auto max-w-[820px]">
      <BackLink href="/vice-principal/maintenance" label="Back to Repair & Maintenance" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">{request.title}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {request.issueType.replace(/_/g, " ").toLowerCase()}
            {request.location ? ` · ${request.location}` : ""} · requested {formatDate(request.requestedOn)}
            {request.requestedByName ? ` by ${request.requestedByName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={priorityTone(request.priority)} label={request.priority} />
          <StatusPill tone={statusTone(request.status)} label={request.status.replace(/_/g, " ")} />
          {/* No "View history" link here -- unlike Principal, VP has no Audit
              Log access at all (a deliberate, established restriction in this
              app), so this page has nowhere real to send that link. */}
        </div>
      </div>

      {request.inventoryItemId && (
        <p className="mt-2 text-sm text-text-muted">
          Affected item:{" "}
          <Link href={`/vice-principal/inventory/items/${request.inventoryItemId}`} className="font-semibold text-primary">
            {request.inventoryItemName}
            {request.inventoryItemAssetCode && ` (${request.inventoryItemAssetCode})`}
          </Link>
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Problem description</h2>
        <p className="mt-2 text-sm text-text">{request.description}</p>
      </section>

      {request.assignedToName && (
        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Assignment</h2>
          <p className="mt-2 text-sm text-text">
            Assigned to <span className="font-semibold">{request.assignedToName}</span>
            {request.assignedOn && ` on ${formatDate(request.assignedOn)}`}
          </p>
        </section>
      )}

      {request.status === "COMPLETED" && (
        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Completion details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Completed on</dt>
              <dd className="mt-0.5 text-text">{request.completedOn ? formatDate(request.completedOn) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Cost</dt>
              <dd className="mt-0.5 text-text">{request.costPaise ? formatMoney(request.costPaise) : "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Repair action</dt>
              <dd className="mt-0.5 text-text">{request.repairAction ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Notes</dt>
              <dd className="mt-0.5 text-text">{request.completionNotes ?? "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      {!request.assignedToName && request.status !== "COMPLETED" && (
        <p className="mt-6 text-sm text-text-muted">
          No assignment yet -- this request is {request.status.toLowerCase().replace(/_/g, " ")}.
        </p>
      )}
    </div>
  );
}
