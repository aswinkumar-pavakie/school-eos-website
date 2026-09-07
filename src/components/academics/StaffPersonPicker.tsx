"use client";

// Search-and-select a staff member by name/employee number (GET /staff?search=),
// for assigning a Class Advisor / Academic Coordinator / Sports Teacher.

import { useEffect, useRef, useState } from "react";

export interface StaffHit {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
}

export function StaffPersonPicker({
  disabled,
  onSelect,
  name = "personId",
}: {
  disabled?: boolean;
  onSelect?: (staff: StaffHit | null) => void;
  name?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StaffHit | null>(null);
  const [results, setResults] = useState<StaffHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/staff-search?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: StaffHit[] };
        setResults(body.data);
        setOpen(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">Staff member *</span>
      <input type="hidden" name={name} value={selected?.personId ?? ""} required />
      <input
        value={selected ? `${selected.firstName} ${selected.lastName ?? ""} (${selected.employeeNo})` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect?.(null);
          setQuery(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by name or employee number…"
        className="rounded-[11px] border border-border bg-surface px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
        autoComplete="off"
      />
      {selected && (
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            onSelect?.(null);
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
                  onSelect?.(s);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">
                  {s.firstName} {s.lastName ?? ""}
                </span>
                <span className="ml-2 text-xs text-text-muted font-mono">{s.employeeNo}</span>
                {s.designation && <span className="ml-2 text-xs text-text-muted">{s.designation}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
