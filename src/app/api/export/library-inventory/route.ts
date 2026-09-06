import { csvResponse, rowsToCsv } from "@/lib/csv";
import { getLibraryOverview } from "@/lib/library-api";

export async function GET() {
  const overview = await getLibraryOverview();
  const rows: { label: string; value: number }[] = [
    { label: "Total book titles", value: overview.totalBooks },
    { label: "Total physical copies", value: overview.totalCopies },
    { label: "Available", value: overview.availableCopies },
    { label: "Issued", value: overview.issuedCopies },
    { label: "Reserved", value: overview.reservedCopies },
    { label: "Lost", value: overview.lostCopies },
    { label: "Damaged", value: overview.damagedCopies },
    { label: "Under repair", value: overview.underRepairCopies },
    { label: "Retired", value: overview.retiredCopies },
  ];

  const csv = rowsToCsv(
    [
      { header: "Metric", value: (r) => r.label },
      { header: "Count", value: (r) => r.value },
    ],
    rows,
  );

  return csvResponse(csv, "library-inventory-report.csv");
}
