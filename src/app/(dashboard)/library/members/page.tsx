import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listEligibleMembers, listMemberGrades, listMemberSections, listMembers } from "@/lib/library-api";
import { statusLabel, statusTone } from "@/lib/format";
import { AddMemberModal } from "./AddMemberModal";

const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "INACTIVE"];
const MEMBER_TYPE_OPTIONS = ["STUDENT", "STAFF"];

export default async function LibraryMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; memberType?: string; gradeId?: string; sectionId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const [{ data: members, meta }, eligiblePeople, grades, sections] = await Promise.all([
      listMembers({
        search: params.search || undefined,
        status: params.status || undefined,
        memberType: params.memberType || undefined,
        gradeId: params.gradeId || undefined,
        sectionId: params.sectionId || undefined,
        page,
        limit: 50,
      }),
      listEligibleMembers(),
      listMemberGrades(),
      listMemberSections(params.gradeId || undefined),
    ]);
    const total = meta?.total ?? members.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.search) next.set("search", params.search);
      if (params.status) next.set("status", params.status);
      if (params.memberType) next.set("memberType", params.memberType);
      if (params.gradeId) next.set("gradeId", params.gradeId);
      if (params.sectionId) next.set("sectionId", params.sectionId);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/members?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Members</h1>
            <p className="mt-1 text-sm text-text-muted">{total} Library members</p>
          </div>
          <AddMemberModal eligiblePeople={eligiblePeople} />
        </div>

        <form action="/library/members" className="mt-6 flex flex-wrap items-end gap-3">
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by name…"
            className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect name="memberType" defaultValue={params.memberType ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Type: All</option>
            {MEMBER_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="status" defaultValue={params.status ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="gradeId" defaultValue={params.gradeId ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Grade: All</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="sectionId" defaultValue={params.sectionId ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Section: All</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </AutoSubmitSelect>
          <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/members" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Grade/Section</th>
                <th className="px-4 py-3 text-right">Issued</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-muted">No members match this filter.</td>
                </tr>
              )}
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    {member.firstName} {member.lastName ?? ""}
                    {member.identifier && <p className="text-xs font-normal text-text-muted">{member.identifier}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{member.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-text-muted">{member.memberType}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {member.gradeName ? `${member.gradeName}${member.sectionName ? ` · ${member.sectionName}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{member.activeIssuesCount}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {member.overdueCount > 0 ? (
                      <span className="font-semibold text-critical-text">{member.overdueCount}</span>
                    ) : (
                      <span className="text-text-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(member.status)} label={statusLabel(member.status)} />
                    {member.status === "SUSPENDED" && member.suspendedReason && (
                      <p className="mt-0.5 text-xs text-text-muted">{member.suspendedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/library/members/${member.id}`} className="text-[13px] font-semibold text-primary">
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
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">Next</Link>
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
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load members</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
