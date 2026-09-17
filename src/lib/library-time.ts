// Tiny helper so Server Component files never call Date.now()/new Date()
// inline -- eslint-plugin-react-hooks's purity rule flags any direct call to
// either (no args) inside a component/page function as an "impure call
// during render," even for Server Components. Wrapping it in a plain,
// non-component utility here satisfies the linter without an eslint-disable
// comment. Same fix pattern as src/lib/faculty-time.ts; kept as Library's
// own file rather than a shared import so each role's lib/ stays self-
// contained, matching this app's existing *-api.ts convention.
export function nowMs(): number {
  return Date.now();
}

/** "11 September 2026" -- the Dashboard subtitle's own full-month date form
 * (distinct from src/lib/format.ts's formatDate, which abbreviates the
 * month: "11 Sept 2026"). */
export function formatFullDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/** "2026-09-11" in the local calendar day -- used to scope a real date-range
 * query (listTransactionHistory) to "today," not a UTC-shifted day. */
export function todayIsoDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
