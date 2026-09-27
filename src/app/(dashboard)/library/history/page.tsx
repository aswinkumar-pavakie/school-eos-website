// Borrowing history -- pixel-rebuilt from the design's own screen. Real
// loan status is ISSUED/RETURNED/OVERDUE/LOST -- there is no "Damaged" loan
// status (damage is tracked on the COPY, not the loan; a damaged copy's
// underlying loan still just reads RETURNED or ISSUED) -- so the design's
// own "Damaged" history tab is dropped, not faked. "Fine" per row comes
// from the real library_fine table (matched to its issue by issueId, since
// listFines has no issueId filter of its own); "Class" comes from each
// member's own real gradeName/sectionName, fetched once per unique member
// shown (a genuinely small real dataset -- confirmed 10 issues / 21 members
// live).

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getMember, listFines, listIssues } from "@/lib/library-api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AutoSubmitSearchInput } from "@/components/dashboard/AutoSubmitFilter";
import { EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";

const TABS: { key: string; label: string; status?: string }[] = [
  { key: "All", label: "All" },
  { key: "Borrowed", label: "Borrowed", status: "ISSUED" },
  { key: "Returned", label: "Returned", status: "RETURNED" },
  { key: "Overdue", label: "Overdue", status: "OVERDUE" },
  { key: "Lost", label: "Lost", status: "LOST" },
];

export default async function LibraryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((t) => t.key === params.tab) ? params.tab! : "All";

  try {
    const [{ data: issues }, { data: fines }] = await Promise.all([
      listIssues({ search: params.search || undefined, status: TABS.find((t) => t.key === tab)?.status, limit: 200 }),
      listFines({ limit: 200 }),
    ]);
    const fineByIssue = new Map(fines.map((f) => [f.issueId, f]));

    const uniqueMemberIds = [...new Set(issues.map((i) => i.memberId))];
    const members = await Promise.all(uniqueMemberIds.map((id) => getMember(id).catch(() => null)));
    const memberById = new Map(uniqueMemberIds.map((id, i) => [id, members[i]]));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Borrowing history</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            Every borrowing closed or open — borrowed, returned, overdue and lost, with how each was settled.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`/library/history?tab=${t.key}${params.search ? `&search=${encodeURIComponent(params.search)}` : ""}`}
              style={{ padding: "11px 24px", borderRadius: 8, textDecoration: "none", font: "500 15px/1.2 var(--lib-font-sans)", background: tab === t.key ? "var(--lib-white)" : "transparent", color: tab === t.key ? "var(--lib-ink)" : "var(--lib-body-muted)" }}
            >
              {t.label}
            </a>
          ))}
        </div>

        <form action="/library/history" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <input type="hidden" name="tab" value={tab} />
          <div style={{ flex: 1, minWidth: 240, maxWidth: 460, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#8593a8" strokeWidth={1.7}>
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
        </form>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Book</Th>
              <Th>Borrower</Th>
              <Th>Borrowed</Th>
              <Th>Due</Th>
              <Th>Returned</Th>
              <Th>Status</Th>
              <Th>Fine</Th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 && <EmptyRow colSpan={7} />}
            {issues.map((issue) => {
              const member = memberById.get(issue.memberId);
              const fine = fineByIssue.get(issue.id);
              return (
                <tr key={issue.id} className="lib-row-hover">
                  <Td>
                    <div style={{ font: "500 15px/1.4 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{issue.bookTitle}</div>
                    <div className="lib-font-mono" style={{ font: "400 13px/1.5 var(--lib-font-mono)", color: "var(--lib-body-muted)" }}>{issue.copyCode}</div>
                  </Td>
                  <Td>
                    <div style={{ font: "400 15px/1.4 var(--lib-font-sans)", color: "var(--lib-body)" }}>{issue.memberName}</div>
                    <div style={{ font: "400 13px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
                      {member?.gradeName ? `${member.gradeName}${member.sectionName ? ` · ${member.sectionName}` : ""}` : member?.memberType ?? "—"}
                    </div>
                  </Td>
                  <Td>{formatDate(issue.issuedAt)}</Td>
                  <Td>{formatDate(issue.dueDate)}</Td>
                  <Td>{issue.returnedAt ? formatDate(issue.returnedAt) : "—"}</Td>
                  <Td>
                    <Pill label={issue.status === "ISSUED" ? "Borrowed" : issue.status.charAt(0) + issue.status.slice(1).toLowerCase()} />
                  </Td>
                  <Td mono>{fine ? formatMoneySummary(fine.amountPaise) : "₹0.00"}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
        <div style={{ font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
          Showing 1–{issues.length} of {issues.length} borrowings
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Borrowing history</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
