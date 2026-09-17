// Sports Admin's own "known backend gap" notice -- mirrors faculty-ui's
// GapNotice.tsx exactly. Used only where a real backend investigation
// confirmed no equivalent capability exists yet (Trials & selection,
// Injuries & incidents, Budget & approvals, PT/sports periods, Messages) --
// never as a shortcut for something that could have been wired.
export function GapNotice({ feature }: { feature: string }) {
  return (
    <div className="sports-scope">
      <div
        style={{
          marginTop: 40,
          padding: "40px 32px",
          textAlign: "center",
          background: "#fff",
          border: "1px solid var(--sport-border)",
          borderRadius: "var(--sport-radius-card)",
          fontSize: 14,
          color: "var(--sport-tertiary)",
          maxWidth: 560,
        }}
      >
        {feature} isn&apos;t available yet -- this screen is fully designed and will work as soon as the backend for it is built. Nothing here is fake data.
      </div>
    </div>
  );
}
