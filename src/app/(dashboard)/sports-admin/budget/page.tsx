// Sports Admin -> Budget & approvals. Pixel-rebuilt from the design's own
// `budget` screen (columns: REQUEST, DESCRIPTION, AMOUNT, RAISED BY,
// STATUS; META: secondary 'Term statement', primary '+ Raise request',
// filter Status). Reuses the real generic purchase_request/approval_policy
// engine already used for Equipment Indents -- a live-confirmed 2-step
// Principal -> Finance policy (SPORTS_BUDGET_REQUEST, see migration
// 0024_sports_budget_approval_policy.sql) was seeded to match it exactly.
// No new table. "Term statement" is a real CSV export of the current term's
// requests (real amounts/state, not a fabricated PDF statement).
// There is no domain-level edit on a submitted budget request (mirrors
// Finance's own convention and Indents' -- a request is never rewritten
// after submission), but a real MANAGE/Withdraw column lets the requester
// pull back their own still-open request via the generic approvals engine's
// real POST /approvals/:id/withdraw (see WithdrawAction.tsx's own comment).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { WithdrawAction } from "@/components/sports-ui/WithdrawAction";
import { formatMoneyDetail, statusLabel } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listBudgetRequests } from "@/lib/sports-admin-api";
import { AddBudgetRequestPanel } from "./AddBudgetRequestPanel";

const STATES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default async function SportsAdminBudgetPage({ searchParams }: { searchParams: Promise<{ q?: string; state?: string }> }) {
  const { q, state } = await searchParams;
  try {
    const [allRequests, actor] = await Promise.all([listBudgetRequests(), getCurrentActor()]);
    const needle = (q ?? "").trim().toLowerCase();
    const requests = allRequests
      .filter((r) => !state || r.state === state)
      .filter((r) => !needle || `${r.itemName} ${r.description ?? ""}`.toLowerCase().includes(needle));

    const rows = requests.map((r) => {
      const cells: TableCell[] = [
        { kind: "plain", text: r.itemName, bold: true },
        { kind: "plain", text: r.description ?? "—" },
        { kind: "plain", text: r.estimatedAmountPaise ? formatMoneyDetail(r.estimatedAmountPaise) : "—", bold: true, mono: true },
        { kind: "plain", text: r.requestedByName ?? "—" },
        { kind: "badge", text: statusLabel(r.state), tone: toneOf(r.state) },
        {
          kind: "node",
          node: (
            <WithdrawAction
              approvalRequestId={r.approvalRequestId}
              state={r.state}
              isRequester={r.requestedBy === actor.personId}
              label="budget request"
              revalidatePath="/sports-admin/budget"
            />
          ),
        },
      ];
      return { key: r.id, cells };
    });

    const exportRows = requests.map((r) => [
      r.itemName,
      r.description ?? "—",
      r.estimatedAmountPaise ? formatMoneyDetail(r.estimatedAmountPaise) : "—",
      r.requestedByName ?? "—",
      statusLabel(r.state),
    ]);

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Budget &amp; approvals</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>{allRequests.length} request{allRequests.length === 1 ? "" : "s"} raised to Principal &amp; Finance</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              label="Term statement"
              filename="budget-term-statement.csv"
              headers={["Request", "Description", "Amount", "Raised by", "Status"]}
              rows={exportRows}
            />
            <AddBudgetRequestPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search requests by title or description"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          <select name="state" defaultValue={state ?? ""} style={{ height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 12px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}>
            <option value="">All statuses</option>
            {STATES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Filter
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Budget requests"
            meta={`${requests.length} of ${allRequests.length}`}
            columns={["REQUEST", "DESCRIPTION", "AMOUNT", "RAISED BY", "STATUS", "MANAGE"]}
            rows={rows}
            emptyLabel="No budget requests match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load budget requests."} />;
  }
}
