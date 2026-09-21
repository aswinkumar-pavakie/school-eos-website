// Canteen counter's Ledger screen -- see LedgerForm.tsx's own header comment
// for the full amount -> Move to ledger -> (simulated card tap) -> charge
// -> receipt flow. This page itself is just the frame around it. Moved
// under its own /canteen/ledger route (was the module's default landing
// page) once Dashboard became the real default at /canteen.

import { LedgerForm } from "./LedgerForm";

export default function CanteenLedgerPage() {
  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>Ledger</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
        Charge a student&rsquo;s prepaid wallet for a canteen purchase.
      </p>
      <div style={{ marginTop: 24 }}>
        <LedgerForm />
      </div>
    </div>
  );
}
