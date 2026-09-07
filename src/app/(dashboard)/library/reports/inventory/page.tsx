import { redirect } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview } from "@/lib/library-api";

export default async function LibraryInventoryReportPage() {
  try {
    // Same aggregate the Dashboard's own KPI row already computes -- this
    // report presents it as one exportable table, it doesn't recompute it.
    const overview = await getLibraryOverview();

    const rows: [string, number][] = [
      ["Total book titles", overview.totalBooks],
      ["Total physical copies", overview.totalCopies],
      ["Available", overview.availableCopies],
      ["Issued", overview.issuedCopies],
      ["Reserved", overview.reservedCopies],
      ["Lost", overview.lostCopies],
      ["Damaged", overview.damagedCopies],
      ["Under repair", overview.underRepairCopies],
      ["Retired", overview.retiredCopies],
    ];

    return (
      <div className="mx-auto max-w-[720px]">
        <BackLink href="/library/reports" label="Back to Reports" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Book Inventory Report</h1>
            <p className="mt-1 text-sm text-text-muted">Live copy-status breakdown across the whole catalog.</p>
          </div>
          <ExportCsvLink href="/api/export/library-inventory" />
        </div>

        <div className="mt-6 overflow-hidden rounded-[16px] border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-semibold text-text">{label}</td>
                  <td className="px-4 py-3 text-right font-mono text-text">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the inventory report</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
