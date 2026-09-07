// Component #25 — every list ships no-data, no-permission and failed-load copy.
// Spec: "No full-page spinner" — this is the same shape used for all three.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-field px-6 py-10 text-center">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{body}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-critical-text/30 bg-critical-bg px-6 py-5">
      <p className="text-sm font-medium text-critical-text">{message}</p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-critical-text">{message}</p>;
}
