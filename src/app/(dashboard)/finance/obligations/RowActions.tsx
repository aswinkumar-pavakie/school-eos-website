"use client";

import { PlainButton } from "@/components/ui/Button";
import { deleteObligationAction, waiveObligationAction } from "./actions";
import { EditObligationModal } from "./EditObligationModal";
import type { Obligation } from "@/lib/finance-api";

export function ObligationRowActions({ obligation }: { obligation: Obligation }) {
  if (obligation.state === "PENDING" && obligation.paidPaise === "0") {
    return (
      <div className="flex justify-end gap-2">
        <EditObligationModal obligation={obligation} />
        <form action={waiveObligationAction.bind(null, obligation.id)}>
          <input type="hidden" name="reason" value="Waived by Finance" />
          <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">Waive</PlainButton>
        </form>
        <form action={deleteObligationAction.bind(null, obligation.id)}>
          <PlainButton variant="danger" type="submit" className="px-2.5 py-1 text-xs">Delete</PlainButton>
        </form>
      </div>
    );
  }
  if (["PENDING", "PARTIAL", "OVERDUE"].includes(obligation.state)) {
    return (
      <form action={waiveObligationAction.bind(null, obligation.id)} className="flex justify-end">
        <input type="hidden" name="reason" value="Waived by Finance" />
        <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">Waive</PlainButton>
      </form>
    );
  }
  return null;
}
