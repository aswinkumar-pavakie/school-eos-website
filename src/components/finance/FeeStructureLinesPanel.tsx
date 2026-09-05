import { formatDate, formatMoney } from "@/lib/format";

// Read-only -- write operations (add/edit/remove lines) live in the dedicated
// Finance/Accounts login being built separately; Admin only needs visibility
// here. Revisit once that module is in place.

export interface FeeStructureLine {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  amountPaise: string;
  instalmentNo: number;
  dueDate: string;
  lateFeePaise: string;
}

export interface FeeHeadOption {
  id: string;
  name: string;
}

export function FeeStructureLinesPanel({
  lines,
  feeHeads,
}: {
  structureId: string;
  lines: FeeStructureLine[];
  feeHeads: FeeHeadOption[];
  editable: boolean;
}) {
  const feeHeadById = new Map(feeHeads.map((f) => [f.id, f.name]));

  return (
    <div>
      <p className="text-[13px] font-bold text-text">Lines ({lines.length})</p>

      <ul className="mt-3 flex flex-col gap-2">
        {lines.length === 0 && <li className="text-xs text-text-muted">No lines yet.</li>}
        {lines.map((line) => (
          <li key={line.id} className="rounded-[11px] bg-field p-3">
            <p className="text-[13.5px] font-semibold text-text">
              {feeHeadById.get(line.feeHeadId) ?? "—"}{" "}
              <span className="text-xs font-normal text-text-muted">· Instalment {line.instalmentNo}</span>
            </p>
            <p className="text-xs text-text-muted">
              Due {formatDate(line.dueDate)} · {formatMoney(line.amountPaise)}
              {Number(line.lateFeePaise) > 0 && ` · late fee ${formatMoney(line.lateFeePaise)}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
