// Communities list -- Design Architecture v0.1 module 03 pattern reused: search +
// state chips + academic-year/state dropdowns + Apply, matching the Students page.

import Link from "next/link";
import { CreateCommunityModal } from "@/components/community/CreateCommunityModal";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";

interface CommunityRow {
  id: string;
  name: string;
  communityCategory: string;
  academicYearId: string;
  state: string;
  maxMembers: number | null;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

const STATE_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
];

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUSPENDED" || state === "ARCHIVED") return "critical";
  return "pending";
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string; state?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params.state) query.set("state", params.state);

  const [res, yearsRes] = await Promise.all([
    apiFetch(`/communities?${query.toString()}`),
    apiFetch("/academic-years"),
  ]);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load communities</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: communities } = (await res.json()) as { data: CommunityRow[] };
  const years = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const yearById = new Map(years.map((y) => [y.id, y.name]));
  const currentYear = years.find((y) => y.isCurrent);

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.academicYearId) next.set("academicYearId", params.academicYearId);
    if (params.state) next.set("state", params.state);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/community?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Communities</h1>
          <p className="mt-1 text-sm text-text-muted">{communities.length} communities</p>
        </div>
        <CreateCommunityModal years={years} defaultAcademicYearId={currentYear?.id} />
      </div>

      <form action="/admin/community" className="mt-6 flex flex-wrap items-end gap-3">
        {params.state && <input type="hidden" name="state" value={params.state} />}
        <AutoSubmitSelect
          name="academicYearId"
          defaultValue={params.academicYearId ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All academic years</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </AutoSubmitSelect>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATE_TABS.map((tab) => {
          const active = (params.state ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={hrefWith({ state: tab.value })}
              className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Academic year</th>
              <th className="px-4 py-3">Max members</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {communities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No communities match this filter.
                </td>
              </tr>
            )}
            {communities.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-semibold text-text">{c.name}</td>
                <td className="px-4 py-3 text-text-muted">{c.communityCategory}</td>
                <td className="px-4 py-3 text-text-muted">{yearById.get(c.academicYearId) ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">{c.maxMembers ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={stateTone(c.state)} label={c.state} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/community/${c.id}`} className="text-[13px] font-semibold text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
