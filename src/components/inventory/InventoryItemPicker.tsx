"use client";

// Search-and-select an inventory item by name/asset code (GET /inventory-items?
// search=, via /api/inventory-items-search) -- for Repair & Maintenance's
// "Select affected inventory item", which is optional (a request can be for a
// general facility issue with no specific item).

import { useEffect, useRef, useState } from "react";

interface ItemHit {
  id: string;
  name: string;
  assetCode: string | null;
  status: string;
}

export function InventoryItemPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (item: ItemHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ItemHit | null>(null);
  const [results, setResults] = useState<ItemHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/inventory-items-search?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = (await res.json()) as { data: ItemHit[] };
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
      <span className="font-semibold text-text">Affected inventory item (optional)</span>
      <input
        value={selected ? `${selected.name}${selected.assetCode ? ` (${selected.assetCode})` : ""}` : query}
        onChange={(e) => {
          setSelected(null);
          onSelect(null);
          setQuery(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Search by item name or asset code…"
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
          {results.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(i);
                  onSelect(i);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-field"
              >
                <span className="font-semibold text-text">{i.name}</span>
                {i.assetCode && <span className="ml-2 text-xs text-text-muted font-mono">{i.assetCode}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
