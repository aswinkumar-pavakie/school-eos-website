// Phase 3 (Community Dashboard) -- a real, read-only summary of the EXISTING
// Communities/PTA feature (backend: src/modules/communities, already owned
// by Admin/writes + Principal/oversight-reads -- COMMUNITY was added to its
// class-level @Roles this phase, same read-only pattern as Principal's own
// addition in Phase 17). Deliberately dashboard-level only: a real aggregate
// count and breakdown, computed from the actual GET /communities response --
// no fabricated numbers, no new backend endpoint (list() already returns
// everything needed). The full communities list/detail/member-management UI
// is Phase 4's business module, not built here.
//
// Phase 10 extends this same page (no second dashboard, no /community/dashboard
// route) with the authenticated Community's OWN operational overview: proposals
// (Phase 5) and activities (Phase 6-9). Both GET /community-proposals and
// GET /community-initiatives already resolve "their" community server-side
// (resolveAuthorizedCommunityId, never a client-supplied id) -- this page just
// aggregates the same rows the Proposals/Activities pages already render, so
// the numbers can never disagree with those pages. Three independent fetches,
// each with its own error/empty state, so one failing section never blanks the
// whole dashboard (spec: "partial data where applicable").

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, statusLabel, statusTone } from "@/lib/format";

interface CommunityRow {
  id: string;
  name: string;
  communityCategory: string;
  state: string;
}
interface ProposalRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}
interface InitiativeRow {
  id: string;
  title: string;
  status: string;
  plannedDate: string | null;
  completedAt: string | null;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function countBy(rows: CommunityRow[], key: "state" | "communityCategory"): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label: humanize(label), count }))
    .sort((a, b) => b.count - a.count);
}

async function fetchList<T>(path: string): Promise<{ rows: T[] } | { error: true }> {
  const res = await apiFetch(path);
  if (!res.ok) return { error: true };
  const { data } = (await res.json()) as { data: T[] };
  return { rows: data };
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{value}</p>
    </div>
  );
}

