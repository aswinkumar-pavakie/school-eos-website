"use client";

// Search-and-select an AVAILABLE book copy by title/author/ISBN -- debounced call
// to searchIssuableCopiesAction (see ../../app/(dashboard)/library/search-actions.ts).
// Same shape as MemberPicker; kept separate since the two search a different real
// endpoint and render a different result shape.

import { useEffect, useRef, useState } from "react";
import { searchIssuableCopiesAction, type IssuableCopyHit } from "@/app/(dashboard)/library/search-actions";

export function CopyPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (copy: IssuableCopyHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<IssuableCopyHit | null>(null);
  const [results, setResults] = useState<IssuableCopyHit[]>([]);
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
      const hits = await searchIssuableCopiesAction(query);
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
      <span className="font-semibold text-text">
        Book copy <span className="text-critical-text">*</span>
      </span>
      <input
        value={selected ? `${selected.bookTitle} (${selected.copyCode})` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by title, author, or ISBN…"
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
            <li className="px-3 py-2.5 text-[13px] text-text-muted">No available copy matches.</li>
          )}
          {!loading &&
            results.map((c) => (
              <li key={c.copyId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(c);
                    onSelect(c);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
                >
                  <span className="font-semibold text-text">{c.bookTitle}</span>
                  <span className="ml-2 font-mono text-xs text-text-muted">{c.copyCode}</span>
                  {c.reservedForPickup && (
                    <span className="ml-2 text-xs font-semibold text-pending-text">Held for pickup</span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
