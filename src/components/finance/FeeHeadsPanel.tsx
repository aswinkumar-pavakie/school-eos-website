import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatMoneySummary } from "@/lib/format";

// Read-only -- write operations (create/edit fee heads) live in the dedicated
// Finance/Accounts login being built separately; Admin only needs visibility
// here. Revisit once that module is in place and Admin's own scope is settled.

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  headType: string;
  isRefundable: boolean;
  status: string;
  // A fee head is just a fee *type* -- it has no amount of its own. This is
  // the real, derived sum across every ACTIVE fee structure's line for this
  // head, not a fabricated figure -- null means it isn't in any active
  // structure yet, distinct from "configured at ₹0".
  activeStructureCount: number;
  totalConfiguredPaise: string | null;
}

export function FeeHeadsPanel({ feeHeads }: { feeHeads: FeeHead[] }) {
  return (
    <div>
      <p className="text-[13px] text-text-muted">{feeHeads.length} fee heads</p>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {feeHeads.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No fee heads yet.</li>}
        {feeHeads.map((feeHead) => (
          <li key={feeHead.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">
                {feeHead.name} <span className="font-mono text-xs text-text-muted">({feeHead.code})</span>
              </p>
              <p className="text-xs text-text-muted">
                {feeHead.headType.toLowerCase().replace(/_/g, " ")}
                {feeHead.isRefundable && " · refundable"}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {feeHead.activeStructureCount > 0 ? (
                  <>
                    {formatMoneySummary(feeHead.totalConfiguredPaise!)} configured across {feeHead.activeStructureCount}{" "}
                    active fee structure{feeHead.activeStructureCount === 1 ? "" : "s"}
                  </>
                ) : (
                  "Not configured in any active fee structure"
                )}
              </p>
            </div>
            <StatusPill tone={feeHead.status === "ACTIVE" ? "success" : "pending"} label={feeHead.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
