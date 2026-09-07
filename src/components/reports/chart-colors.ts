// Reports & Analytics color rules -- Design Architecture v0.1 tokens plus the
// dataviz skill's validated 8-slot categorical palette (checked against this
// app's own primary blue and white surface). Single-series charts use
// CHART_BLUE only, never the categorical palette. Status-shaped data uses this
// app's own 3 status colors by meaning (never the categorical palette, never a
// 4th status color) -- see src/lib/format.ts's statusTone() for the single
// source of truth on which state maps to which meaning.

export const CHART_BLUE = "#2b6fe0";
export const NEUTRAL_MUTED = "#98a2b3";
export const GRID_STROKE = "#eaecf0";
export const AXIS_TICK_MUTED = "#98a2b3";
export const AXIS_TICK_TEXT = "#101828";

// Fixed order, never reordered/cycled past 8 -- fold anything beyond into "Other".
export const CATEGORICAL_PALETTE = [
  "#2b6fe0", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const STATUS_HEX: Record<"success" | "pending" | "critical", string> = {
  success: "#027a48",
  pending: "#b54708",
  critical: "#b42318",
};

export interface CategoricalItem {
  label: string;
  value: number;
}

export interface ColoredItem extends CategoricalItem {
  color: string;
}

/** Assigns the fixed-order 8-slot categorical palette to a list of category
 * labels, in the order given by the caller (backend query order) -- folds
 * anything past the 8th slot into a single "Other" bucket rather than
 * reordering or cycling the palette. */
export function assignCategoricalColors(items: CategoricalItem[]): ColoredItem[] {
  const kept = items.slice(0, 8).map((item, i) => ({ ...item, color: CATEGORICAL_PALETTE[i] }));
  const rest = items.slice(8);
  if (rest.length === 0) return kept;
  const otherValue = rest.reduce((sum, item) => sum + item.value, 0);
  return [...kept, { label: "Other", value: otherValue, color: NEUTRAL_MUTED }];
}
