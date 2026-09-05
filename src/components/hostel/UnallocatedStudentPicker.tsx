"use client";

// Replaces a raw "type a student ID" text box: the full list of unallocated
// hostel students shows immediately on focus (not just after typing), and
// narrows as you type a name/admission number. Used by AllocationsPanel's "New
// allocation" form.

import { useEffect, useRef, useState } from "react";

export interface UnallocatedStudent {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
}

export function UnallocatedStudentPicker({
  students,
  disabled,
}: {
  students: UnallocatedStudent[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UnallocatedStudent | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? students.filter(
        (s) =>
          `${s.firstName} ${s.lastName ?? ""}`.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q),
      )
    : students;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        Student <span className="text-critical-text">*</span>
      </span>
      <input type="hidden" name="studentId" value={selected?.id ?? ""} required />
      <input
        value={selected ? `${selected.firstName} ${selected.lastName ?? ""} (${selected.admissionNo})` : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        placeholder={students.length === 0 ? "No unallocated hostel students" : "Click to see unallocated students…"}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
      />
      {selected && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setQuery("");
          }}
          className="self-start text-xs font-semibold text-critical-text"
        >
          Change
        </button>
      )}
      {open && !selected && (
        <ul className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-text-muted">
              {students.length === 0 ? "Every hostel student already has a bed." : "No match."}
            </li>
          )}
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(s);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">
                  {s.firstName} {s.lastName ?? ""}
                </span>
                <span className="ml-2 text-xs text-text-muted">
                  {s.admissionNo}
                  {s.gradeName ? ` · ${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
