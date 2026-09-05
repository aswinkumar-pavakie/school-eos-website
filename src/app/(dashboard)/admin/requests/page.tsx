// Admin -> Requests & Approvals -- only the six administrative request types
// Admin is authorized to decide (see the backend's admin-request-types.ts):
// user/access, attendance corrections, student administrative record
// corrections, inventory, repair & maintenance, and other essential
// administrative requests. Academic, disciplinary, staff-performance and
// finance-operational decisions are never representable here at all.

import Link from "next/link";
import { AutoSubmitSearchInput } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateApprovalRequestModal } from "@/components/requests/CreateApprovalRequestModal";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

interface ApprovalRequestRow {
  id: string;
  requestType: string;
  requestedByName: string | null;
  requestedByRoleCode: string | null;
  payload: { description?: string; reason?: string };
  state: string;
  createdAt: string;
  decidedByName: string | null;
}

const VIEW_TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending Requests" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "sent_back", label: "Sent Back / Requires Changes" },
  { value: "history", label: "Request History" },
];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  ADMIN_ACCESS_REQUEST: "Admin access request",
  ATTENDANCE_CORRECTION_REQUEST: "Attendance correction",
  STUDENT_RECORD_CORRECTION_REQUEST: "Student record correction",
  INVENTORY_REQUEST: "Inventory request",
  REPAIR_MAINTENANCE_REQUEST: "Repair & maintenance request",
  ADMIN_OTHER_REQUEST: "Other administrative request",
};

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "APPROVED") return "success";
  if (state === "REJECTED") return "critical";
  return "pending";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = params.view ?? "pending";
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  query.set("view", view);
  if (params.search) query.set("search", params.search);
  query.set("page", String(page));
  query.set("limit", "50");

  const res = await apiFetch(`/approval-requests?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Requests &amp; Approvals</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: requests, meta } = (await res.json()) as {
    data: ApprovalRequestRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    next.set("view", view);
    if (params.search) next.set("search", params.search);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/requests?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Requests &amp; Approvals</h1>
          <p className="mt-1 text-sm text-text-muted">
            Limited, high-importance administrative requests only — academic, disciplinary and finance decisions
            stay with Principal/Vice Principal/Finance.
          </p>
        </div>
        <CreateApprovalRequestModal />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        {VIEW_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={hrefWith({ view: tab.value, page: "1" })}
            className={`whitespace-nowrap border-b-2 px-1 pb-2 text-[13px] font-semibold ${
              view === tab.value ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <Link
          href="/admin/audit?objectType=approval_request"
          className="whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-[13px] font-semibold text-text-muted hover:text-text"
        >
          Approval Audit Trail
        </Link>
      </div>

      <form action="/admin/requests" className="mt-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="view" value={view} />
        <AutoSubmitSearchInput
          type="search"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search by requester name or description…"
          className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Request type</th>
              <th className="px-4 py-3">Requested by</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No requests match this view.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-text">{REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}</td>
                <td className="px-4 py-3 text-text-muted">
                  {r.requestedByName ?? "—"}
                  {r.requestedByRoleCode && <p className="text-xs">{r.requestedByRoleCode}</p>}
                </td>
                <td className="max-w-[320px] truncate px-4 py-3 text-text-muted">{r.payload?.description ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted" title={new Date(r.createdAt).toISOString()}>
                  {formatRelativeTime(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={stateTone(r.state)} label={r.state.replace(/_/g, " ")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/requests/${r.id}`} className="text-[13px] font-semibold text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
