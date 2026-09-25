// Lost & damaged books -- pixel-rebuilt from the design's own screen. Real
// backend's lost-damaged.controller.ts is GET-only (list/get) -- there is no
// settle/collect/replace endpoint on it at all. What IS real: each report
// carries the real Fine it produced (fineId/fineStatus/fineAmountPaise), and
// that Fine has the exact same real collect workflow already wired on
// Overdue & fines (sendFineToFinanceAction/waiveFineAction) -- "Collect"
// here reuses it directly rather than inventing a second, fake collection
// path. "Replacement copy" genuinely has no real backend action anywhere
// (confirmed) -- kept visible, wired to an honest explainer.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { listLostDamagedReports } from "@/lib/library-api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AutoSubmitSearchInput } from "@/components/dashboard/AutoSubmitFilter";
import { EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { LostDamagedRowAction } from "./LostDamagedRowAction";

export default async function LibraryLostDamagedPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tab?: string; search?: string }>;
}) {
  const params = await searchParams;
  const kind = params.kind === "damaged" ? "DAMAGED" : "LOST";
  const settledTab = params.tab === "settled";

  try {
    const { data: reports } = await listLostDamagedReports({ type: kind, search: params.search || undefined, limit: 200 });
    const isSettled = (status: string | null) => status === "PAID" || status === "WAIVED" || status === "CANCELLED";
    const view = reports.filter((r) => (settledTab ? isSettled(r.fineStatus) : !isSettled(r.fineStatus)));

    function href(overrides: { kind?: string; tab?: string }) {
      const next = new URLSearchParams();
      next.set("kind", overrides.kind ?? params.kind ?? "lost");
      next.set("tab", overrides.tab ?? params.tab ?? "unsettled");
      if (params.search) next.set("search", params.search);
      return `/library/lost-damaged?${next.toString()}`;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Lost & damaged books</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            Copies written off the shelf — what was charged, what was recovered and what is still open.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)" }}>
            <PillTab active={kind === "LOST"} href={href({ kind: "lost" })}>
              Lost
            </PillTab>
            <PillTab active={kind === "DAMAGED"} href={href({ kind: "damaged" })}>
              Damaged
            </PillTab>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)" }}>
            <PillTab active={!settledTab} href={href({ tab: "unsettled" })}>
              Unsettled
            </PillTab>
            <PillTab active={settledTab} href={href({ tab: "settled" })}>
              Settled
            </PillTab>
          </div>
          <form action="/library/lost-damaged" style={{ flex: 1, minWidth: 240, maxWidth: 420, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <input type="hidden" name="kind" value={params.kind ?? "lost"} />
            <input type="hidden" name="tab" value={params.tab ?? "unsettled"} />
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#8593a8" strokeWidth={1.7}>
              <circle cx="9" cy="9" r="5.6" />
              <path d="M13.2 13.2L17 17" />
            </svg>
            <AutoSubmitSearchInput
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search by title, accession or member"
              style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
            />
          </form>
        </div>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Accession</Th>
              <Th>Title</Th>
              <Th>Member</Th>
              <Th>Declared</Th>
              <Th>Cause</Th>
              <Th>Charge</Th>
              <th style={{ padding: "14px 18px" }} />
            </tr>
          </thead>
          <tbody>
            {view.length === 0 && <EmptyRow colSpan={7} />}
            {view.map((r) => (
              <tr key={r.id} className="lib-row-hover">
                <Td mono>{r.copyCode}</Td>
                <Td>{r.bookTitle}</Td>
                <Td>{r.memberName ?? "—"}</Td>
                <Td>{formatDate(r.reportedAt)}</Td>
                <Td>
                  <Pill label={r.type === "LOST" ? "Lost" : "Damaged"} tone="red" />
                </Td>
                <Td mono style={{ fontWeight: 500, color: "var(--lib-ink)" }}>
                  {r.fineAmountPaise !== null ? formatMoneySummary(r.fineAmountPaise) : "—"}
                </Td>
                <Td align="right">
                  {settledTab ? <Pill label="Settled" tone="green" /> : <LostDamagedRowAction report={r} />}
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
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Lost &amp; damaged</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}

function PillTab({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ padding: "11px 26px", borderRadius: 8, textDecoration: "none", font: "500 15px/1.2 var(--lib-font-sans)", background: active ? "var(--lib-white)" : "transparent", color: active ? "var(--lib-ink)" : "var(--lib-body-muted)" }}>
      {children}
    </a>
  );
}
