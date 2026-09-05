"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCalendarEventAction, type FormActionState } from "@/app/(dashboard)/admin/academic-calendar/actions";

const initialState: FormActionState = {};

const EVENT_TYPES: [string, string][] = [
  ["HOLIDAY", "Holiday"],
  ["TERM_START", "Term start"],
  ["TERM_END", "Term end"],
  ["EXAM_WINDOW", "Exam window"],
  ["PTM", "Parent-teacher meeting"],
  ["FUNCTION", "Function"],
  ["COMPETITION", "Competition"],
  ["WORKING_SATURDAY", "Working Saturday"],
  ["OTHER", "Other"],
];

const STAGES: [string, string][] = [
  ["PRE_PRIMARY", "Pre-primary"],
  ["PRIMARY", "Primary"],
  ["MIDDLE", "Middle"],
  ["SECONDARY", "Secondary"],
  ["HIGHER_SECONDARY", "Higher secondary"],
];

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface ScopeOption {
  id: string;
  name: string;
}

export function CreateCalendarEventForm({
  academicYears,
  campuses,
  grades,
  sections,
}: {
  academicYears: AcademicYear[];
  campuses: ScopeOption[];
  grades: ScopeOption[];
  sections: ScopeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState("SCHOOL");
  const [state, formAction, isPending] = useActionState(createCalendarEventAction, initialState);
  const currentYear = academicYears.find((y) => y.isCurrent);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const scopeOptions: ScopeOption[] =
    scopeType === "CAMPUS" ? campuses : scopeType === "GRADE" ? grades : scopeType === "SECTION" ? sections : [];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        + New event
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex w-full flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-text">Title *</span>
          <input
            name="title"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Event type *</span>
          <select
            name="eventType"
            required
            disabled={isPending}
            defaultValue="HOLIDAY"
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            {EVENT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Academic year *</span>
          <select
            name="academicYearId"
            required
            disabled={isPending}
            defaultValue={currentYear?.id ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="" disabled>
              Select
            </option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Start date *</span>
          <input
            type="date"
            name="startDate"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">End date *</span>
          <input
            type="date"
            name="endDate"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-text">
          <input type="checkbox" name="isHoliday" disabled={isPending} className="h-4 w-4 rounded border-border" />
          This is a holiday (no school)
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Applies to *</span>
          <select
            name="scopeType"
            required
            disabled={isPending}
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="SCHOOL">Whole school</option>
            <option value="STAGE">One stage</option>
            <option value="CAMPUS">One campus</option>
            <option value="GRADE">One standard</option>
            <option value="SECTION">One section</option>
          </select>
        </label>
        {scopeType === "STAGE" && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Stage *</span>
            <select
              name="scopeStage"
              required
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
            >
              {STAGES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
        {scopeOptions.length > 0 && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">
              {scopeType === "CAMPUS" ? "Campus" : scopeType === "GRADE" ? "Standard" : "Section"} *
            </span>
            <select
              name="scopeId"
              required
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
            >
              <option value="" disabled>
                Select
              </option>
              {scopeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Add event"}
        </button>
      </div>
    </form>
  );
}
