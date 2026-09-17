// Same fix as src/lib/library-time.ts/src/lib/faculty-time.ts: wrapping
// Date.now()/new Date() in a plain utility satisfies eslint-plugin-react-
// hooks's purity rule (no impure call during render), even for Server
// Components. Kept as Hostel Warden's own file rather than a shared import,
// matching this app's existing per-role *-time.ts convention.

export function nowMs(): number {
  return Date.now();
}

/** "2026-09-16" in the local calendar day -- used to scope today's night-
 * attendance roster / gate-log window to the actual local day, not a UTC-
 * shifted one. */
export function todayIsoDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
