"use client";

import { useActionState, useMemo, useState } from "react";
import { createEquipmentAction, updateEquipmentAction, type FormActionState } from "@/app/(dashboard)/admin/sports/actions";
import { Field, PanelCreateForm, SelectField } from "./shared";
import type { Sport } from "./SportsPanel";

export interface Equipment {
  id: string;
  name: string;
  sportId: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  condition: string | null;
}

const CONDITIONS: [string, string][] = [
  ["NEW", "New"],
  ["GOOD", "Good"],
  ["FAIR", "Fair"],
  ["POOR", "Poor"],
  ["DAMAGED", "Damaged"],
];

const initialState: FormActionState = {};

export function EquipmentPanel({ equipment, sports }: { equipment: Equipment[]; sports: Sport[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createEquipmentAction, initialState);
  const [sportFilter, setSportFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const sportById = useMemo(() => new Map(sports.map((s) => [s.id, s.name])), [sports]);

  const filtered = sportFilter ? equipment.filter((e) => e.sportId === sportFilter) : equipment;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{equipment.length} equipment items</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New equipment
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New equipment"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Basketballs" />
          <SelectField
            label="Sport"
            name="sportId"
            disabled={isPending}
            options={[["", "None"], ...sports.map((s) => [s.id, s.name] as [string, string])]}
          />
          <Field label="Quantity total" name="quantityTotal" type="number" required disabled={isPending} />
          <Field label="Quantity available" name="quantityAvailable" type="number" disabled={isPending} placeholder="Defaults to total" />
          <SelectField label="Condition" name="condition" disabled={isPending} options={[["", "Select"], ...CONDITIONS]} />
        </PanelCreateForm>
      )}

      <div className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by sport</span>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All sports</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No equipment matches this filter.</li>}
        {filtered.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13.5px] font-semibold text-text">{item.name}</p>
                <p className="text-xs text-text-muted">
                  {item.sportId ? sportById.get(item.sportId) ?? "—" : "General"} ·{" "}
                  <span className="font-mono">
                    {item.quantityAvailable} / {item.quantityTotal}
                  </span>{" "}
                  available{item.condition ? ` · ${item.condition.toLowerCase()}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId((v) => (v === item.id ? null : item.id))}
                className="text-[13px] font-semibold text-primary"
              >
                {editingId === item.id ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingId === item.id && <EquipmentEditForm item={item} sports={sports} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EquipmentEditForm({ item, sports }: { item: Equipment; sports: Sport[] }) {
  const action = updateEquipmentAction.bind(null, item.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
      {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Name" name="name" disabled={isPending} defaultValue={item.name} />
        <SelectField
          label="Sport"
          name="sportId"
          disabled={isPending}
          defaultValue={item.sportId ?? ""}
          options={[["", "None"], ...sports.map((s) => [s.id, s.name] as [string, string])]}
        />
        <Field label="Quantity total" name="quantityTotal" type="number" disabled={isPending} defaultValue={item.quantityTotal} />
        <Field label="Quantity available" name="quantityAvailable" type="number" disabled={isPending} defaultValue={item.quantityAvailable} />
        <SelectField label="Condition" name="condition" disabled={isPending} defaultValue={item.condition ?? ""} options={CONDITIONS} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
