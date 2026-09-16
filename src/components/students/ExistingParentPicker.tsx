"use client";

// Search-and-select an EXISTING parent account (GET /persons?search=&roleCode=PARENT,
// same real endpoint GuardianPersonPicker.tsx already uses from a student's own
// profile) for the Father/Mother cards on the "Enroll students" admission page.
//
// Why this exists: without it, this page's own Father/Mother step always called
// POST /persons and created a brand-new parent account, even if that phone/email
// already belonged to someone (e.g. the same father being linked to a second
// child). The backend's real unique constraint on login_identifier already turns
// that into a clean 409 ("An account with this email or mobile number already
// exists.") rather than a raw 500 or a silent duplicate -- but the admin only
// found out after filling in the whole card and hitting Publish. Every other
// real guardian-linking surface in this app (GuardiansSection's own "+ Link
// guardian" form) already offers "search existing, or create new" up front;
// this brings Enroll Students' own inline step to the same standard instead of
// skipping straight to "always create new".
//
// Callback-based (like StudentPersonPicker), not hidden-input-based (like
// GuardianPersonPicker) -- the parent form needs to know a selection happened
// so it can disable/grey out the rest of that card's "create new" fields.

import { useEffect, useRef, useState } from "react";

export interface ExistingParentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  email: string | null;
}

export function ExistingParentPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (parent: ExistingParentHit | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExistingParentHit | null>(null);
  const [results, setResults] = useState<ExistingParentHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/persons-search?search=${encodeURIComponent(query)}&roleCode=PARENT`);
        if (res.ok) {
          const body = (await res.json()) as { data: ExistingParentHit[] };
          setResults(body.data);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  if (selected) {
    return (
      <div className="rounded-[11px] border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
        <p className="font-semibold text-text">
          Linking existing account — {selected.firstName} {selected.lastName ?? ""}
        </p>
        <p className="text-xs text-text-muted">{selected.mobile ?? selected.email ?? ""}</p>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            onSelect(null);
          }}
          className="mt-1 text-xs font-semibold text-critical-text"
        >
          Change — create a new account instead
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder="Already has a parent account? Search by name, mobile, or email…"
        className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        autoComplete="off"
      />
      <span className="text-xs text-text-muted">
        {loading ? "Searching…" : "Leave blank to create a brand-new parent account below."}
      </span>
      {open && results.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(p);
                  onSelect(p);
                  setOpen(false);
                  setQuery("");
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
