// Fixed number/date formats -- Design Architecture v0.1 section 14. These are not
// per-screen choices: an ambiguous date or count costs someone real time.

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "412 / 480" -- present over total, denominator never dropped. */
export function formatCount(numerator: number, denominator: number): string {
  return `${numerator} / ${denominator}`;
}

/** No decimals in a summary. */
export function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

/** "₹ 18,400.00" -- symbol before, space after, two decimals, Indian grouping.
 * Input is always paise (bigint-as-string from the backend, or a plain number). */
export function formatMoney(paise: string | number): string {
  const rupees = Number(paise) / 100;
  const formatted = rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₹ ${formatted}`;
}

/** "₹ 4,42,000" -- Indian grouping, no decimals, for a summary total. */
export function formatMoneySummary(paise: string | number): string {
  const rupees = Math.round(Number(paise) / 100);
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} d ago`;
}
