// Sports Admin's own "known backend gap" notice -- mirrors faculty-ui's
// GapNotice.tsx, but keeps the same page-title chrome (40px h1 + 15px sub)
// every other screen in this module uses, rather than a bare, title-less
// notice, so the module still reads as one consistent product even where a
// screen is honestly disclosing a real gap. Used only where a real backend
// investigation confirmed no equivalent capability exists yet (Trials &
// selection, Injuries & incidents, Budget & approvals, PT/sports periods) --
// never as a shortcut for something that could have been wired.
export function GapNotice({ title, sub, feature }: { title: string; sub: string; feature: string }) {
  return (
    <div className="sports-scope">
      <div>
        <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)" }}>{title}</h1>
        <p style={{ margin: 0, marginTop: 8, fontSize: 15, color: "var(--sport-muted-2)" }}>{sub}</p>
      </div>
      <div
        style={{
          marginTop: 24,
          padding: "40px 32px",
          textAlign: "center",
          background: "#fff",
          border: "1px solid var(--sport-border)",
          borderRadius: "var(--sport-radius-card)",
          fontSize: 14,
          color: "var(--sport-tertiary)",
        }}
      >
        {feature} isn&apos;t available yet — this screen is fully designed and will work as soon as the backend for it is built. Nothing here is fake data.
      </div>
    </div>
  );
}
