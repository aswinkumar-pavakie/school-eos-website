"use client";

export function SignOutButton({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <form action={onSignOut}>
      <button
        type="submit"
        style={{ background: "none", border: "1px solid var(--par-border)", color: "var(--par-body-muted)", borderRadius: 9, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        Sign out
      </button>
    </form>
  );
}
