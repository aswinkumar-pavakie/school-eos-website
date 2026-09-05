"use client";

import { useActionState, useState } from "react";
import {
  createSportAction,
  createSportCategoryAction,
  updateSportAction,
  updateSportCategoryAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/sports/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Sport {
  id: string;
  name: string;
  sportType: string;
  resultType: string;
  status: string;
}

export interface SportCategory {
  id: string;
  sportId: string;
  name: string;
  ageGroup: string | null;
  gender: string | null;
}

const SPORT_TYPES: [string, string][] = [
  ["INDIVIDUAL", "Individual"],
  ["TEAM", "Team"],
];
const RESULT_TYPES: [string, string][] = [
  ["POINTS", "Points"],
  ["TIME", "Time"],
  ["DISTANCE", "Distance"],
  ["SETS", "Sets"],
  ["PLACEMENT", "Placement"],
];

const initialState: FormActionState = {};

export function SportsPanel({
  sports,
  categoriesBySport,
}: {
  sports: Sport[];
  categoriesBySport: Record<string, SportCategory[]>;
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createSportAction, initialState);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{sports.length} sports</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New sport
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New sport"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Basketball" />
          <SelectField label="Sport type" name="sportType" required disabled={isPending} options={[["", "Select"], ...SPORT_TYPES]} />
          <SelectField label="Result type" name="resultType" required disabled={isPending} options={[["", "Select"], ...RESULT_TYPES]} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {sports.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No sports yet.</li>}
        {sports.map((sport) => (
          <SportRow
            key={sport.id}
            sport={sport}
            categories={categoriesBySport[sport.id] ?? []}
            expanded={expandedId === sport.id}
            onToggle={() => setExpandedId((v) => (v === sport.id ? null : sport.id))}
          />
        ))}
      </ul>
    </div>
  );
}

function SportRow({
  sport,
  categories,
  expanded,
  onToggle,
}: {
  sport: Sport;
  categories: SportCategory[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const editAction = updateSportAction.bind(null, sport.id);
  const [editState, editFormAction, editPending] = useActionState(editAction, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">{sport.name}</p>
          <p className="text-xs text-text-muted">
            {sport.sportType.toLowerCase()} · scored by {sport.resultType.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={sport.status === "ACTIVE" ? "success" : "pending"} label={sport.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {expanded ? "Close" : "Manage"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-4 rounded-[11px] bg-field p-3.5">
          <form action={editFormAction} className="flex flex-col gap-2.5">
            <p className="text-[13px] font-bold text-text">Edit sport</p>
            {editState.error && <p className="text-xs text-critical-text">{editState.error}</p>}
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Name" name="name" disabled={editPending} defaultValue={sport.name} />
              <SelectField label="Sport type" name="sportType" disabled={editPending} defaultValue={sport.sportType} options={SPORT_TYPES} />
              <SelectField label="Result type" name="resultType" disabled={editPending} defaultValue={sport.resultType} options={RESULT_TYPES} />
              <SelectField
                label="Status"
                name="status"
                disabled={editPending}
                defaultValue={sport.status}
                options={[
                  ["ACTIVE", "Active"],
                  ["INACTIVE", "Inactive"],
                ]}
              />
            </div>
            <button
              type="submit"
              disabled={editPending}
              className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {editPending ? "Saving…" : "Save changes"}
            </button>
          </form>

          <CategoriesBlock sportId={sport.id} categories={categories} />
        </div>
      )}
    </li>
  );
}

function CategoriesBlock({ sportId, categories }: { sportId: string; categories: SportCategory[] }) {
  const [adding, setAdding] = useState(false);
  const createAction = createSportCategoryAction.bind(null, sportId);
  const [state, formAction, isPending] = useActionState(createAction, initialState);

  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-text">Categories ({categories.length})</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add category
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New category"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Under-14" />
          <Field label="Age group" name="ageGroup" disabled={isPending} placeholder="U-14" />
          <SelectField
            label="Gender"
            name="gender"
            disabled={isPending}
            options={[
              ["", "Select"],
              ["MALE", "Male"],
              ["FEMALE", "Female"],
              ["MIXED", "Mixed"],
            ]}
          />
        </PanelCreateForm>
      )}

      <ul className="mt-2.5 flex flex-col gap-2">
        {categories.length === 0 && <li className="text-xs text-text-muted">No categories yet.</li>}
        {categories.map((cat) => (
          <CategoryRow key={cat.id} category={cat} />
        ))}
      </ul>
    </div>
  );
}

function CategoryRow({ category }: { category: SportCategory }) {
  const [editing, setEditing] = useState(false);
  const action = updateSportCategoryAction.bind(null, category.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="rounded-[11px] bg-surface p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-text">
          {category.name}
          {category.ageGroup && <span className="text-text-muted"> · {category.ageGroup}</span>}
          {category.gender && <span className="text-text-muted"> · {category.gender.toLowerCase()}</span>}
        </p>
        <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-semibold text-primary">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing && (
        <form action={formAction} className="mt-2 flex flex-col gap-2">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name" name="name" disabled={isPending} defaultValue={category.name} />
            <Field label="Age group" name="ageGroup" disabled={isPending} defaultValue={category.ageGroup ?? ""} />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-[11px] bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </li>
  );
}
