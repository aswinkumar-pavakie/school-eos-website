// Parent & Guardian list -- Design Architecture v0.1 module 04. A "parent" is a
// person holding an active PARENT role assignment; linking them to a specific child
// is done from the Student's own profile (GuardiansSection.tsx), not here -- this
// page only lists parents and shows how many children each is already linked to.
// Every row is real data from GET /parents -- no mock rows.

import Link from "next/link";
import { CreateParentModal } from "@/components/parents/CreateParentModal";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import {
  PrintSelectedBar,
  RowCheckbox,
  SelectAllCheckbox,
  SelectionProvider,
} from "@/components/dashboard/SelectableIdCards";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";

interface ParentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  status: string;
  childrenCount: number;
  photoUrl: string | null;
  occupation: string | null;
}

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("page", String(page));
  query.set("limit", "50");

  const res = await apiFetch(`/parents?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load parents</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: parents, meta } = (await res.json()) as {
    data: ParentRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/parents?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Parents</h1>
          <p className="mt-1 text-sm text-text-muted">{meta.total} parent accounts</p>
        </div>
        <CreateParentModal />
      </div>

      <form action="/admin/parents" className="mt-6 flex flex-wrap items-end gap-3">
        <AutoSubmitSearchInput
          type="search"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search by name, email or mobile…"
          className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
        <AutoSubmitSelect
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="ARCHIVED">Archived</option>
        </AutoSubmitSelect>
      </form>

      <SelectionProvider storageKey="id-card-selection:parents">
      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="w-10 px-4 py-3">
                <SelectAllCheckbox ids={parents.map((p) => p.id)} />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Occupation</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Children linked</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  No parents match this search.
                </td>
              </tr>
            )}
            {parents.map((parent) => (
              <tr key={parent.id}>
                <td className="px-4 py-3">
                  <RowCheckbox id={parent.id} />
                </td>
                <td className="px-4 py-3 font-semibold text-text">
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar
                      photoUrl={parent.photoUrl}
                      name={`${parent.firstName} ${parent.lastName ?? ""}`}
                      size={28}
                    />
                    {parent.firstName} {parent.lastName ?? ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">{parent.occupation ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">
                  {parent.mobile ?? parent.email ?? <span>—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{parent.childrenCount}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={parent.status === "ACTIVE" ? "success" : "critical"} label={parent.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/parents/${parent.id}`} className="text-[13px] font-semibold text-primary">
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
      <PrintSelectedBar basePath="/print/parents/id-cards" />
      </SelectionProvider>
    </div>
  );
}
