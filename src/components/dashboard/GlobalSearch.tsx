"use client";

// Navbar "jump to a page" search -- was a purely decorative input before. Debounced
// search across Students/Faculty/Parents via /api/global-search, arrow-key
// navigable, click or Enter to jump straight to that record's profile.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

interface SearchResult {
  type: "student" | "staff" | "parent";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const body = (await res.json()) as { data: SearchResult[] };
          setResults(body.data);
          setOpen(true);
          setActiveIndex(-1);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
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

  function goTo(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label className="flex items-center gap-2.5 rounded-[11px] border border-border bg-field px-4 py-2.5 text-text-muted transition-colors focus-within:border-primary focus-within:bg-surface">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <input
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
          placeholder="Jump to a page — students, staff, parents…"
          className="w-full min-w-0 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
        />
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
                className={`block w-full px-3.5 py-2.5 text-left text-sm transition-colors ${
                  activeIndex === i ? "bg-field" : ""
                }`}
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
