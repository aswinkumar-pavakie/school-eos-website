// Returns & renewals -- pixel-rebuilt from the design's own screen. Only
// active loans (ISSUED/OVERDUE) belong here -- the design's own status
// select is "all"/"Borrowed"/"Overdue", never Returned/Lost, which live on
// Borrowing history instead.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { listIssues } from "@/lib/library-api";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { formatDate } from "@/lib/format";
import { EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { ReturnRowActions } from "./ReturnRowActions";

export default async function LibraryReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";

  try {
    const { data: issues } = await listIssues({
      search: params.search || undefined,
      status: status === "Borrowed" ? "ISSUED" : status === "Overdue" ? "OVERDUE" : undefined,
      limit: 200,
    });
    // "all" here means "every still-open loan" -- ISSUED + OVERDUE, never
    // RETURNED/LOST (those live on Borrowing history).
    const rows = status === "all" ? issues.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE") : issues;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Returns & renewals</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            Receive copies, renew borrowings and settle overdue, lost or damaged items.
          </div>
        </div>

        <form action="/library/returns" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 460, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth={1.7}>
              <circle cx="9" cy="9" r="5.6" />
              <path d="M13.2 13.2L17 17" />
            </svg>
            <AutoSubmitSearchInput
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search by book, accession, borrower or class"
              style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
            />
          </div>
          <AutoSubmitSelect
            name="status"
            defaultValue={status}
            style={{ padding: "13px 14px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", background: "var(--lib-white)", minWidth: 190 }}
          >
            <option value="all">All statuses</option>
            <option value="Borrowed">Borrowed</option>
            <option value="Overdue">Overdue</option>
          </AutoSubmitSelect>
        </form>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Book</Th>
              <Th>Borrower</Th>
              <Th>Issue / renewals</Th>
              <Th>Status</Th>
              <Th>Due date</Th>
              <th style={{ padding: "14px 18px" }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={6} />}
            {rows.map((issue) => (
              <tr key={issue.id} className="lib-row-hover">
                <Td>
                  <div style={{ font: "500 15px/1.4 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{issue.bookTitle}</div>
                  <div className="lib-font-mono" style={{ font: "400 13px/1.5 var(--lib-font-mono)", color: "var(--lib-body-muted)" }}>{issue.copyCode}</div>
                </Td>
                <Td>
                  <div style={{ font: "400 15px/1.4 var(--lib-font-sans)", color: "var(--lib-body)" }}>{issue.memberName}</div>
                </Td>
                <Td>{formatDate(issue.issuedAt)} · {issue.renewedCount} renewal(s)</Td>
                <Td>
                  <Pill label={issue.status === "OVERDUE" ? "Overdue" : "Borrowed"} />
                </Td>
                <Td>{formatDate(issue.dueDate)}</Td>
                <Td align="right">
                  <ReturnRowActions issue={issue} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Returns &amp; renewals</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
