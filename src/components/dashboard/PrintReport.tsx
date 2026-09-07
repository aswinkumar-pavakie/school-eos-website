import { PrintButton } from "@/components/idcard/PrintButton";
import { formatDate } from "@/lib/format";

// Shared scaffolding for every print/PDF report (Finance, Inventory, Repair &
// Maintenance) -- a real @page rule (Tailwind's print: variant can't express
// one), a title/filter-summary header, and a table style that keeps rows
// intact across a page break instead of splitting a row's cells across two
// printed pages.

export function PrintReportStyles() {
  return (
    <style>{`
      @page { size: A4 landscape; margin: 14mm; }
      @media print {
        body { background: #fff; }
      }
      .report-table thead { display: table-header-group; }
      .report-table tr { break-inside: avoid; }
    `}</style>
  );
}

export function PrintReportHeader({
  title,
  subtitle,
  filterSummary,
  printLabel,
}: {
  title: string;
  subtitle?: string;
  filterSummary?: string;
  printLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:mb-4">
      <div>
        <h1 className="text-[22px] font-bold leading-[28px] text-text">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        {filterSummary && <p className="mt-1 text-xs text-text-muted">Filters: {filterSummary}</p>}
        <p className="mt-1 text-xs text-text-muted">Generated {formatDate(new Date().toISOString())}</p>
      </div>
      <PrintButton label={printLabel ?? "Print / Save as PDF"} />
    </div>
  );
}
