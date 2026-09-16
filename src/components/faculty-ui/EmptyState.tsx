// Pixel-perfect empty state for genuine zero-row results (e.g. "No requests
// in this list."). Deliberately NOT used for the 5 known-gap screens' 403/404
// path -- that path renders the sitewide src/components/ui/EmptyState's
// ErrorState instead, so "not wired up yet" stays visually distinct from a
// real empty result.
export function FacultyEmptyState({ message }: { message: string }) {
  return (
    <div
      className="fac-hover-lift"
      style={{
        background: "var(--fac-white)",
        border: "1px solid var(--fac-border)",
        borderRadius: "var(--fac-radius-card)",
        padding: "60px",
        textAlign: "center",
        font: "400 15px/1.5 var(--fac-font-sans)",
        color: "var(--fac-tertiary)",
      }}
    >
      {message}
    </div>
  );
}
