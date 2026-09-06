// Fixed number/date/money formats -- Design Architecture v0.1 section 14 / brain/School
// EOS Design Architecture.pdf page 21. These are not per-screen choices: an ambiguous
// date, count, or amount costs someone real time. No value is ever rendered as a bare
// 0, blank, or "N/A" -- an em dash in muted grey instead.

// "31 Aug 2026" — never a numeric-only date format. Superset of the plain
// `string | Date` signature other modules call this with: a null/undefined/invalid
// input renders "—" instead of throwing, everything else behaves identically.
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// "14:20" — 24-hour, no am/pm, no seconds.
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
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

/** "412 / 480" -- present over total, denominator never dropped. */
export function formatCount(numerator: number, denominator: number): string {
  return `${numerator} / ${denominator}`;
}

/** A percent VALUE already computed (e.g. a concession's stored 5.00 percent field)
 * -- "5%". For a percent derived FROM a numerator/denominator pair, use
 * formatPercentOf instead; the two are not interchangeable (one takes an amount, the
 * other takes a fraction's two halves). */
export function formatPercent(value: string | number, decimals = 0): string {
  return `${Number(value).toFixed(decimals)}%`;
}

/** "86%" -- rounded, no decimals, computed FROM a numerator/denominator pair (e.g.
 * hostel occupancy: occupied beds over total beds). Renders "—" rather than dividing
 * by zero. */
export function formatPercentOf(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

// Formatting rules from brain/School EOS Design Architecture.pdf, page 21 — followed
// literally: symbol+space+two-decimals for a single amount, Indian digit grouping with
// no decimals for a summary total, never abbreviated.

/** "₹ 18,400.00" -- symbol before, space after, two decimals, Indian grouping.
 * Input is always paise (bigint-as-string from the backend, or a plain number). */
export function formatMoneyDetail(paise: string | number): string {
  const rupees = Number(BigInt(paise)) / 100;
  return `₹ ${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Alias for formatMoneyDetail -- same rule, kept under both names so neither this
 * module's own components nor Admin/Transport's need to change their imports. */
export const formatMoney = formatMoneyDetail;

/** "₹ 4,42,000" -- Indian grouping, no decimals, for a summary total. */
export function formatMoneySummary(paise: string | number): string {
  const rupees = Math.round(Number(BigInt(paise)) / 100);
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}

// No value is ever 0, blank, or "N/A" — em dash in muted grey instead.
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  PENDING: "Pending",
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  SUPERSEDED: "Superseded",
  PARTIAL: "Partial",
  PAID: "Paid",
  WAIVED: "Waived",
  OVERDUE: "Overdue",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  RECONCILED: "Reconciled",
  REVERSED: "Reversed",
  INITIATED: "Initiated",
  PROCESSED: "Processed",
  RECORDED: "Recorded",
  RUNNING: "Running",
  NEEDS_REVIEW: "Needs review",
  CLOSED: "Closed",
  MATCHED: "Matched",
  UNMATCHED: "Unmatched",
  DISCREPANCY: "Discrepancy",
  RESOLVED: "Resolved",
  VALIDATED: "Validated",
  VALIDATION_FAILED: "Validation failed",
  COMMITTED: "Committed",
  ORDERED: "Ordered",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  PART_DELIVERED: "Partly delivered",
  // Media Room (shoot assignments / social posts / equipment status)
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  DAMAGED: "Damaged",
  LOST: "Lost",
  RETIRED: "Retired",
};

export function statusLabel(state: string): string {
  return STATUS_LABELS[state] ?? state;
}

// Every chip is one of exactly 3 colors (success/pending/critical) — never a 4th, never color alone.
export type StatusTone = "success" | "pending" | "critical";

const STATUS_TONE: Record<string, StatusTone> = {
  ACTIVE: "success", APPROVED: "success", PAID: "success", CONFIRMED: "success",
  RECONCILED: "success", PROCESSED: "success", MATCHED: "success", RESOLVED: "success",
  COMMITTED: "success", VALIDATED: "success", CLOSED: "success", DELIVERED: "success",
  COMPLETED: "success", PUBLISHED: "success", AVAILABLE: "success",
  DRAFT: "pending", PENDING: "pending", PENDING_APPROVAL: "pending", PARTIAL: "pending",
  RECORDED: "pending", INITIATED: "pending", RUNNING: "pending", NEEDS_REVIEW: "pending",
  UNMATCHED: "pending", SUPERSEDED: "pending",
  ORDERED: "pending", DISPATCHED: "pending", IN_TRANSIT: "pending", PART_DELIVERED: "pending",
  PLANNED: "pending", IN_PROGRESS: "pending", SCHEDULED: "pending", ASSIGNED: "pending",
  REJECTED: "critical", CANCELLED: "critical", OVERDUE: "critical", FAILED: "critical",
  REVERSED: "critical", DISCREPANCY: "critical", VALIDATION_FAILED: "critical", WAIVED: "pending",
  DAMAGED: "critical", LOST: "critical", RETIRED: "critical",
};

export function statusTone(state: string): StatusTone {
  return STATUS_TONE[state] ?? "pending";
}
