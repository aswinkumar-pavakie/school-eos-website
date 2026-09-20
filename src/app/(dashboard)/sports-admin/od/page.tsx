// Sports Admin -> On-duty requests. The design's own `od` screen is a
// single live request-builder form (isOd: true) with no history table --
// but the real backend models OD as discrete submitted requests per squad
// per event, each going through the approvals engine, not one editable
// draft. A single-draft form would misrepresent that real workflow, so this
// stays a real register (same TableCard chrome/typography as every other
// register screen) with the real create flow in AddOdRequestPanel.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { TableCard, toneOf, type TableCell } from "@/components/sports-ui/primitives";
import { WithdrawAction } from "@/components/sports-ui/WithdrawAction";
import { formatDate, statusLabel } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listOdRequests } from "@/lib/sports-admin-api";
import { AddOdRequestPanel } from "./AddOdRequestPanel";

export default async function SportsAdminOdPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  try {
    const [allRequests, actor] = await Promise.all([listOdRequests(), getCurrentActor()]);
    const needle = (q ?? "").trim().toLowerCase();
    const requests = needle
      ? allRequests.filter((r) => `${r.teamName} ${r.sportName} ${r.reason}`.toLowerCase().includes(needle))
      : allRequests;
    const sorted = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const rows = sorted.map((r) => {
      const cells: TableCell[] = [
        { kind: "plain", text: r.teamName, bold: true },
        { kind: "plain", text: `${r.sportName} · ${r.reason}` },
        { kind: "plain", text: formatDate(r.eventDate), mono: true },
        { kind: "badge", text: statusLabel(r.state), tone: toneOf(r.state) },
        {
          kind: "node",
          node: (
            <WithdrawAction
              approvalRequestId={r.approvalRequestId}
              state={r.state}
              isRequester={r.requestedBy === actor.personId}
              label="OD request"
              revalidatePath="/sports-admin/od"
            />
          ),
        },
      ];
      return { key: r.id, cells };
    });

    return (
      <div className="sports-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>On-duty requests</h1>
            <p style={{ margin: 0, fontSize: 15, color: "var(--sport-muted-2)" }}>Raised to the principal for a squad drawn from several classes</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
            <AddOdRequestPanel />
          </div>
        </div>

        <form style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 20px", marginTop: 24 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search OD requests by squad, sport or reason"
            style={{ width: "100%", height: 40, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 14px", fontSize: 13.5, fontFamily: "inherit", color: "var(--sport-ink)" }}
          />
        </form>

        <div style={{ marginTop: 16 }}>
          <TableCard
            title="OD register"
            meta={`${requests.length} of ${allRequests.length} requests`}
            columns={["SQUAD", "SPORT · REASON", "EVENT DATE", "STATUS", "MANAGE"]}
            rows={rows}
            emptyLabel="No OD requests match this search."
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load OD requests."} />;
  }
}
