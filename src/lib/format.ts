// Formatting rules from brain/School EOS Design Architecture.pdf, page 21 — followed
// literally: symbol+space+two-decimals for a single amount, Indian digit grouping with
// no decimals for a summary total, never abbreviated, no value ever rendered as 0/blank/N-A.

export function formatMoneyDetail(paise: string | number): string {
  const rupees = Number(BigInt(paise)) / 100;
  return `₹ ${rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMoneySummary(paise: string | number): string {
  const rupees = Math.round(Number(BigInt(paise)) / 100);
  return `₹ ${rupees.toLocaleString("en-IN")}`;
}

export function formatPercent(value: string | number, decimals = 0): string {
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatCount(numerator: number, denominator: number): string {
  return `${numerator} / ${denominator}`;
}

// "31 Aug 2026" — never a numeric-only date format.
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
  DRAFT: "pending", PENDING: "pending", PENDING_APPROVAL: "pending", PARTIAL: "pending",
  RECORDED: "pending", INITIATED: "pending", RUNNING: "pending", NEEDS_REVIEW: "pending",
  UNMATCHED: "pending", SUPERSEDED: "pending",
  ORDERED: "pending", DISPATCHED: "pending", IN_TRANSIT: "pending", PART_DELIVERED: "pending",
  REJECTED: "critical", CANCELLED: "critical", OVERDUE: "critical", FAILED: "critical",
  REVERSED: "critical", DISCREPANCY: "critical", VALIDATION_FAILED: "critical", WAIVED: "pending",
};

export function statusTone(state: string): StatusTone {
  return STATUS_TONE[state] ?? "pending";
}
