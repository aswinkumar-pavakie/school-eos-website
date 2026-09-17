"use client";

// Transport Overview navbar's own search bar -- pixel-matched to the SIS
// Transport mockup's own header (placeholder text, "Ctrl K" kbd chip inside
// the input). Real data across buses/routes/drivers via /api/transport-search
// (see that route's own comment) -- same debounced/arrow-key-navigable
// pattern as the shared GlobalSearch component, kept as its own file because
// the result domain (buses/routes/drivers, not students/staff/parents) and
// the exact mockup styling (kbd chip, placeholder) are both genuinely
// different, not a copy-paste duplicate.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/transport/MaterialIcon";

interface SearchResult {
  type: "bus" | "route" | "driver";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export function TransportSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/transport-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const body = (await res.json()) as { data: SearchResult[] };
          setResults(body.data);
          setOpen(true);
          setActiveIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  function goTo(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative w-full flex-1">
      <label className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-text-muted transition-colors focus-within:border-primary">
        <MaterialIcon name="search" size={20} className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
              e.preventDefault();
              goTo(results[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search buses, routes, drivers or documents…"
          className="w-full min-w-0 bg-transparent text-[14px] text-text placeholder:text-text-muted focus:outline-none"
        />
        <span className="hidden shrink-0 rounded-[6px] border border-border px-2 py-0.5 font-mono text-[11px] text-text-muted sm:block">
          Ctrl K
        </span>
      </label>

      {open && (
        <div className="absolute top-full z-20 mt-1.5 w-full max-h-80 overflow-y-auto rounded-[11px] border border-border bg-surface py-1.5 shadow-lg">
          {loading && <p className="px-3.5 py-2.5 text-sm text-text-muted">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="px-3.5 py-2.5 text-sm text-text-muted">No matches for &quot;{query}&quot;.</p>
          )}
          {!loading &&
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => goTo(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`block w-full px-3.5 py-2.5 text-left text-sm transition-colors ${activeIndex === i ? "bg-field" : ""}`}
              >
                <span className="font-semibold text-text">{r.label}</span>
                <span className="ml-2 text-xs text-text-muted">{r.sublabel}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
