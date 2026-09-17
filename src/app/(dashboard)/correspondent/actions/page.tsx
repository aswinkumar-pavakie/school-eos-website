// Correspondent -> Action / Exception Center (Phase 8). An aggregation VIEW
// over existing modules, not a new task/issue engine -- every row here is a
// real record from an endpoint Correspondent already reads elsewhere
// (Repair & Maintenance, Inventory, Hostel complaints/outings). No new table,
// no new status model: each source's own real status/priority fields are
// shown as-is. Escalation/follow-up: this codebase has no dedicated
// escalation table or due-date field on repair_request/inventory_item, so
// nothing here fabricates an "overdue"/"escalated" flag those sources don't
// actually have -- hostel_outing DOES have a real expectedReturn, and its
// own overdue computation is reused verbatim from HostelOverview.tsx's
// isOverdue(). "Escalation" as a concept is the existing generic approvals
// engine's SENT_BACK state plus the Audit Log's own immutable history
// (/correspondent/requests, /correspondent/audit) -- not duplicated here.
// Compliance (document expiry) has its own dedicated page
// (/correspondent/compliance) and is only cross-linked from the KPI row
// below, not re-fetched/re-rendered inline.

import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/format";

interface RepairRequestRow {
  id: string;
  title: string;
  inventoryItemName: string | null;
  location: string | null;
  priority: string;
  status: string;
  requestedOn: string;
}
interface InventoryItemRow {
  id: string;
  name: string;
  categoryName: string;
  location: string | null;
}
interface HostelComplaintEntry {
  id: string;
  issueType: string;
  subject: string;
  state: string;
  createdAt: string;
}
interface HostelOutingEntry {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  expectedReturn: string;
  state: string;
}

function priorityTone(priority: string): "success" | "pending" | "critical" {
  if (priority === "URGENT" || priority === "HIGH") return "critical";
  if (priority === "LOW") return "success";
  return "pending";
}
// Matches HostelOverview.tsx's own isOverdue() exactly -- /hostel/outings/
// oversight already returns only currently-active (not-yet-returned) rows
// (OutingOversightController's own "listActiveOversight" naming), so no
// extra state check is needed here. Date.now() is read inside this module-
// level helper (never directly in the component body) so it isn't flagged as
// an impure call during render -- same pattern this app's other pages use
// for isDueSoon()/isRequestDueSoon().
function isOutingOverdue(entry: HostelOutingEntry): boolean {
  return new Date(entry.expectedReturn).getTime() < Date.now();
}

