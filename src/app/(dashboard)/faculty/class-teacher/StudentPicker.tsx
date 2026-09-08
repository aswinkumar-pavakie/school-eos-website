"use client";

// Search-and-select a student within this one section -- same debounced
// search-box pattern as components/dashboard/PersonPicker.tsx, proxied
// through /api/faculty-student-search (the httpOnly access-token cookie a
// client component can't reach directly).

import { useEffect, useRef, useState } from "react";

interface StudentHit {
  studentId: string;
  studentName: string;
  rollNo: number | null;
}

export function StudentPicker({ sectionId, onSelect }: { sectionId: string; onSelect: (student: StudentHit | null) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const [results, setResults] = useState<StudentHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 1) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/faculty-student-search?sectionId=${sectionId}&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: StudentHit[] };
        setResults(body.data);
        setOpen(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, sectionId]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-text-muted">Student</span>
      <div className="relative">
        <input
          value={selected ? `${selected.studentName} · Roll ${selected.rollNo ?? "—"}` : query}
          onChange={(e) => {
            setSelected(null);
            onSelect(null);
            setQuery(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by name…"
          className="w-full rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          autoComplete="off"
        />
        {open && !selected && results.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-input)] border border-border bg-surface py-1 shadow-lg">
            {results.map((s) => (
              <li key={s.studentId}>
                <button
                  type="button"
                  onClick={() => { setSelected(s); onSelect(s); setOpen(false); }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-field"
                >
                  <span className="font-semibold text-text">{s.studentName}</span>
                  <span className="ml-2 text-xs text-text-muted">Roll {s.rollNo ?? "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input type="hidden" name="studentId" value={selected?.studentId ?? ""} required />
      {selected && (
        <button type="button" onClick={() => { setSelected(null); onSelect(null); setQuery(""); }} className="self-start text-xs font-semibold text-critical-text">
          Change
        </button>
      )}
    </div>
  );
}
