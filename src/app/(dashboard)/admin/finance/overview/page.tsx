// Admin -> Finance: Fee Overview + Fee Status -- read-only monitoring for
// school administration (sections 1, 3, 7, 10 of the Admin Finance spec).
// Collections, refunds, adjustments and reconciliation are Finance's own
// operational responsibilities and are not, and must not be, reachable here.

import Link from "next/link";
import { FinanceTabBar } from "@/components/finance/FinanceTabBar";
import { FeeStatusFilterBar } from "@/components/finance/FeeStatusFilterBar";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FinanceIcon } from "@/components/dashboard/icons";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface FeeDemandRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  feeHeadName: string | null;
  amountPaise: string;
  paidPaise: string;
  pendingPaise: string;
  dueDate: string;
  state: string;
}

interface OverviewCounts {
  totalFeesPaise: string;
  totalCollectedPaise: string;
  totalPendingPaise: string;
  totalOutstandingPaise: string;
  totalOverduePaise: string;
  studentsWithPendingCount: number;
  studentsWithOverdueCount: number;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

const STATE_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "WAIVED", label: "Waived" },
];

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "PAID" || state === "WAIVED") return "success";
  if (state === "OVERDUE") return "critical";
  return "pending";
}

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    academicYearId?: string;
    gradeId?: string;
    sectionId?: string;
    state?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params.gradeId) query.set("gradeId", params.gradeId);
  if (params.sectionId) query.set("sectionId", params.sectionId);
  if (params.state) query.set("state", params.state);
  query.set("page", String(page));
  query.set("limit", "50");

  const overviewQuery = new URLSearchParams();
  if (params.academicYearId) overviewQuery.set("academicYearId", params.academicYearId);

  const [demandsRes, overviewRes, yearsRes, gradesRes, sectionsRes] = await Promise.all([
    apiFetch(`/fee-demands?${query.toString()}`),
    apiFetch(`/fee-overview?${overviewQuery.toString()}`),
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
  ]);

  if (!demandsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Finance overview</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: demands, meta } = (await demandsRes.json()) as {
    data: FeeDemandRow[];
    meta: { page: number; limit: number; total: number };
  };
  const overview: OverviewCounts | null = overviewRes.ok
    ? ((await overviewRes.json()) as { data: OverviewCounts }).data
    : null;
  const academicYears: AcademicYear[] = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.academicYearId) next.set("academicYearId", params.academicYearId);
    if (params.gradeId) next.set("gradeId", params.gradeId);
    if (params.sectionId) next.set("sectionId", params.sectionId);
    if (params.state) next.set("state", params.state);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/finance/overview?${next.toString()}`;
  }

  // Same filters as the list itself, honoured by both the print report and
  // the CSV export -- "print/export what I'm currently looking at", not
  // always everything.
  function filterQuery() {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params.gradeId) q.set("gradeId", params.gradeId);
    if (params.sectionId) q.set("sectionId", params.sectionId);
    if (params.state) q.set("state", params.state);
    return q.toString();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Finance &amp; Fees</h1>
          <p className="mt-1 text-sm text-text-muted">
            Fee collection visibility for school administration — view-only. Collecting payments, refunds,
            adjustments and reconciliation are Finance/Accounts operations, not part of this view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/finance/fee-status?${filterQuery()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
          >
            Print / PDF
          </Link>
          <ExportCsvLink href={`/api/export/finance-fee-status?${filterQuery()}`} />
        </div>
      </div>
      <FinanceTabBar active="Overview" />

      {overview && (
        <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard eyebrow="Total fees" value={formatMoneySummary(overview.totalFeesPaise)} detail="All non-cancelled demands" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Collected" value={formatMoneySummary(overview.totalCollectedPaise)} detail="Paid so far" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Pending" value={formatMoneySummary(overview.totalPendingPaise)} detail="Not yet due-passed" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Outstanding" value={formatMoneySummary(overview.totalOutstandingPaise)} detail="Pending + partial + overdue" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Overdue" value={formatMoneySummary(overview.totalOverduePaise)} detail="Past due, unpaid" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Students pending" value={String(overview.studentsWithPendingCount)} detail="Have a pending instalment" icon={<FinanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Students overdue" value={String(overview.studentsWithOverdueCount)} detail="Have an overdue instalment" icon={<FinanceIcon className="h-5 w-5" />} />
        </div>
      )}

      <FeeStatusFilterBar
        search={params.search ?? ""}
        academicYearId={params.academicYearId ?? ""}
        gradeId={params.gradeId ?? ""}
        sectionId={params.sectionId ?? ""}
        state={params.state}
        academicYears={academicYears}
        grades={grades}
        sections={sections}
      />

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATE_TABS.map((tab) => {
          const active = (params.state ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={hrefWith({ state: tab.value, page: "1" })}
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
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Fee type</th>
              <th className="px-4 py-3">Total fee</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {demands.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-text-muted">
                  No fee demands match this filter.
                </td>
              </tr>
            )}
            {demands.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold text-text">
                  <Link href={`/admin/students/${d.studentId}`} className="hover:underline">
                    {d.studentFirstName} {d.studentLastName ?? ""}
                  </Link>
                  <p className="font-mono text-xs font-normal text-text-muted">{d.admissionNo}</p>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {d.gradeName ? `${d.gradeName} · ${d.sectionName}` : "—"}
                </td>
                <td className="px-4 py-3 text-text-muted">{d.feeHeadName ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{formatMoneySummary(d.amountPaise)}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-text-muted">{formatMoneySummary(d.paidPaise)}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{formatMoneySummary(d.pendingPaise)}</td>
                <td className="px-4 py-3 text-text-muted">{formatDate(d.dueDate)}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={stateTone(d.state)} label={d.state.charAt(0) + d.state.slice(1).toLowerCase()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages} ({meta.total} instalments)
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
