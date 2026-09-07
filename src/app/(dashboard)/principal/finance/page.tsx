// Principal -> Finance: Fee Heads & Structures -- read-only mirror of Admin's
// own /admin/finance page. FinanceTabs has no create/edit controls at all
// (write operations live in Finance's own module) so it's reused verbatim,
// unmodified, exactly as Admin uses it.

import { FinanceTabBar } from "@/components/finance/FinanceTabBar";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import { apiFetch } from "@/lib/api";

export default async function PrincipalFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; academicYearId?: string; gradeId?: string; state?: string }>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.academicYearId) query.set("academicYearId", params.academicYearId);
  if (params.gradeId) query.set("gradeId", params.gradeId);
  if (params.state) query.set("state", params.state);

  const [feeHeadsRes, feeStructuresRes, yearsRes, gradesRes, mediumsRes] = await Promise.all([
    apiFetch("/fee-heads"),
    apiFetch(`/fee-structures?${query.toString()}`),
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/mediums"),
  ]);

  if (!feeHeadsRes.ok || !feeStructuresRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Finance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: feeHeads } = await feeHeadsRes.json();
  const { data: feeStructures } = await feeStructuresRes.json();
  const academicYears = yearsRes.ok ? (await yearsRes.json()).data : [];
  const grades = gradesRes.ok ? (await gradesRes.json()).data : [];
  const mediums = mediumsRes.ok ? (await mediumsRes.json()).data : [];

  const filters = {
    academicYearId: params.academicYearId,
    gradeId: params.gradeId,
    state: params.state,
  };
  const initialTab = params.tab === "structures" ? "Fee Structures" : "Fee Heads";

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Finance &amp; Fees</h1>
      <p className="mt-1 text-sm text-text-muted">
        Fee heads and fee structures — view-only. Collections, receipts and reconciliation are Accounts operations,
        not part of this view.
      </p>
      <FinanceTabBar active="Fee Heads & Structures" basePath="/principal/finance" />
      <div className="mt-6">
        <FinanceTabs
          feeHeads={feeHeads}
          feeStructures={feeStructures}
          academicYears={academicYears}
          grades={grades}
          mediums={mediums}
          filters={filters}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}
