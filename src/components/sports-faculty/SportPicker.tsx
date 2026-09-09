"use client";

// Faculty has no catalog endpoint to browse every sport (GET /sports is
// Admin-only) -- only the sport(s) already visible through their own teams/
// tournaments. This offers those as a convenience dropdown that fills the same
// text field a raw Sport ID can be pasted into, rather than silently limiting
// what can be typed.

import { useState } from "react";

export function SportPicker({
  knownSports,
  disabled,
  defaultValue,
}: {
  knownSports: { id: string; name: string }[];
  disabled?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="sportId" className="text-xs font-bold tracking-wide text-text-muted uppercase">
        Sport <span className="text-critical-text">*</span>
      </label>
      {knownSports.length > 0 && (
        <select
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) setValue(e.target.value);
          }}
          className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
        >
          <option value="">Choose from your sports…</option>
          {knownSports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <input
        id="sportId"
        name="sportId"
        required
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={knownSports.length === 0 ? "Ask your Admin for this sport's ID" : "…or paste a Sport ID"}
        className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-60"
      />
    </div>
  );
}