export default async function CommunityDashboardPage() {
  const [communitiesResult, proposalsResult, initiativesResult] = await Promise.all([
    fetchList<CommunityRow>("/communities"),
    fetchList<ProposalRow>("/community-proposals"),
    fetchList<InitiativeRow>("/community-initiatives"),
  ]);

  return (
    <div>
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Dashboard</h1>

      {/* ===== Phase 10: authenticated Community's own operational overview ===== */}
      <section className="mt-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Your community</h2>
        <p className="mt-1 text-sm text-text-muted">Your proposals and activities.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/community/proposals"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
          >
            View proposals
          </Link>
          <Link
            href="/community/activities"
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
          >
            View activities
          </Link>
        </div>

        {"error" in proposalsResult ? (
          <div className="mt-4">
            <ErrorState message="Couldn't load your proposals. Nothing was changed — try refreshing the page." />
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.09em] text-text-muted">Proposals</h3>
            {proposalsResult.rows.length === 0 ? (
              <div className="mt-2 rounded-[14px] border border-dashed border-border bg-surface px-4 py-6 text-center">
                <p className="text-sm font-bold text-text">No proposals yet</p>
                <p className="mt-1 text-sm text-text-muted">Submit one from the Proposals page.</p>
              </div>
            ) : (
              <>
                <div className="mt-2 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                  <Tile label="Total" value={proposalsResult.rows.length} />
                  <Tile
                    label="Pending"
                    value={proposalsResult.rows.filter((p) => p.status === "PENDING").length}
                  />
                  <Tile
                    label="Approved"
                    value={proposalsResult.rows.filter((p) => p.status === "APPROVED").length}
                  />
                </div>

                <h4 className="mt-4 text-xs font-bold uppercase tracking-[0.09em] text-text-muted">Recent proposals</h4>
                <ul className="mt-2 divide-y divide-border rounded-[14px] border border-border bg-surface">
                  {proposalsResult.rows.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate font-semibold text-text">{p.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-text-muted">{formatDate(p.createdAt)}</span>
                        <StatusPill tone={statusTone(p.status)} label={statusLabel(p.status)} />
                        <Link href={`/community/proposals/${p.id}`} className="font-semibold text-primary">
                          View
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {"error" in initiativesResult ? (
          <div className="mt-4">
            <ErrorState message="Couldn't load your activities. Nothing was changed — try refreshing the page." />
          </div>
        ) : (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.09em] text-text-muted">Activities</h3>
            {initiativesResult.rows.length === 0 ? (
              <div className="mt-2 rounded-[14px] border border-dashed border-border bg-surface px-4 py-6 text-center">
                <p className="text-sm font-bold text-text">No activities yet</p>
                <p className="mt-1 text-sm text-text-muted">Activities are initialized from an approved proposal.</p>
              </div>
            ) : (
              <>
                <div className="mt-2 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                  <Tile label="Total" value={initiativesResult.rows.length} />
                  <Tile
                    label="Planned"
                    value={initiativesResult.rows.filter((a) => a.status === "PLANNED").length}
                  />
                  <Tile
                    label="In progress"
                    value={initiativesResult.rows.filter((a) => a.status === "IN_PROGRESS").length}
                  />
                  <Tile
                    label="Completed"
                    value={initiativesResult.rows.filter((a) => a.status === "COMPLETED").length}
                  />
                </div>

                {initiativesResult.rows.some((a) => a.status === "IN_PROGRESS") && (
                  <>
                    <h4 className="mt-4 text-xs font-bold uppercase tracking-[0.09em] text-text-muted">Active now</h4>
                    <ul className="mt-2 divide-y divide-border rounded-[14px] border border-border bg-surface">
                      {initiativesResult.rows
                        .filter((a) => a.status === "IN_PROGRESS")
                        .map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <span className="truncate font-semibold text-text">{a.title}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              <StatusPill tone={statusTone(a.status)} label={statusLabel(a.status)} />
                              <Link href={`/community/activities/${a.id}`} className="font-semibold text-primary">
                                View
                              </Link>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}

                {initiativesResult.rows.some((a) => a.status === "COMPLETED") && (
                  <>
                    <h4 className="mt-4 text-xs font-bold uppercase tracking-[0.09em] text-text-muted">
                      Recently completed
                    </h4>
                    <ul className="mt-2 divide-y divide-border rounded-[14px] border border-border bg-surface">
                      {initiativesResult.rows
                        .filter((a) => a.status === "COMPLETED")
                        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
                        .slice(0, 5)
                        .map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <span className="truncate font-semibold text-text">{a.title}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-text-muted">{formatDate(a.completedAt)}</span>
                              <Link href={`/community/activities/${a.id}`} className="font-semibold text-primary">
                                View
                              </Link>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ===== Phase 3: read-only overview of the school's communities ===== */}
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">All communities</h2>
        <p className="mt-1 text-sm text-text-muted">Read-only overview of the school's communities.</p>

        {"error" in communitiesResult ? (
          <div className="mt-4">
            <ErrorState message="Couldn't load communities. Nothing was changed — try refreshing the page." />
          </div>
        ) : communitiesResult.rows.length === 0 ? (
          <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-6 py-16 text-center">
            <p className="text-[15px] font-extrabold leading-[20px] text-text">No communities yet</p>
            <p className="mt-1.5 max-w-sm text-sm leading-[19px] text-text-muted">
              None have been created. Community management itself is a later phase.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              <Tile label="Total communities" value={communitiesResult.rows.length} />
              <Tile
                label="Active"
                value={communitiesResult.rows.filter((c) => c.state === "ACTIVE").length}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <section className="rounded-[16px] border border-border bg-surface p-[18px]">
                <h3 className="text-[15px] font-extrabold leading-[20px] text-text">By status</h3>
                <ul className="mt-3 flex flex-col divide-y divide-border">
                  {countBy(communitiesResult.rows, "state").map((row) => (
                    <li key={row.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-text">{row.label}</span>
                      <span className="font-mono text-text-muted">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-[16px] border border-border bg-surface p-[18px]">
                <h3 className="text-[15px] font-extrabold leading-[20px] text-text">By category</h3>
                <ul className="mt-3 flex flex-col divide-y divide-border">
                  {countBy(communitiesResult.rows, "communityCategory").map((row) => (
                    <li key={row.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-text">{row.label}</span>
                      <span className="font-mono text-text-muted">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
