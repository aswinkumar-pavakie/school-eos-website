"use client";

// Checkbox selection for "print just these" -- an explicit hand-picked set of
// rows on a list page, printed via the same bulk print routes as a group
// filter (see /print/.../id-cards) but passing ?ids=... instead of a filter.
// A row's own checkbox and the header's "select all" both read/write the same
// selection state via context, so they don't need prop-drilling through every
// list page's table markup.
//
// Persisted to localStorage (keyed per list, see storageKey) so picking rows
// on page 1, then paginating to page 3, doesn't lose the earlier picks -- each
// page load is a full server render in this app (no client-side route cache),
// so plain React state alone would reset on every "Next" click.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface SelectionContextValue {
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clear: () => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

function readStored(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function SelectionProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  // Starts empty (matches server-rendered markup) and hydrates from
  // localStorage right after mount -- avoids an SSR/client mismatch, at the
  // cost of a one-frame flash of "nothing selected" on load.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelected(readStored(storageKey));
    setHydrated(true);
    // storageKey identifies a distinct list (students/faculty/parents) -- if it
    // ever changes under the same provider instance, reload from that list's
    // own stored selection rather than keeping the previous list's.
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...selected]));
    } catch {
      // Best-effort only -- a private window or full storage just means
      // selection won't survive navigation, not a broken page.
    }
  }, [storageKey, selected, hydrated]);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selected,
      toggle: (id: string) =>
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      toggleAll: (ids: string[]) =>
        setSelected((prev) => {
          const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
          if (allSelected) {
            const next = new Set(prev);
            for (const id of ids) next.delete(id);
            return next;
          }
          return new Set([...prev, ...ids]);
        }),
      clear: () => setSelected(new Set()),
    }),
    [selected],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within a SelectionProvider");
  return ctx;
}

export function RowCheckbox({ id }: { id: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      aria-label="Select row"
      className="h-4 w-4 rounded border-border"
    />
  );
}

/** Selects/deselects just this page's rows -- other pages' earlier picks (if
 * any, from localStorage) are left untouched. */
export function SelectAllCheckbox({ ids }: { ids: string[] }) {
  const { selected, toggleAll } = useSelection();
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  return (
    <input
      type="checkbox"
      checked={allSelected}
      onChange={() => toggleAll(ids)}
      aria-label="Select all on this page"
      className="h-4 w-4 rounded border-border"
    />
  );
}

/** The one print entry point for a list page -- lives where "Print ID cards"
 * used to be, top-right of the page header. Switches automatically: with
 * anything selected (on this page or an earlier one), it prints exactly that
 * hand-picked set (across pages) and shows a way to clear it; with nothing
 * selected, it falls back to printing everyone the current filter matches
 * (e.g. the whole "Active" tab), which is what "print all active students at
 * once" actually is -- no separate control needed for that case. */
export function PrintIdCardsButton({ basePath, filterHref }: { basePath: string; filterHref: string }) {
  const { selected, clear } = useSelection();

  if (selected.size === 0) {
    return (
      <a
        href={filterHref}
        className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-bg"
      >
        Print ID cards
      </a>
    );
  }

  const href = `${basePath}?ids=${[...selected].join(",")}`;
  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        Print {selected.size} selected
      </a>
      <button
        type="button"
        onClick={clear}
        className="text-[13px] font-semibold text-text-muted hover:text-text"
      >
        Clear
      </button>
    </div>
  );
}

/** For lists with no filter-based bulk print to fall back to (Parents -- no
 * natural "group" the way Students has a standard/section) -- shows nothing
 * until something's selected, then a floating "print just these" bar. */
export function PrintSelectedBar({ basePath }: { basePath: string }) {
  const { selected } = useSelection();
  if (selected.size === 0) return null;
  const href = `${basePath}?ids=${[...selected].join(",")}`;
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-[14px] border border-border bg-surface px-5 py-3 shadow-lg">
      <span className="text-sm font-semibold text-text">{selected.size} selected</span>
      <a
        href={href}
        className="rounded-[11px] bg-primary px-4 py-2 text-sm font-bold text-white"
      >
        Print {selected.size} ID card{selected.size === 1 ? "" : "s"}
      </a>
    </div>
  );
}
