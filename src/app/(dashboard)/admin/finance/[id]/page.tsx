// Fee Structure detail -- lines and derived total, read-only. Write operations
// (publish/supersede lifecycle, add/edit/remove lines) live in the dedicated
// Finance/Accounts login being built separately; Admin only needs visibility
// here. Revisit once that module is in place.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { FeeStructureLinesPanel, type FeeStructureLine } from "@/components/finance/FeeStructureLinesPanel";
import { apiFetch } from "@/lib/api";
import { formatMoneySummary } from "@/lib/format";

interface FeeStructureDetail {
  id: string;
  academicYearId: string;
  gradeId: string;
  mediumId: string | null;
  category: string | null;
  totalPaise: string;
  state: string;
  lines: FeeStructureLine[];
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUPERSEDED") return "critical";
  return "pending";
}

export default async function FeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [res, feeHeadsRes, yearsRes, gradesRes, mediumsRes] = await Promise.all([
    apiFetch(`/fee-structures/${id}`),
    apiFetch("/fee-heads"),
    apiFetch("/academic-years"),
    apiFetch("/grades"),
    apiFetch("/mediums"),
  ]);

  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this fee structure</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: structure } = (await res.json()) as { data: FeeStructureDetail };
  const feeHeads = feeHeadsRes.ok ? (await feeHeadsRes.json()).data : [];
  const academicYears = yearsRes.ok ? (await yearsRes.json()).data : [];
  const grades = gradesRes.ok ? (await gradesRes.json()).data : [];
  const mediums = mediumsRes.ok ? (await mediumsRes.json()).data : [];

  const yearName = academicYears.find((y: { id: string }) => y.id === structure.academicYearId)?.name ?? "—";
  const gradeName = grades.find((g: { id: string }) => g.id === structure.gradeId)?.name ?? "—";
  const mediumName = structure.mediumId
    ? mediums.find((m: { id: string }) => m.id === structure.mediumId)?.name ?? "—"
    : null;

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/admin/finance?tab=structures" label="Back to Finance" />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {yearName} · {gradeName}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {structure.category ?? "General"}
            {mediumName && ` · ${mediumName} medium`}
          </p>
          <div className="mt-2">
            <StatusPill tone={stateTone(structure.state)} label={structure.state.replace(/_/g, " ")} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Total</p>
          <p className="font-mono text-[24px] font-extrabold leading-[28px] text-text">
            {formatMoneySummary(structure.totalPaise)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <FeeStructureLinesPanel
          structureId={structure.id}
          lines={structure.lines}
          feeHeads={feeHeads}
          editable={structure.state === "DRAFT"}
        />
      </div>
    </div>
  );
}
