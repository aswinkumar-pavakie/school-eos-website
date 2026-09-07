"use client";

// Search-and-select a student by name/admission number, for the "Request new
// member" form -- same interaction pattern as
// src/components/parents/StudentPersonPicker.tsx, but hits the
// Community-scoped /api/community-student-search proxy (which calls the
// COMMUNITY-authorized backend endpoint, not the general Students module).

import { useEffect, useRef, useState } from "react";

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

export function CommunityStudentPicker({
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
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community-student-search?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const body = (await res.json()) as { data: StudentHit[] };
          setResults(body.data);
          setOpen(true);
        }
      } finally {
        setLoading(false);
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
      {!selected && (
        <span className="text-xs text-text-muted">
          {loading ? "Searching…" : "Only students not already in this community are shown."}
        </span>
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
                <span className="ml-2 text-xs font-mono text-text-muted">{s.admissionNo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
