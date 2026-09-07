import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatMoneySummary } from "@/lib/format";
import type { LibraryMemberListRow } from "@/lib/library-api";

export async function GET() {
  const { rows } = await fetchAllPages<LibraryMemberListRow>("/library/members", new URLSearchParams());

  const csv = rowsToCsv(
    [
      { header: "Member", value: (r) => `${r.firstName} ${r.lastName ?? ""}`.trim() },
      { header: "Type", value: (r) => r.memberType },
      { header: "Status", value: (r) => r.status },
      { header: "Books Issued", value: (r) => r.activeIssuesCount },
      { header: "Overdue", value: (r) => r.overdueCount },
      { header: "Outstanding Fines", value: (r) => formatMoneySummary(r.pendingFinesAmountPaise) },
    ],
    rows,
  );

  return csvResponse(csv, "library-member-activity-report.csv");
}
