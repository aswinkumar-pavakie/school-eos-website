// Overdue & fines -- pixel-rebuilt from the design's own screen. Real
// library_fine rows cover THREE reasons (OVERDUE/LOST/DAMAGED); this screen
// takes only OVERDUE ones -- LOST/DAMAGED fines belong to (and already
// appear on) the Lost & damaged screen, matching the design's own split
// between the two nav items. "Days overdue" isn't a stored field on a fine
// (only on a still-open issue's live isOverdue/daysOverdue), so it's derived
// honestly from the real numbers that ARE stored: amountPaise ÷ the real
// finePerDayPaise rate -- the same arithmetic the backend itself used to
// assess the fine (see Issue books' own "Fine ₹X per day" hint). The
// design's "Collect" cash action doesn't exist for a still-registered fine
// in this system -- real collection is Finance's job (library_fine.status
// SENT_TO_FINANCE/PAID), so the button calls the real sendFineToFinance
// action, worded for what actually happens. "Send overdue reminders" has no
// real backend action anywhere (confirmed) -- kept as a real, honest
// explainer instead of a no-op fake send.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getIssue, getLibraryConfig, getMember, listFines } from "@/lib/library-api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { FineRowAction } from "./FineRowAction";
import { SendRemindersButton } from "./SendRemindersButton";

export default async function LibraryOverdueFinesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; classId?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "collected" ? "collected" : "unpaid";

  try {
    const [{ data: allFines }, config] = await Promise.all([listFines({ limit: 200 }), getLibraryConfig()]);
    const overdueFines = allFines.filter((f) => f.reason === "OVERDUE");
    const finePerDay = Number(config.finePerDayPaise) || undefined;

    const enriched = await Promise.all(
      overdueFines.map(async (fine) => {
        const [issue, member] = await Promise.all([
          getIssue(fine.issueId).catch(() => null),
          getMember(fine.memberId).catch(() => null),
        ]);
        return { fine, issue, member };
      }),
    );

    const q = (params.search ?? "").trim().toLowerCase();
    const filtered = enriched.filter(({ fine, issue }) => {
      if (!q) return true;
      const haystack = `${issue?.bookTitle ?? ""} ${issue?.copyCode ?? ""} ${fine.memberName}`.toLowerCase();
      return haystack.includes(q);
    });

    const view = filtered.filter(({ fine }) =>
      tab === "unpaid" ? fine.status === "PENDING" || fine.status === "SENT_TO_FINANCE" || fine.status === "PARTIALLY_PAID" : fine.status === "PAID" || fine.status === "WAIVED" || fine.status === "CANCELLED",
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Overdue & fines</h1>
            <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
              Copies past due, the fine each has run up, and how it was settled.
            </div>
          </div>
          <SendRemindersButton />
        </div>

        <form action="/library/fines" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="tab" value={tab} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)", alignSelf: "stretch", width: "fit-content" }}>
            <TabLink active={tab === "unpaid"} href="/library/fines?tab=unpaid">
              Unpaid
            </TabLink>
            <TabLink active={tab === "collected"} href="/library/fines?tab=collected">
              Collected
            </TabLink>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240, maxWidth: 460, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth={1.7}>
                <circle cx="9" cy="9" r="5.6" />
                <path d="M13.2 13.2L17 17" />
              </svg>
              <AutoSubmitSearchInput
                type="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search by title, accession or student"
                style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
              />
            </div>
          </div>
        </form>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Accession</Th>
              <Th>Title</Th>
              <Th>Student</Th>
              <Th>Due date</Th>
              <Th>Days overdue</Th>
              <Th>Fine</Th>
              <th style={{ padding: "14px 18px" }} />
            </tr>
          </thead>
          <tbody>
            {view.length === 0 && <EmptyRow colSpan={7} />}
            {view.map(({ fine, issue, member }) => {
              const days = finePerDay ? Math.round(Number(fine.amountPaise) / finePerDay) : null;
              return (
                <tr key={fine.id} className="lib-row-hover">
                  <Td mono>{issue?.copyCode ?? "—"}</Td>
                  <Td>{issue?.bookTitle ?? "—"}</Td>
                  <Td>
                    {fine.memberName}
                    {member?.gradeName && (
                      <div style={{ font: "400 13px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
                        {member.gradeName}
                        {member.sectionName ? ` · ${member.sectionName}` : ""}
                      </div>
                    )}
                  </Td>
                  <Td>{issue ? formatDate(issue.dueDate) : "—"}</Td>
                  <Td mono>{days ?? "—"}</Td>
                  <Td mono style={{ fontWeight: 500, color: "var(--lib-ink)" }}>
                    {formatMoneySummary(fine.amountPaise)}
                  </Td>
                  <Td align="right">
                    {tab === "unpaid" ? <FineRowAction fine={fine} /> : <Pill label="Collected" tone="green" />}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Overdue &amp; fines</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{ padding: "11px 26px", borderRadius: 8, textDecoration: "none", font: "500 15px/1.2 var(--lib-font-sans)", background: active ? "var(--lib-white)" : "transparent", color: active ? "var(--lib-ink)" : "var(--lib-body-muted)" }}
    >
      {children}
    </a>
  );
}
