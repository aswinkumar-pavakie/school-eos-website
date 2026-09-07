// General audit trail -- Design Architecture v0.1 module 20. GET /audit-log (not
// /audit-events, which stays scoped to login activity). Every row is real data.

import Link from "next/link";
import { AutoSubmitSearchInput } from "@/components/dashboard/AutoSubmitFilter";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

interface AuditRow {
  id: string;
  actorPersonId: string | null;
  actorName: string | null;
  actorRoleCode: string | null;
  action: string;
  objectType: string;
  objectId: string | null;
  outcome: string;
  occurredAt: string;
  beforeData: unknown;
  afterData: unknown;
}

function outcomeTone(outcome: string): "success" | "pending" | "critical" {
  if (outcome === "SUCCESS") return "success";
  if (outcome === "FAILURE" || outcome === "DENIED") return "critical";
  return "pending";
}

// "STUDENT_ENROLMENT_TRANSFERRED" / "student_enrolment" -> "Student Enrolment Transferred"
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    actorPersonId?: string;
    objectType?: string;
    objectId?: string;
    from?: string;
    to?: string;
    page?: string;
    returnTo?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  // Only trust an internal, root-relative path -- guards against an open
  // redirect if this ever gets shared as a crafted link.
  const returnTo =
    params.returnTo && params.returnTo.startsWith("/") && !params.returnTo.startsWith("//")
      ? params.returnTo
      : undefined;
  const query = new URLSearchParams();
  if (params.actorPersonId) query.set("actorPersonId", params.actorPersonId);
  if (params.objectType) query.set("objectType", params.objectType);
  if (params.objectId) query.set("objectId", params.objectId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  query.set("page", String(page));
  query.set("limit", "50");

  const res = await apiFetch(`/audit-log?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the audit trail</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: rows, meta } = (await res.json()) as {
    data: AuditRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.actorPersonId) next.set("actorPersonId", params.actorPersonId);
    if (params.objectType) next.set("objectType", params.objectType);
    if (params.objectId) next.set("objectId", params.objectId);
    if (params.from) next.set("from", params.from);
    if (params.to) next.set("to", params.to);
    if (returnTo) next.set("returnTo", returnTo);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/audit?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      {returnTo && <BackLink href={returnTo} label="‹ Back" />}
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Audit Log</h1>
      <p className="mt-1 text-sm text-text-muted">{meta.total} recorded actions</p>

      <form action="/admin/audit" className="mt-6 flex flex-wrap items-end gap-3">
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Actor person ID</span>
          <AutoSubmitSearchInput
            type="text"
            name="actorPersonId"
            defaultValue={params.actorPersonId ?? ""}
            placeholder="UUID"
            className="w-[220px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Object type</span>
          <AutoSubmitSearchInput
            type="text"
            name="objectType"
            defaultValue={params.objectType ?? ""}
            placeholder="e.g. student_enrolment"
            className="w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">From</span>
          <AutoSubmitSearchInput
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">To</span>
          <AutoSubmitSearchInput
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Object</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No audit entries match this filter.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-text">
                  {row.actorName ?? row.actorRoleCode ?? "System"}
                  {row.actorPersonId && (
                    <p className="font-mono text-[11px] text-text-muted" title={row.actorPersonId}>
                      {row.actorPersonId.slice(0, 8)}…
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-text">{humanize(row.action)}</td>
                <td className="px-4 py-3 text-text-muted">
                  {humanize(row.objectType)}
                  {row.objectId && (
                    <p className="font-mono text-[11px]" title={row.objectId}>
                      {row.objectId.slice(0, 8)}…
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={outcomeTone(row.outcome)} label={row.outcome} />
                </td>
                <td className="px-4 py-3 text-text-muted" title={new Date(row.occurredAt).toISOString()}>
                  {formatRelativeTime(row.occurredAt)}
                </td>
                <td className="px-4 py-3">
                  {(row.beforeData || row.afterData) ? (
                    <details>
                      <summary className="cursor-pointer text-[13px] font-semibold text-primary">View</summary>
                      <div className="mt-2 flex flex-col gap-2">
                        {row.beforeData ? (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Before</p>
                            <pre className="mt-1 max-w-[360px] overflow-x-auto rounded-[8px] bg-field p-2 text-xs text-text">
                              {JSON.stringify(row.beforeData, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                        {row.afterData ? (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">After</p>
                            <pre className="mt-1 max-w-[360px] overflow-x-auto rounded-[8px] bg-field p-2 text-xs text-text">
                              {JSON.stringify(row.afterData, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
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
