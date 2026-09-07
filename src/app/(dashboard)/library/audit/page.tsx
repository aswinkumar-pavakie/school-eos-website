// Library's own audit trail -- "who did what, when" for Library actions only.
// Mirrors admin/audit/page.tsx's exact table/filter/before-after-diff/pagination
// pattern (that page has no exports, so the small humanize() helper below is
// duplicated rather than cross-imported), reading GET /library/audit instead
// of the school-wide /audit-log -- the backend hard-scopes every row to
// Library's own object types, so this can never surface another module's data.

import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryAuditFilters, listLibraryAudit } from "@/lib/library-api";
import { formatRelativeTime } from "@/lib/format";

function outcomeTone(outcome: string): "success" | "pending" | "critical" {
  if (outcome === "SUCCESS") return "success";
  if (outcome === "FAILURE" || outcome === "DENIED") return "critical";
  return "pending";
}

// "LIBRARY_ISSUE_CREATED" / "library_issue" -> "Library Issue Created"
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function LibraryAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    objectType?: string;
    actorPersonId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const [{ data: rows, meta }, filterOptions] = await Promise.all([
      listLibraryAudit({
        action: params.action || undefined,
        objectType: params.objectType || undefined,
        actorPersonId: params.actorPersonId || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        page,
        limit: 50,
      }),
      getLibraryAuditFilters(),
    ]);
    const total = meta?.total ?? rows.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.action) next.set("action", params.action);
      if (params.objectType) next.set("objectType", params.objectType);
      if (params.actorPersonId) next.set("actorPersonId", params.actorPersonId);
      if (params.startDate) next.set("startDate", params.startDate);
      if (params.endDate) next.set("endDate", params.endDate);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/audit?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1280px]">
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Audit / History</h1>
        <p className="mt-1 text-sm text-text-muted">{total} recorded Library actions</p>

        <form action="/library/audit" className="mt-6 flex flex-wrap items-end gap-3">
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
            <span className="font-semibold text-text">Action</span>
            <AutoSubmitSelect
              name="action"
              defaultValue={params.action ?? ""}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
            >
              <option value="">All</option>
              {filterOptions.actions.map((a) => (
                <option key={a} value={a}>{humanize(a)}</option>
              ))}
            </AutoSubmitSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Module</span>
            <AutoSubmitSelect
              name="objectType"
              defaultValue={params.objectType ?? ""}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
            >
              <option value="">All</option>
              {filterOptions.objectTypes.map((t) => (
                <option key={t} value={t}>{humanize(t)}</option>
              ))}
            </AutoSubmitSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">From</span>
            <input
              type="date"
              name="startDate"
              defaultValue={params.startDate ?? ""}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">To</span>
            <input
              type="date"
              name="endDate"
              defaultValue={params.endDate ?? ""}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
            />
          </label>
          <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/audit" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module / Entity</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                    No audit entries match this filter.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-text">
                    {row.actorName ?? "System"}
                    {row.actorPersonId && (
                      <p className="font-mono text-[11px] text-text-muted" title={row.actorPersonId}>
                        {row.actorPersonId.slice(0, 8)}…
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{row.actorRoleCode ?? "—"}</td>
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
                    {row.beforeData || row.afterData ? (
                      <details>
                        <summary className="cursor-pointer text-[13px] font-semibold text-primary">
                          {row.detail ?? "View"}
                        </summary>
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
                      <span className="text-text-muted">{row.detail ?? "—"}</span>
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
              Page {page} of {totalPages}
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
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the Library audit trail</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
