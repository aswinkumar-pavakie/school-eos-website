import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listAcademicYears, listFeeHeads, listFeeStructures, listGrades, listMediums } from "@/lib/finance-api";
import { CreateFeeStructureModal } from "./CreateFeeStructureModal";

const STATE_OPTIONS = ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "SUPERSEDED"];

export default async function FeeStructuresPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string; gradeId?: string; state?: string }>;
}) {
  const { academicYearId, gradeId, state } = await searchParams;
  try {
    const [{ data: structures }, feeHeads, grades, academicYears, mediums] = await Promise.all([
      listFeeStructures({ academicYearId: academicYearId || undefined, gradeId: gradeId || undefined, state: state || undefined, pageSize: 200 }),
      listFeeHeads(),
      listGrades(),
      listAcademicYears(),
      listMediums(),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Fee Structures</h1>
            <p className="mt-1 text-sm text-text-muted">One structure per grade, medium and academic year, built from Fee Structure Items.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/fee-heads">
              <PlainButton variant="secondary">Manage fee structure items</PlainButton>
            </Link>
            <CreateFeeStructureModal feeHeads={feeHeads} grades={grades} academicYears={academicYears} mediums={mediums} />
          </div>
        </div>

        <form action="/finance/fee-structures" className="flex flex-wrap items-center gap-3">
          <select name="academicYearId" defaultValue={academicYearId ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Academic Year: All</option>
            {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select name="gradeId" defaultValue={gradeId ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Grade: All</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/fee-structures" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {structures.length === 0 ? (
          <EmptyState title="No fee structures yet" body="Create one to start generating obligations against it." />
        ) : (
          <DataTable
            getKey={(s) => s.id}
            rows={structures}
            columns={[
              { header: "Category", render: (s) => <Link href={`/finance/fee-structures/${s.id}`} className="font-bold text-primary hover:underline">{s.category ?? "—"}</Link> },
              { header: "Grade", render: (s) => s.gradeName ?? "—" },
              { header: "Academic year", render: (s) => s.academicYearName ?? "—" },
              { header: "Total", align: "right", render: (s) => formatMoneySummary(s.totalPaise) },
              { header: "Status", render: (s) => <StatusPill state={s.state} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load fee structures. Nothing was submitted — try again." />;
  }
}
