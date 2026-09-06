import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listMediaIndents } from "@/lib/media-api";
import { RaiseIndentForm } from "./RaiseIndentForm";

// Tabs mirror Finance's own Concessions page pattern (?tab=...) using this
// module's real states: waiting = still awaiting a decision (PENDING);
// approved/rejected = decided. Every Media indent routes Media Room Head →
// Principal directly (see database/migrations/0006_media_room.sql's
// MEDIA_INDENT approval_policy row) -- there is no Finance step in this path,
// unlike a school Purchase Request.
type Tab = "waiting" | "approved" | "rejected";

export default async function RaiseIndentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: Tab = tab === "approved" ? "approved" : tab === "rejected" ? "rejected" : "waiting";

  try {
    const indents = await listMediaIndents();
    const waiting = indents.filter((i) => i.state === "PENDING");
    const approved = indents.filter((i) => i.state === "APPROVED");
    const rejected = indents.filter((i) => i.state === "REJECTED" || i.state === "CANCELLED");
    const shown = activeTab === "waiting" ? waiting : activeTab === "approved" ? approved : rejected;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Raise Indent</h1>
            <p className="mt-1 text-sm text-text-muted">
              Equipment and consumable indents raised to the management. Route: Media Room Head → Principal
              (approved/rejected directly by the Principal — Finance is not part of this approval chain).
            </p>
          </div>
        </div>

        <RaiseIndentForm />

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link href="/media/raise-indent?tab=waiting">
              <PlainButton variant={activeTab === "waiting" ? "primary" : "secondary"}>Waiting for approval {waiting.length}</PlainButton>
            </Link>
            <Link href="/media/raise-indent?tab=approved">
              <PlainButton variant={activeTab === "approved" ? "primary" : "secondary"}>Approved {approved.length}</PlainButton>
            </Link>
            <Link href="/media/raise-indent?tab=rejected">
              <PlainButton variant={activeTab === "rejected" ? "primary" : "secondary"}>Rejected {rejected.length}</PlainButton>
            </Link>
          </div>

          {shown.length === 0 ? (
            <EmptyState
              title={
                activeTab === "waiting" ? "Nothing waiting" : activeTab === "approved" ? "Nothing approved yet" : "Nothing rejected"
              }
              body={
                activeTab === "waiting"
                  ? "Submit one above to send it to the Principal for a decision."
                  : activeTab === "approved"
                    ? "Indents the Principal approves will appear here."
                    : "Indents the Principal rejects (or that were cancelled) will appear here."
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {shown.map((indent) => (
                <div key={indent.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-field px-2.5 py-1 text-xs font-bold text-text-muted">{indent.requestType === "GOODS" ? "Capital equipment" : "Service"}</span>
                        <span className="text-xs text-text-muted">#{indent.referenceNo} · raised {formatDate(indent.createdAt)}</span>
                      </div>
                      <p className="mt-2 font-bold text-text">{indent.itemName}</p>
                      {indent.description ? <p className="mt-1 text-sm text-text-muted">{indent.description}</p> : null}
                      <p className="mt-1 text-xs text-text-muted">
                        {indent.quantity ? `Qty ${indent.quantity}` : ""}
                        {indent.estimatedAmountPaise ? ` · ${formatMoneySummary(indent.estimatedAmountPaise)}` : ""}
                        {indent.neededBy ? ` · Needed by ${formatDate(indent.neededBy)}` : ""}
                      </p>
                    </div>
                    <StatusPill state={indent.state} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load indents. Nothing was submitted — try again." />;
  }
}
