// Community -> Activities (Phase 6, extended by Phase 8 with a summary +
// status filter -- this IS the activity history view; no separate route was
// needed since this page already lists every activity regardless of status).
// Backend entity is community_initiative (see 0010_community_initiatives.sql
// for the naming note) -- user-facing label stays "Activities". Summary tiles
// and the filtered table both come from the exact same single fetch, so they
// can never disagree (Phase 8's own "report correctness" requirement) -- no
// second API call, no independent counters, no new backend endpoint.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateInitiativeForm } from "@/components/community/CreateInitiativeForm";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface InitiativeRow {
  id: string;
  communityName: string;
  title: string;
  status: string;
  plannedDate: string | null;
  createdAt: string;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
}

const STATUS_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  return "pending";
}

export default async function CommunityActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const [initiativesRes, proposalsRes] = await Promise.all([
    apiFetch("/community-initiatives"),
    apiFetch("/community-proposals"),
  ]);

  if (!initiativesRes.ok) {
    return (
      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Activities</h1>
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load activities</p>
          <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: initiatives } = (await initiativesRes.json()) as { data: InitiativeRow[] };
  const proposals: ProposalRow[] = proposalsRes.ok ? ((await proposalsRes.json()) as { data: ProposalRow[] }).data : [];
  const approvedProposals = proposals.filter((p) => p.status === "APPROVED");

  // Summary always reflects the FULL list -- computed before the status
  // filter below is applied, so the tiles and the filtered table can never
  // show inconsistent numbers.
  const summary = {
    total: initiatives.length,
    planned: initiatives.filter((a) => a.status === "PLANNED").length,
    inProgress: initiatives.filter((a) => a.status === "IN_PROGRESS").length,
    completed: initiatives.filter((a) => a.status === "COMPLETED").length,
  };

  const visible = params.status ? initiatives.filter((a) => a.status === params.status) : initiatives;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Activities</h1>
          <p className="mt-1 text-sm text-text-muted">
            {initiatives.length > 0 ? `For ${initiatives[0].communityName}` : "Your community's activities"}
          </p>
        </div>
        <CreateInitiativeForm approvedProposals={approvedProposals} />
      </div>

      {initiatives.length > 0 && (
        <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div className="rounded-[14px] border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-text-muted">Total</p>
            <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{summary.total}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-text-muted">Planned</p>
            <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{summary.planned}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-text-muted">In progress</p>
            <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{summary.inProgress}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-text-muted">Completed</p>
            <p className="mt-1 text-[22px] font-extrabold leading-[26px] text-text">{summary.completed}</p>
          </div>
        </div>
      )}

      {initiatives.length === 0 ? (
        <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">No activities yet</p>
          <p className="mt-1.5 max-w-sm text-sm leading-[19px] text-text-muted">
            Once a proposal is approved, initialize it here to start tracking the activity.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-2 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const active = (params.status ?? undefined) === tab.value;
              const href = tab.value ? `/community/activities?status=${tab.value}` : "/community/activities";
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    active ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 overflow-x-auto rounded-[16px] border border-border bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Planned date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-text-muted">
                      No activities match this filter.
                    </td>
                  </tr>
                )}
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-semibold text-text">{a.title}</td>
                    <td className="px-4 py-3 text-text-muted">{a.plannedDate ? formatDate(a.plannedDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusTone(a.status)} label={a.status.replace(/_/g, " ")} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/community/activities/${a.id}`} className="text-[13px] font-semibold text-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
