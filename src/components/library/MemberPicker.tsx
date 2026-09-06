"use client";

// Search-and-select an ACTIVE Library member by name -- debounced call to a Server
// Action (searchActiveMembersAction), same shape as dashboard/PersonPicker's debounced
// fetch, just calling a Server Action instead of an internal API route (this app's
// rule: client components never call the backend directly).

import { useEffect, useRef, useState } from "react";
import { searchActiveMembersAction, type MemberHit } from "@/app/(dashboard)/library/search-actions";

export function MemberPicker({
  label = "Member *",
  disabled,
  onSelect,
}: {
  label?: string;
  disabled?: boolean;
  onSelect: (member: MemberHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberHit | null>(null);
  const [results, setResults] = useState<MemberHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected || query.trim().length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const hits = await searchActiveMembersAction(query);
      setResults(hits);
      setLoading(false);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">{label}</span>
      <input
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by member name…"
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
      {open && !selected && (
        <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          {loading && <li className="px-3 py-2.5 text-[13px] text-text-muted">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-text-muted">No active member matches.</li>
          )}
          {!loading &&
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(m);
                    onSelect(m);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
                >
                  <span className="font-semibold text-text">{m.name}</span>
                  <span className="ml-2 text-xs text-text-muted">{m.memberType}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
