"use client";

// Search-and-select an ACTIVE student by name or admission number, for recording a
// visit. Submits the chosen id as the hidden `studentId` field.

import { useEffect, useRef, useState } from "react";
import type { StudentLookup } from "@/lib/health-incharge-api";
import { classLabel, studentName } from "@/lib/health-incharge-api";

export function HealthStudentPicker({ name = "studentId" }: { name?: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentLookup | null>(null);
  const [fetched, setFetched] = useState<StudentLookup[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // Hits only count while a search is active (derived, so no state is set inside the effect body).
  const results = !selected && query.trim().length >= 2 ? fetched : [];

  useEffect(() => {
    if (selected || query.trim().length < 2) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/health-student-search?search=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        setFetched(((await res.json()) as { data: StudentLookup[] }).data);
        setOpen(true);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, selected]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={box} className="relative flex flex-col gap-1.5">
      <label htmlFor="health-student-input" className="text-xs font-bold tracking-wide text-text-muted uppercase">
        Student *
      </label>
      <input type="hidden" name={name} value={selected?.studentId ?? ""} />
      <input
        id="health-student-input"
        value={selected ? `${studentName(selected)} · ${classLabel(selected.gradeName, selected.sectionName)}` : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Type a name or admission number"
        autoComplete="off"
        className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
      {open && !selected && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-[var(--radius-input)] border border-border bg-surface shadow-lg">
          {results.map((s) => (
            <li key={s.studentId}>
              <button
                type="button"
                onClick={() => {
                  setSelected(s);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-field"
              >
                <span className="font-semibold text-text">{studentName(s)}</span>
                <span className="text-xs text-text-muted">
                  {classLabel(s.gradeName, s.sectionName)} · {s.admissionNo}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
