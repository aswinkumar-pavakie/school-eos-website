"use client";

// Search-and-select any person by name (GET /persons?search=, via the existing
// /api/persons-search proxy -- same one GuardianPersonPicker uses, just without
// its roleCode=PARENT restriction). For assigning repair/maintenance work to a
// staff member -- no new role/login, just picking an existing person record.

import { useEffect, useRef, useState } from "react";

interface PersonHit {
  id: string;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  email: string | null;
}

export function PersonPicker({
  label = "Assign to *",
  disabled,
  onSelect,
}: {
  label?: string;
  disabled?: boolean;
  onSelect: (person: PersonHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PersonHit | null>(null);
  const [results, setResults] = useState<PersonHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/persons-search?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: PersonHit[] };
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
      <span className="font-semibold text-text">{label}</span>
      <input
        value={selected ? `${selected.firstName} ${selected.lastName ?? ""}` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by name, mobile, or email…"
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
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(p);
                  onSelect(p);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">
                  {p.firstName} {p.lastName ?? ""}
                </span>
                <span className="ml-2 text-xs text-text-muted">{p.mobile ?? p.email ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
