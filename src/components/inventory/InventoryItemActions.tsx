"use client";

// Every inventory stock/status action -- each is a small toggled inline form,
// same rhythm as EnrolmentsSection's Edit/Transfer toggles. Only the actions
// valid for the item's current status are ever offered, so there's no dead
// button that would just 409 on submit.

import { useActionState, useState } from "react";
import {
  addStockAction,
  adjustStockAction,
  issueInventoryItemAction,
  markInventoryItemDamagedAction,
  markInventoryItemLostAction,
  retireInventoryItemAction,
  returnInventoryItemAction,
  transferInventoryItemAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/inventory/actions";
import { PersonPicker } from "@/components/dashboard/PersonPicker";

const initialState: FormActionState = {};

interface Item {
  id: string;
  status: string;
  location: string | null;
}

type ActionKey = "addStock" | "adjustStock" | "issue" | "transfer" | "markDamaged" | "markLost" | "retire" | null;

export function InventoryItemActions({ item }: { item: Item }) {
  const [open, setOpen] = useState<ActionKey>(null);
  const toggle = (key: ActionKey) => setOpen((v) => (v === key ? null : key));
  const isRetired = item.status === "RETIRED";

  if (isRetired) {
    return <p className="text-sm text-text-muted">This item is retired -- no further actions are available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("addStock")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          Add stock
        </button>
        <button type="button" onClick={() => toggle("adjustStock")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          Adjust stock
        </button>
        {item.status === "AVAILABLE" && (
          <button type="button" onClick={() => toggle("issue")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
            Issue / assign
          </button>
        )}
        {item.status === "ASSIGNED" && <ReturnButton itemId={item.id} />}
        <button type="button" onClick={() => toggle("transfer")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          Transfer location
        </button>
        {item.status !== "DAMAGED" && (
          <button type="button" onClick={() => toggle("markDamaged")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
            Mark damaged
          </button>
        )}
        {item.status !== "LOST" && (
          <button type="button" onClick={() => toggle("markLost")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
            Mark lost
          </button>
        )}
        <button type="button" onClick={() => toggle("retire")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
          Retire / dispose
        </button>
      </div>

      {open === "addStock" && <AddStockForm itemId={item.id} onDone={() => setOpen(null)} />}
      {open === "adjustStock" && <AdjustStockForm itemId={item.id} onDone={() => setOpen(null)} />}
      {open === "issue" && <IssueForm itemId={item.id} onDone={() => setOpen(null)} />}
      {open === "transfer" && <TransferForm itemId={item.id} currentLocation={item.location} onDone={() => setOpen(null)} />}
      {open === "markDamaged" && <NoteForm action={markInventoryItemDamagedAction} itemId={item.id} label="Mark this item damaged" onDone={() => setOpen(null)} />}
      {open === "markLost" && <NoteForm action={markInventoryItemLostAction} itemId={item.id} label="Mark this item lost" onDone={() => setOpen(null)} />}
      {open === "retire" && <NoteForm action={retireInventoryItemAction} itemId={item.id} label="Retire this item" onDone={() => setOpen(null)} />}
    </div>
  );
}

function ReturnButton({ itemId }: { itemId: string }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        returnInventoryItemAction(itemId).finally(() => setIsPending(false));
      }}
      className="rounded-[11px] bg-primary px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-60"
    >
      {isPending ? "Returning…" : "Return item"}
    </button>
  );
}

function AddStockForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const action = addStockAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Quantity to add *</span>
        <input name="quantity" type="number" min={1} required disabled={isPending} className="w-32 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Notes</span>
        <input name="notes" disabled={isPending} className="w-56 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Add stock"}
      </button>
    </form>
  );
}

function AdjustStockForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const action = adjustStockAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Corrected quantity *</span>
        <input name="quantity" type="number" min={0} required disabled={isPending} className="w-32 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Reason *</span>
        <input name="reason" required disabled={isPending} placeholder="e.g. physical stock-take" className="w-56 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Adjust"}
      </button>
    </form>
  );
}

function IssueForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const [person, setPerson] = useState<{ id: string } | null>(null);
  const action = issueInventoryItemAction.bind(null, itemId, person?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
      <div className="flex flex-wrap items-end gap-2.5">
        <PersonPicker disabled={isPending} onSelect={setPerson} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Issued on</span>
          <input name="assignedOn" type="date" disabled={isPending} className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
        </label>
        <button type="submit" disabled={isPending || !person} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Issuing…" : "Issue"}
        </button>
      </div>
    </form>
  );
}

function TransferForm({ itemId, currentLocation, onDone }: { itemId: string; currentLocation: string | null; onDone: () => void }) {
  const action = transferInventoryItemAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">New location *</span>
        <input name="location" required disabled={isPending} defaultValue={currentLocation ?? ""} className="w-56 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Transfer"}
      </button>
    </form>
  );
}

function NoteForm({
  action,
  itemId,
  label,
  onDone,
}: {
  action: (id: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
  itemId: string;
  label: string;
  onDone: () => void;
}) {
  const bound = action.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(bound, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">{label} -- reason (optional)</span>
        <input name="notes" disabled={isPending} className="w-72 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-critical-bg px-3.5 py-2 text-sm font-bold text-critical-text disabled:opacity-60">
        {isPending ? "Saving…" : "Confirm"}
      </button>
    </form>
  );
}
