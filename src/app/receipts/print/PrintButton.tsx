"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-[var(--radius-input)] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
    >
      Print
    </button>
  );
}
