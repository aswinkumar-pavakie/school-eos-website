"use client";

// Search-and-select a student by name/admission number (GET /students?search=),
// for linking a newly-created parent to a child already in the system.

import { useEffect, useRef, useState } from "react";

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

export function StudentPersonPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (student: StudentHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const [results, setResults] = useState<StudentHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/students-search?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: StudentHit[] };
        setResults(body.data);
        setOpen(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  return (
    <div className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">Student *</span>
      <input
        value={selected ? `${selected.firstName} ${selected.lastName ?? ""} (${selected.admissionNo})` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by student name or admission number…"
        className="rounded-[11px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
        autoComplete="off"
      />
      {selected && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            onSelect(null);
            setQuery("");
          }}
          className="self-start text-xs font-semibold text-critical-text"
        >
          Change
        </button>
      )}
      {open && !selected && results.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(s);
                  onSelect(s);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">
                  {s.firstName} {s.lastName ?? ""}
                </span>
                <span className="ml-2 text-xs text-text-muted font-mono">{s.admissionNo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
