"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createSectionAction, updateSectionAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Section {
  id: string;
  academicYearId: string;
  gradeId: string;
  mediumId: string;
  name: string;
  capacity: number | null;
  status: string;
}

const initialState: FormActionState = {};

export function SectionsPanel({
  sections,
  years,
  grades,
  mediums,
}: {
  sections: Section[];
  years: { id: string; name: string; isCurrent: boolean }[];
  grades: { id: string; name: string }[];
  mediums: { id: string; name: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createSectionAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState("");

  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? id;
  const gradeName = (id: string) => grades.find((g) => g.id === id)?.name ?? id;
  const mediumName = (id: string) => mediums.find((m) => m.id === id)?.name ?? id;

  const filtered = gradeFilter ? sections.filter((s) => s.gradeId === gradeFilter) : sections;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{sections.length} sections</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New section
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New section"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <SelectField
            label="Academic year"
            name="academicYearId"
            required
            disabled={isPending}
            options={[["", "Select"], ...years.map((y): [string, string] => [y.id, y.name + (y.isCurrent ? " (current)" : "")])]}
          />
          <SelectField
            label="Grade"
            name="gradeId"
            required
            disabled={isPending}
            options={[["", "Select"], ...grades.map((g): [string, string] => [g.id, g.name])]}
          />
          <SelectField
            label="Medium"
            name="mediumId"
            required
            disabled={isPending}
            options={[["", "Select"], ...mediums.map((m): [string, string] => [m.id, m.name])]}
          />
          <Field label="Section name" name="name" required disabled={isPending} placeholder="A" />
          <Field label="Capacity" name="capacity" type="number" disabled={isPending} />
        </PanelCreateForm>
      )}

      <div className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by grade</span>
          <GradeFilterSelect grades={grades} value={gradeFilter} onChange={setGradeFilter} />
        </label>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No sections match this filter.</li>}
        {filtered.map((section) => (
          <SectionRow
            key={section.id}
            section={section}
            yearLabel={yearName(section.academicYearId)}
            gradeLabel={gradeName(section.gradeId)}
            mediumLabel={mediumName(section.mediumId)}
            editing={editingId === section.id}
            onToggle={() => setEditingId((v) => (v === section.id ? null : section.id))}
          />
        ))}
      </ul>
    </div>
  );
}

// Native <select> popups can't be styled or capped in height by CSS, so a
// grade list (LKG/UKG/Standard 1-12, 14 rows) rendered one full-size row per
// grade instead of a compact, scrollable menu. This is a small custom
// dropdown instead, matching the app's other custom menus (GlobalSearch,
// Shell's bell/avatar) -- small rows, capped height, its own scrollbar.
function GradeFilterSelect({
  grades,
  value,
  onChange,
}: {
  grades: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel = grades.find((g) => g.id === value)?.name ?? "All grades";

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[150px] items-center justify-between gap-2 rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-left text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-text-muted">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 max-h-56 w-full min-w-[150px] overflow-y-auto rounded-[11px] border border-border bg-surface p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[13px] transition-colors ${
              value === "" ? "bg-primary text-white" : "text-text hover:bg-field"
            }`}
          >
            All grades
          </button>
          {grades.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                onChange(g.id);
                setOpen(false);
              }}
              className={`block w-full rounded-[8px] px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                value === g.id ? "bg-primary text-white" : "text-text hover:bg-field"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionRow({
  section,
  yearLabel,
  gradeLabel,
  mediumLabel,
  editing,
  onToggle,
}: {
  section: Section;
  yearLabel: string;
  gradeLabel: string;
  mediumLabel: string;
  editing: boolean;
  onToggle: () => void;
}) {
  const action = updateSectionAction.bind(null, section.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {gradeLabel} · {section.name}
          </p>
          <p className="text-xs text-text-muted">
            {yearLabel} · {mediumLabel}
            {section.capacity && ` · capacity ${section.capacity}`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={section.status === "ACTIVE" ? "success" : "pending"} label={section.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Section name" name="name" disabled={isPending} defaultValue={section.name} />
            <Field label="Capacity" name="capacity" type="number" disabled={isPending} defaultValue={section.capacity ?? undefined} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={section.status}
              options={[
                ["ACTIVE", "Active"],
                ["INACTIVE", "Inactive"],
                ["ARCHIVED", "Archived"],
              ]}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