export default async function CorrespondentActionsPage() {
  const [maintenanceRes, damagedRes, complaintsRes, outingsRes] = await Promise.all([
    apiFetch("/repair-requests?status=REQUESTED&limit=50"),
    apiFetch("/inventory-items?status=DAMAGED&limit=50"),
    apiFetch("/hostel/complaints/oversight"),
    apiFetch("/hostel/outings/oversight"),
  ]);

  if (!maintenanceRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the Action Center</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const maintenance: RepairRequestRow[] = (await maintenanceRes.json()).data;
  const damagedItems: InventoryItemRow[] = damagedRes.ok ? (await damagedRes.json()).data : [];
  const complaints: HostelComplaintEntry[] = complaintsRes.ok ? (await complaintsRes.json()).data : [];
  const outings: HostelOutingEntry[] = outingsRes.ok ? (await outingsRes.json()).data : [];

  // Real hostel_complaint state machine (complaints.service.ts):
  // OPEN -> IN_PROGRESS/ESCALATED/REJECTED/CLOSED, IN_PROGRESS ->
  // RESOLVED/ESCALATED/CLOSED, ESCALATED -> IN_PROGRESS/RESOLVED/CLOSED,
  // RESOLVED -> CLOSED. So "unresolved" is OPEN/IN_PROGRESS/ESCALATED, and
  // ESCALATED is a real, already-existing state -- not fabricated here.
  const unresolvedComplaints = complaints.filter((c) => c.state === "OPEN" || c.state === "IN_PROGRESS" || c.state === "ESCALATED");
  const escalatedComplaints = complaints.filter((c) => c.state === "ESCALATED");
  const overdueOutings = outings.filter((o) => isOutingOverdue(o));

  const highPriorityMaintenance = maintenance.filter((m) => m.priority === "URGENT" || m.priority === "HIGH");

  const totalOpen = maintenance.length + damagedItems.length + unresolvedComplaints.length + overdueOutings.length;

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Action Center</h1>
      <p className="mt-1 text-sm text-text-muted">
        What needs attention right now, aggregated from Repair &amp; Maintenance, Inventory, and Hostel — view-only.
        Acting on any item happens in its own module.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard eyebrow="Open items" value={String(totalOpen)} detail="Across all sources below" />
        <KpiCard
          eyebrow="High priority"
          value={String(highPriorityMaintenance.length)}
          detail="Maintenance, urgent/high"
          href="/correspondent/maintenance?priority=HIGH"
        />
        <KpiCard eyebrow="Overdue outings" value={String(overdueOutings.length)} detail="Past expected return" href="/correspondent/hostel" />
        <KpiCard
          eyebrow="Complaints"
          value={String(unresolvedComplaints.length)}
          detail={`${escalatedComplaints.length} escalated`}
          href="/correspondent/hostel"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Repair &amp; Maintenance — requested</h2>
            <Link href="/correspondent/maintenance" className="text-[13px] font-semibold text-primary">
              View all
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {maintenance.length === 0 && <li className="py-6 text-center text-sm text-text-muted">Nothing requested right now.</li>}
            {maintenance.slice(0, 8).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <Link href={`/correspondent/maintenance/${m.id}`} className="min-w-0 hover:text-primary">
                  <p className="truncate font-semibold text-text">{m.title}</p>
                  <p className="truncate text-xs text-text-muted">
                    {m.inventoryItemName ?? m.location ?? "—"} · requested {formatDate(m.requestedOn)}
                  </p>
                </Link>
                <StatusPill tone={priorityTone(m.priority)} label={m.priority} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Inventory — damaged</h2>
            <Link href="/correspondent/inventory?status=DAMAGED" className="text-[13px] font-semibold text-primary">
              View all
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {damagedItems.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No damaged items.</li>}
            {damagedItems.slice(0, 8).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <Link href={`/correspondent/inventory/items/${i.id}`} className="min-w-0 hover:text-primary">
                  <p className="truncate font-semibold text-text">{i.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {i.categoryName}
                    {i.location ? ` · ${i.location}` : ""}
                  </p>
                </Link>
                <StatusPill tone="critical" label="Damaged" />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Hostel — overdue outings</h2>
            <Link href="/correspondent/hostel" className="text-[13px] font-semibold text-primary">
              View Hostel
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {overdueOutings.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No overdue outings.</li>}
            {overdueOutings.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">
                    {o.studentFirstName} {o.studentLastName ?? ""}
                  </p>
                  <p className="truncate text-xs text-text-muted">expected back {formatRelativeTime(o.expectedReturn)}</p>
                </div>
                <StatusPill tone="critical" label="Overdue" />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Hostel — unresolved complaints</h2>
            <Link href="/correspondent/hostel" className="text-[13px] font-semibold text-primary">
              View Hostel
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {unresolvedComplaints.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No unresolved complaints.</li>}
            {unresolvedComplaints.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5 text-[13.5px]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{c.subject}</p>
                  <p className="truncate text-xs text-text-muted">
                    {c.issueType.replace(/_/g, " ").toLowerCase()} · {formatDate(c.createdAt)}
                  </p>
                </div>
                <StatusPill tone={c.state === "ESCALATED" ? "critical" : "pending"} label={c.state.replace(/_/g, " ")} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-field p-[18px] text-sm text-text-muted">
        Document compliance (expiring/expired vehicle and driver documents) has its own view —{" "}
        <Link href="/correspondent/compliance" className="font-semibold text-primary">
          open Compliance
        </Link>
        . Requests awaiting a decision, and anything sent back for revision, are tracked in{" "}
        <Link href="/correspondent/requests" className="font-semibold text-primary">
          Requests &amp; approvals
        </Link>
        .
      </div>
    </div>
  );
}
