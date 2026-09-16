// Reports -- pixel-rebuilt from the design's own screen (report-picker list
// + a live table on the right). Real backend has 3 narrow report endpoints
// (inventory/member-activity/transaction-history, CSV-only) that don't line
// up with the design's own 6 named reports -- so, per library-api.ts's own
// comment ("Inventory/Circulation/Overdue/Reservation/Lost & Damaged/Member
// Activity/Fine reports all call the SAME endpoints their own modules
// already expose"), every report table below is composed from real data the
// rest of this rebuild already fetches (listBooks/listIssues/listMembers),
// not a fake or placeholder row anywhere. PDF/Excel export has no real
// backend for any of these 6 specific tables (the 3 CSV routes that DO exist
// export a different shape) -- both buttons are kept, wired to an honest
// explainer rather than a broken or mismatched download.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { listBookCopies, listBooks, listIssues, listMembers } from "@/lib/library-api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { EmptyRow, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { ExportButtons } from "./ExportButtons";

const REPORTS = [
  { id: "inventory", name: "Inventory", desc: "Every title with copies, subject and current availability." },
  { id: "issued", name: "Issued books", desc: "Borrowings currently out, with member, class and due date." },
  { id: "returned", name: "Returned books", desc: "Receipts at the counter, including renewals and late returns." },
  { id: "overdue", name: "Overdue books", desc: "Copies past due, with days late and the fine each has run up." },
  { id: "nodues", name: "No-dues clearance list", desc: "Members with books or fines still pending." },
  { id: "accession", name: "Accession register", desc: "Every physical copy on record, with rack and cost." },
];

// Two more real, already-built reports the design doesn't picture -- kept
// reachable as their own full pages (each has real CSV export) rather than
// dropped, same "extra trailing items" approach as the sidebar's own "More"
// nav group.
const EXTRA_REPORTS = [
  { href: "/library/reports/member-activity", name: "Member activity", desc: "Per-member borrowing summary, exportable as CSV." },
  { href: "/library/reports/transaction-history", name: "Transaction history", desc: "The full operational event log, exportable as CSV." },
];

export default async function LibraryReportsPage({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const params = await searchParams;
  const reportId = REPORTS.some((r) => r.id === params.report) ? params.report! : "inventory";

  try {
    let title = "";
    let cols: string[] = [];
    let rows: string[][] = [];

    if (reportId === "inventory") {
      title = "Book inventory report";
      cols = ["Title", "Author", "ISBN", "Subject", "Total copies", "Available"];
      const { data: books } = await listBooks({ limit: 200 });
      rows = books.map((b) => [b.title, b.author, b.isbn ?? "—", b.categoryName ?? "—", String(b.copiesSummary.total), String(b.copiesSummary.available)]);
    } else if (reportId === "issued") {
      title = "Issued books report";
      cols = ["Accession", "Title", "Borrower", "Issued", "Due"];
      const { data: issues } = await listIssues({ status: "ISSUED", limit: 200 });
      rows = issues.map((i) => [i.copyCode, i.bookTitle, i.memberName, formatDate(i.issuedAt), formatDate(i.dueDate)]);
    } else if (reportId === "returned") {
      title = "Returned books report";
      cols = ["Accession", "Title", "Borrower", "Returned"];
      const { data: issues } = await listIssues({ status: "RETURNED", limit: 200 });
      rows = issues.map((i) => [i.copyCode, i.bookTitle, i.memberName, i.returnedAt ? formatDate(i.returnedAt) : "—"]);
    } else if (reportId === "overdue") {
      title = "Overdue books report";
      cols = ["Accession", "Title", "Student", "Due", "Days overdue", "Fine"];
      const { data: issues } = await listIssues({ overdueOnly: true, limit: 200 });
      rows = issues.map((i) => [i.copyCode, i.bookTitle, i.memberName, formatDate(i.dueDate), String(i.daysOverdue), formatMoneySummary(i.projectedFinePaise)]);
    } else if (reportId === "nodues") {
      title = "No-dues clearance list";
      cols = ["Member", "Roll / staff no.", "Class / role", "Books pending", "Standing"];
      const { data: members } = await listMembers({ limit: 200 });
      rows = members
        .filter((m) => m.activeIssuesCount > 0 || m.overdueCount > 0)
        .map((m) => [
          `${m.firstName} ${m.lastName ?? ""}`,
          m.identifier ?? "—",
          m.gradeName ? `${m.gradeName}${m.sectionName ? ` · ${m.sectionName}` : ""}` : m.memberType,
          String(m.activeIssuesCount),
          m.overdueCount > 0 ? "Overdue" : "Clear",
        ]);
    } else {
      title = "Accession register";
      cols = ["Accession", "Title", "Rack", "Acquired", "Cost", "Status"];
      const { data: books } = await listBooks({ limit: 200 });
      const perBook = await Promise.all(books.map((b) => listBookCopies(b.id)));
      rows = perBook.flatMap((copies, idx) =>
        copies.map((c) => [
          c.copyCode,
          books[idx].title,
          c.shelfLocation ?? "—",
          c.acquisitionDate ? formatDate(c.acquisitionDate) : "—",
          c.acquisitionCostPaise !== null && c.acquisitionCostPaise !== undefined ? formatMoneySummary(c.acquisitionCostPaise) : "—",
          c.status.charAt(0) + c.status.slice(1).toLowerCase().replace(/_/g, " "),
        ]),
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Reports</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Live operational reports, composed from real catalogue and circulation data.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 22, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340 }}>
            {REPORTS.map((r) => (
              <a
                key={r.id}
                href={`/library/reports?report=${r.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "18px 20px",
                  borderRadius: 12,
                  textDecoration: "none",
                  border: `1px solid ${reportId === r.id ? "var(--lib-primary)" : "var(--lib-border)"}`,
                  background: reportId === r.id ? "var(--lib-tint)" : "var(--lib-white)",
                }}
              >
                <span style={{ font: "600 17px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{r.name}</span>
                <span style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{r.desc}</span>
              </a>
            ))}
            {EXTRA_REPORTS.map((r) => (
              <a
                key={r.href}
                href={r.href}
                style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start", textAlign: "left", padding: "18px 20px", borderRadius: 12, textDecoration: "none", border: "1px solid var(--lib-border)", background: "var(--lib-white)" }}
              >
                <span style={{ font: "600 17px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{r.name}</span>
                <span style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{r.desc}</span>
              </a>
            ))}
          </div>

          <div className="lib-card-hover" style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 24, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, font: "600 22px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{title}</div>
              <ExportButtons />
            </div>
            <TableShell>
              <thead>
                <tr style={{ background: "var(--lib-panel)" }}>
                  {cols.map((c) => (
                    <Th key={c}>{c}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={cols.length} />}
                {rows.map((row, i) => (
                  <tr key={i} className="lib-row-hover">
                    {row.map((cell, j) => (
                      <Td key={j}>{cell}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Reports</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
