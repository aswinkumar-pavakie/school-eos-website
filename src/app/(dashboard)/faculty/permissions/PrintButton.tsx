"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 20px" }}
      className="no-print"
    >
      Print / Save as PDF
    </button>
  );
}
