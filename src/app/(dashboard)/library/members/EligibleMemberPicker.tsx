"use client";

// Replaces a raw "type a person ID" text box: the full list of people not yet a
// Library member shows on focus and narrows as you type -- same shape as
// hostel/UnallocatedStudentPicker.tsx.

import { useEffect, useRef, useState } from "react";
import type { EligiblePerson } from "@/lib/library-api";

export function EligibleMemberPicker({
  people,
  onSelect,
  disabled,
}: {
  people: EligiblePerson[];
  onSelect: (person: EligiblePerson | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EligiblePerson | null>(null);
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
    ? people.filter(
        (p) =>
          `${p.firstName} ${p.lastName ?? ""}`.toLowerCase().includes(q) ||
          p.identifier.toLowerCase().includes(q),
      )
    : people;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        Person <span className="text-critical-text">*</span>
      </span>
      <input
        value={selected ? `${selected.firstName} ${selected.lastName ?? ""}` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        placeholder={people.length === 0 ? "Everyone is already a member" : "Click to see eligible people…"}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
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
      {open && !selected && (
        <ul className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-text-muted">
              {people.length === 0 ? "No one is eligible right now." : "No match."}
            </li>
          )}
          {results.map((p) => (
            <li key={p.personId}>
              <button
                type="button"
                onClick={() => {
                  setSelected(p);
                  onSelect(p);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">{p.firstName} {p.lastName ?? ""}</span>
                <span className="ml-2 text-xs text-text-muted">{p.memberType === "STUDENT" ? "Student" : "Staff"} · {p.identifier}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
