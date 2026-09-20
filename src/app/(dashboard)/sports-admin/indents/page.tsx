// Sports Admin -> Indents -- pixel-rebuilt from the design's own `indents`
// screen (EDITABLE.indents: columns ['INDENT NO','ITEM','QTY','PURPOSE',
// 'NEEDED BY','AMOUNT','STATUS']). Real data throughout, incl. estimated
// amount (the real purchase_request row's own field, not fabricated).
// There is no updateEquipmentIndent in the real backend (an indent is
// decided elsewhere in the approvals chain, not by this role), so no
// full-record edit is offered -- but a MANAGE/Withdraw column is now real:
// the requester can withdraw their own still-open indent via the generic
// approvals engine's real POST /approvals/:id/withdraw (see
// WithdrawAction.tsx's own comment).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { ExportCsvButton } from "@/components/sports-ui/ExportCsvButton";
import { WithdrawAction } from "@/components/sports-ui/WithdrawAction";
import { formatDate, formatMoneyDetail, orDash, statusLabel } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listEquipmentIndents } from "@/lib/sports-admin-api";
import { AddIndentPanel } from "./AddIndentPanel";

// Design wants tabs ['All','Draft','Submitted','Approved'] -- the real
// indent lifecycle (purchase_request.state) only has PENDING/APPROVED/
// REJECTED/CANCELLED (no Draft/Submitted distinction exists anywhere in
// this schema), so these tabs use the real states instead of inventing a
// Draft/Submitted split with nothing behind it.
const STATES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default async function SportsAdminIndentsPage({ searchParams }: { searchParams: Promise<{ q?: string; state?: string }> }) {
  const { q, state } = await searchParams;
  try {
    const [indents, actor] = await Promise.all([listEquipmentIndents(), getCurrentActor()]);
    const needle = (q ?? "").trim().toLowerCase();
    const sorted = [...indents]
      .filter((ind) => !state || ind.state === state)
      .filter((ind) => {
        if (!needle) return true;
        return `${ind.referenceNo} ${ind.itemName} ${ind.description ?? ""}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const rows = sorted.map((ind) => {
      const cells: TableCell[] = [
        { kind: "plain", text: ind.referenceNo, mono: true },
        { kind: "plain", text: ind.itemName, bold: true },
        { kind: "plain", text: orDash(ind.quantity), mono: true },
        { kind: "plain", text: ind.description ?? "—" },
        { kind: "plain", text: formatDate(ind.neededBy), mono: true },
        { kind: "plain", text: ind.estimatedAmountPaise ? formatMoneyDetail(ind.estimatedAmountPaise) : "—", bold: true },
        { kind: "badge", text: statusLabel(ind.state), tone: toneOf(ind.state) },
        {
          kind: "node",
          node: (
            <WithdrawAction
              approvalRequestId={ind.approvalRequestId}
              state={ind.state}
              isRequester={ind.requestedBy === actor.personId}
              label="indent"
              revalidatePath="/sports-admin/indents"
            />
          ),
        },
      ];
      return { key: ind.id, cells };
    });

    const exportRows = sorted.map((ind) => [
      ind.referenceNo,
      ind.itemName,
      orDash(ind.quantity),
      ind.description ?? "—",
      formatDate(ind.neededBy),
      ind.estimatedAmountPaise ? formatMoneyDetail(ind.estimatedAmountPaise) : "—",
      statusLabel(ind.state),
    ]);

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>Indents</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Purchase indents raised by the sports department</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <ExportCsvButton
              label="Print indent"
              filename="indent-register.csv"
              headers={["Indent no", "Item", "Qty", "Purpose", "Needed by", "Amount", "Status"]}
              rows={exportRows}
            />
            <AddIndentPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search indents by number, item or purpose"
            style={{ flex: 1, minWidth: 260, height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
          {state && <input type="hidden" name="state" value={state} />}
          <button type="submit" style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--sport-border)", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--sport-body)" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {["", ...STATES].map((s) => (
            <Link
              key={s || "all"}
              href={`/sports-admin/indents?${new URLSearchParams({ ...(s ? { state: s } : {}), ...(q ? { q } : {}) }).toString()}`}
              style={{
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: 20,
                border: `1px solid ${(state ?? "") === s ? "var(--sport-primary)" : "var(--sport-border)"}`,
                background: (state ?? "") === s ? "var(--sport-primary)" : "#fff",
                color: (state ?? "") === s ? "#fff" : "var(--sport-body)",
              }}
            >
              {s ? statusLabel(s) : "All"}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="Indent register"
            meta={`${sorted.length} of ${indents.length} raised`}
            columns={["INDENT NO", "ITEM", "QTY", "PURPOSE", "NEEDED BY", "AMOUNT", "STATUS", "MANAGE"]}
            rows={rows}
            emptyLabel="No indents match this filter."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load indents."} />;
  }
}
